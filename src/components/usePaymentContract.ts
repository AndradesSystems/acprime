import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { getContractById } from "@/services/contracts";
import type { Contract, AmortizePaymentPayload } from "@/services/contracts";
import { toast } from "sonner";

export function usePaymentContract(
  open: boolean,
  initialData: Contract | null,
  onClose: () => void,
  onUpdatedContract?: (updated: Contract) => void
) {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customTaxValue, setCustomTaxValue] = useState<string>("");
  const [isCustomPayment, setIsCustomPayment] = useState(false);

  const { data: fullContract, isLoading } = useQuery({
    queryKey: ["contract-detail", initialData?.id],
    queryFn: () => getContractById(initialData!.id),
    enabled: open && !!initialData?.id,
    staleTime: 0,
  });

  const activeContract = fullContract || initialData;

  const isParcelado =
    activeContract?.periodicity === "DAILY" ||
    activeContract?.periodicity === "WEEKLY" ||
    activeContract?.periodicity === "PARCELADO";

  useEffect(() => {
    if (open && activeContract?.installments) {
      const firstPending = activeContract.installments
        .sort((a, b) => a.numeroParcela - b.numeroParcela)
        .find((i) => i.status === "PENDENTE");

      if (firstPending && isParcelado) {
        setSelectedIds(new Set([firstPending.id]));
      } else {
        setSelectedIds(new Set());
      }
      setIsCustomPayment(false);
      setCustomTaxValue("");
    }
  }, [open, activeContract?.id, isParcelado]);

  const { pendingInstallments } = useMemo(() => {
    if (!activeContract?.installments)
      return { pendingInstallments: [], paidInstallments: [] };

    const sorted = [...activeContract.installments].sort(
      (a, b) => a.numeroParcela - b.numeroParcela
    );

    return {
      paidInstallments: sorted.filter((i) => i.status === "PAGO"),
      pendingInstallments: sorted.filter((i) => i.status === "PENDENTE"),
    };
  }, [activeContract]);

  useEffect(() => {
    if (selectedIds.size > 1 && isCustomPayment) {
      setIsCustomPayment(false);
      setCustomTaxValue("");
      toast.info("A personalização de taxa foi desabilitada pois múltiplas parcelas foram selecionadas.");
    }
  }, [selectedIds, isCustomPayment]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const summary = useMemo(() => {
    if (!activeContract) return { total: 0, taxaTotal: 0, principalTotal: 0, valorEmprestado: 0, count: 0, descricao: "" };

    if (!isParcelado) {
      const valorEmprestado = Number(activeContract.valorPrincipal || 0);
      const juros = valorEmprestado * (Number(activeContract.jurosPercent) / 100);
      const taxaContrato = Number(activeContract.taxa || 0);
      const taxaEfetiva = isCustomPayment ? Number(customTaxValue || 0) : taxaContrato;

      return {
        valorEmprestado,
        principalTotal: juros,
        taxaTotal: taxaEfetiva,
        total: valorEmprestado + juros + taxaEfetiva,
        descricao: "Juros do Ciclo + Principal + Taxas",
        count: 0,
      };
    }

    const selectedInstallments = pendingInstallments.filter((i) => selectedIds.has(i.id));
    const principalTotal = selectedInstallments.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const taxaOriginal = selectedInstallments.reduce((acc, curr) => acc + Number(curr.taxa || 0), 0);
    const taxaEfetiva = isCustomPayment ? Number(customTaxValue || 0) : taxaOriginal;

    return {
      valorEmprestado: 0,
      principalTotal,
      taxaTotal: taxaEfetiva,
      total: principalTotal + taxaEfetiva,
      count: selectedInstallments.length,
      descricao: `${selectedInstallments.length} parcela(s) selecionada(s)`,
    };
  }, [isParcelado, activeContract, pendingInstallments, selectedIds, isCustomPayment, customTaxValue]);

  // Mutação unificada: aceita todos os campos opcionais que a Amortização precisa enviar
  const paymentMutation = useMutation({
    mutationFn: async (payload: {
      tipo: "JUROS" | "PRINCIPAL" | "MISTO" | "PERSONALIZADO" | "AMORTIZACAO"; // ✅ Adicionado tipo AMORTIZACAO
      valorPago: number;
      valorDestinadoTaxa?: number;
      valorDestinadoPrincipal?: number;
      valorDestinadoJuros?: number;
      observacao?: string;
    }) => {
      if (!activeContract) throw new Error("Sem contrato");
      const { data } = await api.post(`/payment/contracts/${activeContract.id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Operação realizada com sucesso!");
      if (data?.contract) onUpdatedContract?.(data.contract);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["contract-detail"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao processar o pagamento");
    },
  });

  const toggleInstallment = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePay = () => {
    if (!activeContract || summary.total <= 0) return;
    paymentMutation.mutate({
      tipo: isParcelado ? "MISTO" : (isCustomPayment ? "PERSONALIZADO" : "JUROS"),
      valorPago: isParcelado ? summary.total : summary.principalTotal + summary.taxaTotal,
      valorDestinadoTaxa: isCustomPayment ? Number(customTaxValue || 0) : undefined,
      observacao: isCustomPayment
        ? `Pagamento Personalizado: Taxa ajustada para ${formatCurrency(Number(customTaxValue))}`
        : isParcelado
          ? `Pagamento de ${summary.count} parcela(s) selecionada(s).`
          : "Pagamento de Juros do Ciclo",
    });
  };

  const handlePayJurosCustom = () => {
    if (!activeContract) return;
    const customTax = Number(customTaxValue || 0);
    paymentMutation.mutate({
      tipo: isParcelado ? "MISTO" : "PERSONALIZADO",
      valorPago: isParcelado ? summary.total : summary.principalTotal + customTax,
      valorDestinadoTaxa: customTax,
      observacao: `Pagamento Personalizado: Juros/Seleção com Taxa ajustada para ${formatCurrency(customTax)}`,
    });
  };

  const handleQuit = () => {
    if (!activeContract) return;
    const valorQuitacao = Number(activeContract.valorEmAberto || 0) + Number(activeContract.taxa || 0);
    paymentMutation.mutate({
      tipo: "MISTO",
      valorPago: valorQuitacao,
      observacao: "Quitação Total",
    });
  };

  const handleQuitCustom = () => {
    if (!activeContract) return;
    const customTax = Number(customTaxValue || 0);
    const valorQuitacao = Number(activeContract.valorEmAberto || 0) + customTax;
    paymentMutation.mutate({
      tipo: isParcelado ? "MISTO" : "PERSONALIZADO",
      valorPago: valorQuitacao,
      valorDestinadoTaxa: customTax,
      observacao: `Quitação Total com Taxa ajustada para ${formatCurrency(customTax)}`,
    });
  };

  // 🆕 FUNÇÃO DE AMORTIZAÇÃO CORRIGIDA: Agora dispara usando a rota comum passando tipo: "AMORTIZACAO"
  const handleAmortize = (inputData: Omit<AmortizePaymentPayload, "tipo">) => {
    if (!activeContract) return;

    paymentMutation.mutate({
      tipo: "AMORTIZACAO", // ✅ Injeta corretamente o Tipo de Pagamento
      valorPago: inputData.valorPago,
      valorDestinadoPrincipal: inputData.valorDestinadoPrincipal,
      valorDestinadoJuros: inputData.valorDestinadoJuros,
      valorDestinadoTaxa: inputData.valorDestinadoTaxa,
      observacao: inputData.observacao,
    });
  };

  const handleZeroTax = () => {
    setCustomTaxValue("0");
    if (!isCustomPayment) setIsCustomPayment(true);
    toast.info("Taxa zerada para este pagamento.");
  };

  return {
    activeContract,
    isLoading,
    isParcelado,
    pendingInstallments,
    selectedIds,
    customTaxValue,
    isCustomPayment,
    summary,
    isPending: paymentMutation.isPending,
    setCustomTaxValue,
    setIsCustomPayment,
    toggleInstallment,
    handlePay,
    handlePayJurosCustom,
    handleQuit,
    handleQuitCustom,
    handleAmortize, 
    handleZeroTax,
    formatCurrency,
  };
}