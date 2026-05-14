import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowRight,
  Calculator,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getContractById } from "@/services/contracts";
import { payFullContract, createPayment } from "@/services/payment"; // ✅ Serviços importados
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
  const [selectedCount, setSelectedCount] = useState(1);

  // --- BUSCA DADOS COMPLETOS ---
  const { data: fullContract, isLoading } = useQuery({
    queryKey: ["contract-detail", initialData?.id],
    queryFn: () => getContractById(initialData!.id),
    enabled: open && !!initialData?.id,
    staleTime: 0,
  });

  const activeContract = fullContract || initialData;

  useEffect(() => {
    if (open) setSelectedCount(1);
  }, [open]);

  // --- LÓGICA DE DADOS ---
  const isParcelado =
    activeContract?.periodicity === "DAILY" ||
    activeContract?.periodicity === "WEEKLY";
  const taxaAcumuladaTotal = Number(activeContract?.taxa || 0);
  const valorEmAberto = Number(activeContract?.valorEmAberto || 0);

  const { pendingInstallments, paidInstallments } = useMemo(() => {
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

  const summary = useMemo(() => {
    if (!isParcelado) {
      const juros =
        Number(activeContract?.valorPrincipal) *
        (Number(activeContract?.jurosPercent) / 100);
      return { total: juros + taxaAcumuladaTotal, descricao: "Juros + Taxas" };
    }
    const selecteds = pendingInstallments.slice(0, selectedCount);
    const total =
      selecteds.reduce((acc, curr) => acc + Number(curr.valor), 0) +
      taxaAcumuladaTotal;
    return { total, count: selecteds.length };
  }, [
    isParcelado,
    activeContract,
    pendingInstallments,
    selectedCount,
    taxaAcumuladaTotal,
  ]);

  // --- MUTATIONS ---

  // Função auxiliar para limpar cache e fechar
  const handleSuccess = (updatedContract: any) => {
    onUpdatedContract?.(updatedContract);
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
    queryClient.invalidateQueries({
      queryKey: ["contract-detail", activeContract?.id],
    });
    onClose();
  };

  const paymentMutation = useMutation({
    mutationFn: (payload: {
      tipo: any;
      valorPago: number;
      observacao?: string;
    }) => createPayment(activeContract!.id, payload),
    onSuccess: (data) => {
      toast.success("Pagamento realizado com sucesso!");
      handleSuccess(data.contract);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Erro no pagamento"),
  });

  const quitMutation = useMutation({
    mutationFn: () => payFullContract(activeContract!.id), // ✅ Chama rota otimizada
    onSuccess: (data) => {
      toast.success("Contrato quitado totalmente!");
      handleSuccess(data);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Erro na quitação"),
  });

  // --- HANDLERS ---
  const handlePay = () => {
    if (!activeContract) return;
    paymentMutation.mutate({
      tipo: isParcelado ? "MISTO" : "JUROS",
      valorPago: summary.total,
      observacao: isParcelado
        ? `Pagamento de ${summary.count} parcela(s).`
        : "Renovação de Ciclo",
    });
  };

  const handleQuit = () => {
    if (!activeContract) return;
    quitMutation.mutate(); // ✅ Usa a mutation dedicada
  };

  if (!activeContract) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-4xl bg-[#0f172a] border-white/10 text-white p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="text-gold w-6 h-6" /> Pagamento de Contrato
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-400">
                Cliente:{" "}
                <span className="text-white font-medium">
                  {activeContract.client?.nome}
                </span>
              </p>
              <div className="flex gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="border-white/20 text-gray-300 uppercase"
                >
                  {activeContract.periodicity}
                </Badge>
                {taxaAcumuladaTotal > 0 && (
                  <Badge
                    variant="destructive"
                    className="bg-red-500/20 text-red-400 border-0"
                  >
                    Atraso: {taxaAcumuladaTotal}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase">
              Saldo Devedor Total
            </p>
            <p className="text-2xl font-bold text-white">
              R$ {valorEmAberto.toFixed(2)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-gold" />
            <p>Carregando parcelas...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* ESQUERDA: LISTA DE PARCELAS */}
            <div className="flex-1 bg-black/20 relative flex flex-col">
              {!isParcelado ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10 text-center">
                  <Calendar className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Contrato Mensal
                  </h3>
                  <p className="max-w-xs">
                    Renovação de juros baseada no ciclo mensal.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center text-xs text-gray-400 font-medium uppercase">
                    <span>Parcela</span>
                    <span>Vencimento</span>
                    <span>Valor</span>
                    <span className="pr-4">Status</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                      {paidInstallments.map((inst) => (
                        <div
                          key={inst.id}
                          className="flex items-center justify-between p-3 border-b border-white/5 opacity-50 grayscale"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-mono text-sm text-gray-400">
                              #{inst.numeroParcela}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 line-through">
                            {new Date(inst.dataVencimento).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            R$ {Number(inst.valor).toFixed(2)}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-green-500 border-green-500/30"
                          >
                            PAGO
                          </Badge>
                        </div>
                      ))}

                      {pendingInstallments.map((inst, index) => {
                        const isSelected = index < selectedCount;
                        const isOverdue =
                          new Date(inst.dataVencimento) < new Date();
                        return (
                          <div
                            key={inst.id}
                            onClick={() => setSelectedCount(index + 1)}
                            className={cn(
                              "flex items-center justify-between p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5",
                              isSelected
                                ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                                : "border-l-4 border-l-transparent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center",
                                  isSelected
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-600"
                                )}
                              >
                                {isSelected && (
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "font-mono font-bold",
                                  isSelected ? "text-white" : "text-gray-400"
                                )}
                              >
                                #{inst.numeroParcela}
                              </span>
                              {isOverdue && (
                                <span className="text-[10px] bg-red-500 text-white px-1.5 rounded">
                                  Atrasada
                                </span>
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-sm",
                                isSelected ? "text-white" : "text-gray-400"
                              )}
                            >
                              {new Date(inst.dataVencimento).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                            <span
                              className={cn(
                                "font-mono font-medium",
                                isSelected ? "text-blue-300" : "text-gray-300"
                              )}
                            >
                              R$ {Number(inst.valor).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>

            {/* DIREITA: RESUMO FINANCEIRO */}
            <div className="w-full md:w-[350px] bg-[#020617] border-l border-white/10 flex flex-col p-6 shadow-2xl">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Resumo do Pagamento
                </h4>

                <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Itens selecionados</span>
                    <span className="text-white">
                      {isParcelado
                        ? `${summary.count} parcela(s)`
                        : "Renovação Mensal"}
                    </span>
                  </div>

                  {taxaAcumuladaTotal > 0 && (
                    <div className="flex justify-between text-sm text-red-300 bg-red-500/10 p-2 rounded">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Taxas/Multas
                      </span>
                      <span className="font-bold">
                        R$ {taxaAcumuladaTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Separator className="bg-white/10 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-gray-300">
                      Total a Pagar
                    </span>
                    <span className="text-2xl font-bold text-gold">
                      R$ {summary.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14"
                  onClick={handlePay}
                  disabled={
                    paymentMutation.isPending ||
                    quitMutation.isPending ||
                    (isParcelado && pendingInstallments.length === 0)
                  }
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Confirmar Pagamento"
                  )}
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-xs text-gray-500 uppercase">
                    Ou
                  </span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-12"
                  onClick={handleQuit}
                  disabled={quitMutation.isPending || paymentMutation.isPending}
                >
                  {quitMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Quitar Contrato Totalmente
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
