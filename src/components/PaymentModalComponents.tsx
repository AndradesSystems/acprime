import { cn } from "@/lib/utils";
import { 
  Square, 
  CheckSquare, 
  AlertCircle, 
  Info, 
  Settings2, 
  RotateCcw, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  Wallet 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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

// 1. LISTA DE PARCELAS (LADO ESQUERDO)
export function InstallmentList({ installments, selectedIds, onToggle, formatCurrency }: any) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
      <div className="shrink-0 p-3 bg-white/5 border-b border-white/10 flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-wider">
        <span className="pl-2">Parcelas Pendentes</span>
        <span className="pr-2 text-right">Valor</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 overscroll-contain">
        {installments.map((inst: any) => {
          const isSelected = selectedIds.has(inst.id);
          const isOverdue = new Date(inst.dataVencimento) < new Date();
          const taxaInst = Number(inst.taxa || 0);

          return (
            <div
              key={inst.id}
              onClick={() => onToggle(inst.id)}
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
              <span className={cn("font-mono font-medium text-sm sm:text-base", isSelected ? "text-blue-400" : "text-white")}>
                {formatCurrency(Number(inst.valor) + taxaInst)}
              </span>
            </div>
          );
        })}
        <div className="h-4 w-full"></div>
      </div>
    </div>
  );
}

// 2. CARD DE VALORES (RESUMO)
export function PaymentSummaryCard({ isParcelado, summary, isCustomPayment, customTaxValue, setCustomTaxValue, handleZeroTax, formatCurrency }: any) {
  return (
    <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/10">
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
  );
}

// 3. GRADE DE BOTÕES DE AÇÃO (ATUALIZADA COM AMORTIZAÇÃO)
export function PaymentActions({
  isCustomPayment,
  isParcelado,
  selectedCount,
  isPending,
  total,
  setIsCustomPayment,
  setCustomTaxValue,
  handlePayJurosCustom,
  handleQuitCustom,
  handlePay,
  handleQuit,
  handleAmortize // 🆕 Propriedade da nova função injetada
}: any) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-auto">
      {isCustomPayment ? (
        <>
          <Button
            variant="ghost"
            className="w-full h-9 border border-white/10 text-[10px] uppercase tracking-widest bg-blue-600/20 text-blue-400"
            onClick={() => { setIsCustomPayment(false); setCustomTaxValue(""); }}
          >
            <Settings2 className="w-3 h-3 mr-2" /> Cancelar Ajuste
          </Button>

          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg"
            onClick={handlePayJurosCustom}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin" /> : (
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-sm">Pagar Juros com Nova Taxa</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-10 text-xs"
            onClick={handleQuitCustom}
            disabled={isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Quitar com Nova Taxa
          </Button>
        </>
      ) : (
        <>
          {(!isParcelado || selectedCount <= 1) && (
            <Button
              variant="ghost"
              className="w-full h-9 border border-white/10 text-[10px] uppercase tracking-widest text-gray-400"
              onClick={() => { setIsCustomPayment(true); setCustomTaxValue(""); }}
            >
              <Settings2 className="w-3 h-3 mr-2" /> Personalizar Taxa
            </Button>
          )}

          {isParcelado && selectedCount > 1 && (
            <div className="text-[10px] text-gray-500 text-center py-1 italic">
              Remova seleções para permitir personalizar a taxa.
            </div>
          )}

          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg"
            onClick={handlePay}
            disabled={isPending || (isParcelado && total <= 0)}
          >
            {isPending ? <Loader2 className="animate-spin" /> : (
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-sm">{isParcelado ? "Pagar Seleção" : "Pagar Juros"}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            )}
          </Button>

          {/* 🆕 BOTÃO INSERIDO: AMORTIZAR SALDO DEVEDOR PRINCIPAL */}
          <Button
            variant="outline"
            className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-10 text-xs"
            onClick={handleAmortize}
            disabled={isPending}
          >
            <Wallet className="w-4 h-4 mr-2" /> Amortizar Saldo
          </Button>

          <Button
            variant="outline"
            className="w-full border-green-500/20 text-green-500 hover:bg-green-500/10 h-10 text-xs"
            onClick={handleQuit}
            disabled={isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Quitar Contrato
          </Button>
        </>
      )}
    </div>
  );
}