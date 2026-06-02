"use client";

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
  Wallet,
  Calculator,
  Loader2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  negotiation: any | null;
  onClose: () => void;
  onPayInstallment: (installmentId: string) => void;
  isPaying: boolean;
  onBreakNegotiation: (negotiationId: string) => void;
  isBreaking: boolean;
  formatCurrency: (v: any) => string;
  formatDate: (d: string) => string;
};

export default function NegotiationHistoryModal({
  open,
  negotiation,
  onClose,
  onPayInstallment,
  isPaying,
  onBreakNegotiation,
  isBreaking,
  formatCurrency,
  formatDate,
}: Props) {
  const [selectedCount, setSelectedCount] = useState(1);

  // 1. Reseta a seleção padrão de parcelas ao abrir o modal
  useEffect(() => {
    if (open) setSelectedCount(1);
  }, [open]);

  // 2. SEPARAÇÃO DAS PARCELAS DO CRONOGRAMA (Movido para antes de qualquer return)
  const { pendingInstallments, paidInstallments } = useMemo(() => {
    if (!negotiation || !negotiation.installments) {
      return { pendingInstallments: [], paidInstallments: [] };
    }
    const sorted = [...negotiation.installments].sort(
      (a, b) => a.numeroParcela - b.numeroParcela
    );
    return {
      paidInstallments: sorted.filter((i: any) => i.status === "PAGO"),
      pendingInstallments: sorted.filter((i: any) => i.status === "PENDENTE" || i.status === "ATRASADO"),
    };
  }, [negotiation]);

  // 3. CÁLCULO DAS PARCELAS SELECIONADAS EM LOTE (Movido para antes de qualquer return)
  const summary = useMemo(() => {
    const selecteds = pendingInstallments.slice(0, selectedCount);
    // Ajustado de 'curr.valor' para 'curr.valorParcela' que vem do backend
    const total = selecteds.reduce((acc: number, curr: any) => acc + Number(curr.valorParcela || 0), 0);
    return { total, count: selecteds.length, selectedItems: selecteds };
  }, [pendingInstallments, selectedCount]);

  // 🚨 REVISEI AQUI: Se não houver renegociação ativa, não renderiza o HTML (Mas todos os hooks acima já rodaram em segurança!)
  if (!negotiation) return null;

  // --- MÉTRICAS E VALORES DO ACORDO ---
  // Ajustado para 'valorAcordado' de acordo com o backend refeito
  const valorFinalAcordado = Number(negotiation.valorAcordado || 0);
  const valorDescontoOuAcrescimo = Number(negotiation.valorDesconto || 0);
  const dividaOriginalAntesDoAcordo = valorFinalAcordado + valorDescontoOuAcrescimo;

  // Ajustado de 'c.valor' para 'c.valorParcela'
  const saldoRestanteAcordo = pendingInstallments.reduce((acc: number, c: any) => acc + Number(c.valorParcela || 0), 0);

  // --- DISPARADORES DE AÇÃO ---
  const handlePay = () => {
    if (summary.selectedItems.length === 0) return;
    
    summary.selectedItems.forEach((inst: any) => {
      onPayInstallment(inst.id);
    });
  };

  const handleBreak = () => {
    if (!negotiation.id) return;
    const confirmacao = window.confirm(
      "🚨 ATENÇÃO: Tem certeza que deseja QUEBRAR este acordo? \n\nIsso cancelará o cronograma atual de parcelas e o status do acordo mudará permanentemente para QUEBRADO."
    );
    if (confirmacao) {
      onBreakNegotiation(negotiation.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-4xl bg-[#0f172a] border-white/10 text-white p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
        
        {/* TOPBAR / HEADER */}
        <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="text-emerald-400 w-6 h-6" /> Detalhes do Acordo Firmado
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-400">
                Cliente Devedor:{" "}
                <span className="text-white font-medium">
                  {negotiation.contract?.client?.nome || "Cliente não informado"}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "border-0 uppercase font-bold",
                    negotiation.status === "PENDENTE" && "bg-yellow-500/10 text-yellow-400",
                    negotiation.status === "CONCLUIDO" && "bg-blue-500/10 text-blue-400",
                    negotiation.status === "QUEBRADO" && "bg-red-500/10 text-red-400"
                  )}
                >
                  Status: {negotiation.status}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-gray-300">
                  Plano: {negotiation.qtdParcelas || negotiation.installments?.length || 0}x parcelas
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Saldo Restante do Acordo
            </p>
            <p className="text-2xl font-bold text-cyan-400 font-mono mt-0.5">
              {formatCurrency(saldoRestanteAcordo)}
            </p>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* COLUNA ESQUERDA: LISTAGEM DO CRONOGRAMA */}
          <div className="flex-1 bg-black/20 relative flex flex-col">
            <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center text-xs text-gray-400 font-medium uppercase tracking-wider">
              <span>Parcela Acordada</span>
              <span>Vencimento</span>
              <span>Valor</span>
              <span className="pr-4">Status</span>
            </div>

            <ScrollArea className="flex-1">
              <div className="flex flex-col">
                
                {/* PARCELAS QUITADAS */}
                {paidInstallments.map((inst: any) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-3.5 border-b border-white/5 opacity-40 grayscale bg-black/5"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="font-mono text-sm text-gray-400 font-semibold">
                        #{inst.numeroParcela} / {negotiation.qtdParcelas || negotiation.installments?.length}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 line-through">
                      {formatDate(inst.vencimentoEm)}
                    </span>
                    <span className="text-sm font-medium text-gray-500 font-mono">
                      {formatCurrency(inst.valorParcela)}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                      PAGO
                    </Badge>
                  </div>
                ))}

                {/* VISUALIZAÇÃO SE JÁ TIVER LIQUIDADO TUDO */}
                {pendingInstallments.length === 0 && paidInstallments.length > 0 && (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-blue-400 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-white">Acordo Liquidado!</p>
                    <p className="text-xs max-w-xs mt-1">Este plano de renegociação foi 100% pago pelo cliente.</p>
                  </div>
                )}

                {/* PARCELAS EM ABERTO (PENDENTES/ATRASADAS) */}
                {pendingInstallments.map((inst: any, index: number) => {
                  const isSelected = index < selectedCount;
                  const isOverdue = new Date(inst.vencimentoEm) < new Date() && inst.status !== "PAGO";
                  const isAcordoAtivo = negotiation.status === "PENDENTE";

                  return (
                    <div
                      key={inst.id}
                      onClick={() => isAcordoAtivo && setSelectedCount(index + 1)}
                      className={cn(
                        "flex items-center justify-between p-4 border-b border-white/5 transition-all",
                        isAcordoAtivo ? "cursor-pointer hover:bg-white/5" : "opacity-60 pointer-events-none",
                        isSelected && isAcordoAtivo
                          ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                          : "border-l-4 border-l-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            isSelected && isAcordoAtivo
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-600"
                          )}
                        >
                          {isSelected && isAcordoAtivo && (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <span className={cn("font-mono font-bold", isSelected && isAcordoAtivo ? "text-white" : "text-gray-400")}>
                          #{inst.numeroParcela} / {negotiation.qtdParcelas || negotiation.installments?.length}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> Atrasada
                          </span>
                        )}
                      </div>
                      <span className={cn("text-sm", isSelected && isAcordoAtivo ? "text-white" : "text-gray-400")}>
                        {formatDate(inst.vencimentoEm)}
                      </span>
                      <span className={cn("font-mono font-bold", isSelected && isAcordoAtivo ? "text-blue-300" : "text-gray-300")}>
                        {formatCurrency(inst.valorParcela)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px]", 
                          isOverdue ? "text-red-400 border-red-500/20" : "text-amber-400 border-amber-500/20"
                        )}
                      >
                        {inst.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* COLUNA DIREITA: RESUMO HISTÓRICO E BOTÕES */}
          <div className="w-full md:w-[350px] bg-[#020617] border-l border-white/10 flex flex-col p-6 shadow-2xl justify-between">
            <div className="space-y-5">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" /> Histórico do Acordo
              </h4>

              {/* CARD DE CONCILIAÇÃO DA DÍVIDA ANTERIOR */}
              <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Dívida Bruta Original:</span>
                  <span className="text-gray-300 font-mono">{formatCurrency(dividaOriginalAntesDoAcordo)}</span>
                </div>

                {valorDescontoOuAcrescimo > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/10">
                    <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Desconto Concedido:</span>
                    <span className="font-bold font-mono">-{formatCurrency(valorDescontoOuAcrescimo)}</span>
                  </div>
                )}

                <Separator className="bg-white/10 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-300 uppercase">Valor Fechado do Acordo:</span>
                  <span className="text-xl font-bold text-white font-mono">{formatCurrency(valorFinalAcordado)}</span>
                </div>
              </div>

              {/* GATILHO DO VALOR DA COBRANÇA SELECIONADA */}
              {negotiation.status === "PENDENTE" && pendingInstallments.length > 0 && (
                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Lotes selecionados:</span>
                    <span className="text-white font-medium">{summary.count} parcela(s)</span>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-300 uppercase">Recebimento Atual:</span>
                    <span className="text-xl font-bold text-blue-400 font-mono">{formatCurrency(summary.total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÕES DE GERENCIAMENTO DE PIPELINE */}
            <div className="space-y-3 pt-6">
              {negotiation.status === "PENDENTE" && pendingInstallments.length > 0 ? (
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14"
                  onClick={handlePay}
                  disabled={isPaying}
                >
                  {isPaying ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    `Confirmar Recebimento (${summary.count})`
                  )}
                </Button>
              ) : negotiation.status === "CONCLUIDO" ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg text-center font-medium">
                  Este plano de acordo foi totalmente concluído e liquidado.
                </div>
              ) : negotiation.status === "QUEBRADO" ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center font-medium flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Acordo descontinuado por Quebra de Vencimentos.
                </div>
              ) : null}

              {/* ROTA SECUNDÁRIA: QUEBRA DO CONTRATO DE ACORDO */}
              {negotiation.status === "PENDENTE" && (
                <>
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-3 text-[9px] text-gray-500 uppercase tracking-widest">
                      Ruptura Contratual
                    </span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-red-500/25 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-10 text-xs font-semibold transition-colors"
                    onClick={handleBreak}
                    disabled={isBreaking}
                  >
                    {isBreaking ? (
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-2" />
                    )}
                    Marcar Acordo como Quebrado
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}