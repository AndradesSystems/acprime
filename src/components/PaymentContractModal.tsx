import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  AlertCircle,
  Wallet,
  ArrowRight,
  Loader2,
  Square,
  CheckSquare,
  Settings2,
  RotateCcw,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { getContractById } from "@/services/contracts";
import type { Contract } from "@/services/contracts";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onUpdatedContract?: (updated: Contract) => void;
};

export default function PaymentContractModal({
  open,
  contract: initialData,
  onClose,
  onUpdatedContract,
}: Props) {
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
    activeContract?.periodicity === "WEEKLY";

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

  const summary = useMemo(() => {
    if (!activeContract) return { total: 0, taxaTotal: 0, principalTotal: 0, valorEmprestado: 0, count: 0, descricao: "" };

    // Regra para Contrato Mensal
    if (!isParcelado) {
      const valorEmprestado = Number(activeContract.valorPrincipal || 0);
      const juros = valorEmprestado * (Number(activeContract.jurosPercent) / 100);
      const taxaContrato = Number(activeContract.taxa || 0);
      const taxaEfetiva = isCustomPayment ? Number(customTaxValue || 0) : taxaContrato;

      return {
        valorEmprestado,
        principalTotal: juros, // Mantido como juros para alimentar a linha correspondente
        taxaTotal: taxaEfetiva,
        total: valorEmprestado + juros + taxaEfetiva, // Agora soma tudo: 1000 + 400 + taxa
        descricao: "Juros do Ciclo + Principal + Taxas",
        count: 0,
      };
    }

    // Regra para Contrato Parcelado (Diário/Semanal)
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

  const paymentMutation = useMutation({
    mutationFn: async (payload: {
      tipo: "JUROS" | "PRINCIPAL" | "MISTO";
      valorPago: number;
      valorDestinadoTaxa?: number;
      observacao?: string;
    }) => {
      if (!activeContract) throw new Error("Sem contrato");
      const { data } = await api.post(`/payment/contracts/${activeContract.id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Pagamento realizado com sucesso!");
      onUpdatedContract?.(data.contract);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["contract-detail"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao processar pagamento");
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
      tipo: isParcelado ? "MISTO" : "JUROS",
      valorPago: isParcelado ? summary.total : summary.principalTotal + summary.taxaTotal, // No botão "Pagar Juros" envia apenas o juros + taxa se preferir separar do principal na rota de juros pura.
      valorDestinadoTaxa: isCustomPayment ? Number(customTaxValue || 0) : undefined,
      observacao: isCustomPayment
        ? `Pagamento Personalizado: Taxa ajustada para ${formatCurrency(Number(customTaxValue))}`
        : isParcelado
          ? `Pagamento de ${summary.count} parcela(s) selecionada(s).`
          : "Pagamento de Juros do Ciclo",
    });
  };

  const handleQuit = () => {
    if (!activeContract) return;
    const valorQuitacao = Number(activeContract.valorEmAberto || 0) + Number(activeContract.taxa || 0);

    paymentMutation.mutate({
      tipo: "MISTO",
      valorPago: valorQuitacao,
      observacao: "Quitação Total"
    });
  };

  const handleZeroTax = () => {
    setCustomTaxValue("0");
    if (!isCustomPayment) setIsCustomPayment(true);
    toast.info("Taxa zerada para este pagamento.");
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  if (!activeContract) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className={cn(
        "bg-[#071e30] border-white/10 text-white p-0 overflow-hidden flex flex-col [&>button]:hidden transition-all",
        isParcelado ? "max-w-5xl h-[100dvh] sm:h-[90vh]" : "max-w-md h-auto"
      )}>

        {/* CABEÇALHO */}
        <DialogHeader className="shrink-0 p-4 md:p-6 border-b border-white/10 bg-white/5 flex flex-row justify-between items-center space-y-0 z-20">
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-lg md:text-xl flex items-center gap-2 text-white font-bold">
              <Wallet className="text-gold w-5 h-5 md:w-6 md:h-6" />
              Pagamento
            </DialogTitle>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs md:text-sm text-gray-400 truncate max-w-[140px] sm:max-w-xs italic">
                {activeContract.client?.nome}
              </p>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-gray-400 uppercase text-[9px] px-1.5 h-4">
                {activeContract.periodicity}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 ml-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none mb-1">Em Aberto</p>
              <p className="text-lg md:text-2xl font-black text-white leading-none font-mono">
                {formatCurrency(Number(activeContract.valorEmAberto))}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full h-9 w-9 md:h-10 md:w-10 transition-all active:scale-95 shrink-0"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="h-60 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-gold" />
            <p>Carregando...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

            {/* LADO ESQUERDO: APENAS SE FOR PARCELADO */}
            {isParcelado && (
              <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                <div className="shrink-0 p-3 bg-white/5 border-b border-white/10 flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  <span className="pl-2">Parcelas Pendentes</span>
                  <span className="pr-2 text-right">Valor</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 overscroll-contain">
                  {pendingInstallments.map((inst) => {
                    const isSelected = selectedIds.has(inst.id);
                    const isOverdue = new Date(inst.dataVencimento) < new Date();
                    const taxaInst = Number(inst.taxa || 0);

                    return (
                      <div
                        key={inst.id}
                        onClick={() => toggleInstallment(inst.id)}
                        className={cn(
                          "flex items-center justify-between p-3 sm:p-4 rounded-lg cursor-pointer transition-all border group",
                          isSelected ? "bg-blue-500/10 border-blue-500" : "bg-white/5 border-white/5 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500 shrink-0" /> : <Square className="w-5 h-5 text-gray-500 group-hover:text-gray-400 shrink-0" />}
                          <div className="flex flex-col">
                            <span className={cn("font-mono font-bold text-sm", isSelected ? "text-white" : "text-gray-300")}>
                              #{inst.numeroParcela} - {new Date(inst.dataVencimento).toLocaleDateString("pt-BR")}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] sm:text-xs text-red-400 flex items-center gap-1 mt-0.5">
                                <AlertCircle className="w-3 h-3" /> Atrasada ({formatCurrency(taxaInst)} multa)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className={cn("font-mono font-medium text-sm sm:text-base", isSelected ? "text-blue-400" : "text-white")}>
                            {formatCurrency(Number(inst.valor) + taxaInst)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="h-4 w-full"></div>
                </div>
              </div>
            )}

            {/* LADO DIREITO / RESUMO COMPACTO */}
            <div className={cn(
              "bg-[#020617] border-white/10 flex flex-col p-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none",
              isParcelado ? "shrink-0 w-full md:w-[350px] border-t md:border-t-0 md:border-l" : "w-full"
            )}>
              <div className="mb-4">
                <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  
                  {/* EXIBE O VALOR EMPRESTADO APENAS SE FOR MENSAL */}
                  {!isParcelado && (
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-400">Valor Emprestado</span>
                      <span className="text-white font-mono">{formatCurrency(summary.valorEmprestado)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">{isParcelado ? "Principal Selecionado" : "Juros do Ciclo"}</span>
                    <span className="text-white font-mono">{formatCurrency(summary.principalTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400 font-medium">Multas/Taxas</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(summary.taxaTotal > 0 ? "text-red-400" : "text-gray-400", "font-mono")}>
                        {formatCurrency(summary.taxaTotal)}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-400/10">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0f172a] border-white/10 text-white w-[90%] rounded-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Zerar Taxas?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">Remover valor das taxas deste pagamento?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleZeroTax} className="bg-red-600">Sim, Zerar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* CAIXA INFORMATIVA DA TAXA CUSTOMIZADA */}
                  {isCustomPayment && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-2 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-300 leading-tight">
                          O valor inserido substituirá o valor original da taxa (para mais ou para menos). Válido exclusivamente para uma parcela por vez.
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] text-blue-400 uppercase font-bold mb-1 block">Ajustar Valor da Taxa</label>
                        <Input
                          type="number"
                          className="bg-black/40 border-blue-500/50 text-white h-8 text-sm"
                          value={customTaxValue}
                          onChange={(e) => setCustomTaxValue(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs sm:text-sm font-bold text-gray-300">Total a Pagar</span>
                    <span className="text-xl sm:text-2xl font-bold text-gold font-mono">{formatCurrency(summary.total)}</span>
                  </div>
                </div>
              </div>

              {/* CONTROLES DE BOTÃO */}
              <div className="grid grid-cols-1 gap-2 mt-auto">
                {(!isParcelado || selectedIds.size <= 1) && (
                  <Button
                    variant="ghost"
                    className={cn("w-full h-9 border border-white/10 text-[10px] uppercase tracking-widest", isCustomPayment ? "bg-blue-600/20 text-blue-400" : "text-gray-400")}
                    onClick={() => { setIsCustomPayment(!isCustomPayment); setCustomTaxValue(""); }}
                  >
                    <Settings2 className="w-3 h-3 mr-2" />
                    {isCustomPayment ? "Cancelar Ajuste" : "Personalizar Taxa"}
                  </Button>
                )}

                {isParcelado && selectedIds.size > 1 && (
                  <div className="text-[10px] text-gray-500 text-center py-1 italic">
                    Remova seleções para permitir personalizar a taxa.
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg"
                  onClick={handlePay}
                  disabled={paymentMutation.isPending || (isParcelado && summary.total <= 0)}
                >
                  {paymentMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <div className="flex items-center justify-between w-full px-2">
                      <span className="text-sm">
                        {isCustomPayment ? "Confirmar" : isParcelado ? "Pagar Seleção" : "Pagar Juros"}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-10 text-xs"
                  onClick={handleQuit}
                  disabled={paymentMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Quitar Contrato
                </Button>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}