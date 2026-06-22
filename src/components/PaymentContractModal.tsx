import { useState, useEffect, useMemo } from "react";
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
import type { Contract } from "@/services/contracts";
import { cn } from "@/lib/utils";

import { usePaymentContract } from "./usePaymentContract";

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
  const props = usePaymentContract(open, initialData, onClose, onUpdatedContract);
  const { activeContract, isLoading, isParcelado, selectedIds, summary, isCustomPayment, customTaxValue, pendingInstallments } = props;

  // Estados baseados estritamente na interface AmortizePaymentPayload
  const [valPrincipal, setValPrincipal] = useState("");
  const [valJuros, setValJuros] = useState("");
  const [valTaxa, setValTaxa] = useState("");
  const [observacao, setObservacao] = useState("");

  // Cálculo automático do Total Geral Pago (valorPago)
  const totalGeralPago = useMemo(() => {
    const p = Number(valPrincipal) || 0;
    const j = Number(valJuros) || 0;
    const t = Number(valTaxa) || 0;
    return p + j + t;
  }, [valPrincipal, valJuros, valTaxa]);

  if (!activeContract) return null;

  // Envio dos dados estruturados exatamente como a API espera
  const handleConfirmAmortize = () => {
    if (totalGeralPago <= 0) return;

    // ✅ CORRIGIDO: "tipo" agora recebe "AMORTIZACAO" fixo seguindo as regras de tipos de pagamentos
    const payload = {
      tipo: "AMORTIZACAO" as const, 
      valorPago: totalGeralPago,
      valorDestinadoPrincipal: Number(valPrincipal) || 0,
      valorDestinadoJuros: Number(valJuros) || 0,
      valorDestinadoTaxa: Number(valTaxa) || 0,
      observacao: observacao.trim() || undefined,
    };

    props.handleAmortize(payload);
    
    // Limpa o formulário após o envio
    setValPrincipal("");
    setValJuros("");
    setValTaxa("");
    setObservacao("");
  };

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
                {props.formatCurrency(Number(activeContract.valorEmAberto))}
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

            {/* LADO ESQUERDO: PARCELADO */}
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
                        onClick={() => props.toggleInstallment(inst.id)}
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
                                <AlertCircle className="w-3 h-3" /> Atrasada ({props.formatCurrency(taxaInst)} multa)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className={cn("font-mono font-medium text-sm sm:text-base", isSelected ? "text-blue-400" : "text-white")}>
                            {props.formatCurrency(Number(inst.valor) + taxaInst)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="h-4 w-full"></div>
                </div>
              </div>
            )}

            {/* LADO DIREITO / RESUMO */}
            <div className={cn(
              "bg-[#020617] border-white/10 flex flex-col p-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none",
              isParcelado ? "shrink-0 w-full md:w-[350px] border-t md:border-t-0 md:border-l" : "w-full"
            )}>
              <div className="mb-4">
                <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  
                  {!isParcelado && (
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-400">Valor Emprestado</span>
                      <span className="text-white font-mono">{props.formatCurrency(summary.valorEmprestado)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">{isParcelado ? "Principal Selecionado" : "Juros do Ciclo"}</span>
                    <span className="text-white font-mono">{props.formatCurrency(summary.principalTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400 font-medium">Multas/Taxas</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(summary.taxaTotal > 0 ? "text-red-400" : "text-gray-400", "font-mono")}>
                        {props.formatCurrency(summary.taxaTotal)}
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
                            <AlertDialogAction onClick={props.handleZeroTax} className="bg-red-600">Sim, Zerar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

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
                          onChange={(e) => props.setCustomTaxValue(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs sm:text-sm font-bold text-gray-300">Total a Pagar</span>
                    <span className="text-xl sm:text-2xl font-bold text-gold font-mono">{props.formatCurrency(summary.total)}</span>
                  </div>
                </div>
              </div>

              {/* BOTÕES DE CONTROLE */}
              <div className="grid grid-cols-1 gap-2 mt-auto">
                {isCustomPayment ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full h-9 border border-white/10 text-[10px] uppercase tracking-widest bg-blue-600/20 text-blue-400"
                      onClick={() => { props.setIsCustomPayment(false); props.setCustomTaxValue(""); }}
                    >
                      <Settings2 className="w-3 h-3 mr-2" />
                      Cancelar Ajuste
                    </Button>

                    <Button
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg"
                      onClick={props.handlePayJurosCustom}
                      disabled={props.isPending}
                    >
                      {props.isPending ? <Loader2 className="animate-spin" /> : (
                        <div className="flex items-center justify-between w-full px-2">
                          <span className="text-sm">Pagar Juros com Nova Taxa</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-10 text-xs"
                      onClick={props.handleQuitCustom}
                      disabled={props.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Quitar com Nova Taxa
                    </Button>
                  </>
                ) : (
                  <>
                    {(!isParcelado || selectedIds.size <= 1) && (
                      <Button
                        variant="ghost"
                        className="w-full h-9 border border-white/10 text-[10px] uppercase tracking-widest text-gray-400"
                        onClick={() => { props.setIsCustomPayment(true); props.setCustomTaxValue(""); }}
                      >
                        <Settings2 className="w-3 h-3 mr-2" />
                        Personalizar Taxa
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
                      onClick={props.handlePay}
                      disabled={props.isPending || (isParcelado && summary.total <= 0)}
                    >
                      {props.isPending ? <Loader2 className="animate-spin" /> : (
                        <div className="flex items-center justify-between w-full px-2">
                          <span className="text-sm">
                            {isParcelado ? "Pagar Seleção" : "Pagar Juros"}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                      )}
                    </Button>

                    {/* ALERTDIALOG DA AMORTIZAÇÃO COMPLETA */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-10 text-xs"
                          disabled={props.isPending}
                        >
                          <Wallet className="w-4 h-4 mr-2" /> Amortizar Saldo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#0f172a] border-white/10 text-white max-w-lg w-[95%] rounded-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-amber-500" /> Detalhar Amortização
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Informe a distribuição do valor pago pelo cliente para o abatimento do saldo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* Formulário com os campos da interface */}
                        <div className="space-y-4 my-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Principal</label>
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="bg-black/40 border-white/10 text-white h-9 text-xs font-mono"
                                value={valPrincipal}
                                onChange={(e) => setValPrincipal(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Juros</label>
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="bg-black/40 border-white/10 text-white h-9 text-xs font-mono"
                                value={valJuros}
                                onChange={(e) => setValJuros(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Taxas</label>
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="bg-black/40 border-white/10 text-white h-9 text-xs font-mono"
                                value={valTaxa}
                                onChange={(e) => setValTaxa(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Caixa de Texto da Observação */}
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Observação (Opcional)</label>
                            <Input
                              placeholder="Motivo da amortização..."
                              className="bg-black/40 border-white/10 text-white h-9 text-xs"
                              value={observacao}
                              onChange={(e) => setObservacao(e.target.value)}
                            />
                          </div>

                          {/* Painel do Total Geral Calculado */}
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 flex justify-between items-center font-mono">
                            <span className="text-xs font-medium text-amber-400">Total Geral Pago:</span>
                            <span className="text-base font-bold text-white">
                              {props.formatCurrency(totalGeralPago)}
                            </span>
                          </div>
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
                            onClick={() => {
                              setValPrincipal("");
                              setValJuros("");
                              setValTaxa("");
                              setObservacao("");
                            }}
                          >
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleConfirmAmortize} 
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                            disabled={totalGeralPago <= 0 || props.isPending} // ✅ Bloqueia cliques duplos durante a requisição
                          >
                            {props.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirmar Amortização"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      variant="outline"
                      className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-10 text-xs"
                      onClick={props.handleQuit}
                      disabled={props.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Quitar Contrato
                    </Button>
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}