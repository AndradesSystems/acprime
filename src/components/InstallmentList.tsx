import { cn } from "@/lib/utils";
import { CheckSquare, Square, AlertCircle } from "lucide-react";

export const InstallmentList = ({ installments, selectedIds, onToggle, formatCurrency }: any) => (
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
          <div key={inst.id} onClick={() => onToggle(inst.id)} 
            className={cn("flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border group", 
            isSelected ? "bg-blue-500/10 border-blue-500" : "bg-white/5 border-white/5 hover:border-white/20")}>
            <div className="flex items-center gap-3">
              {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-gray-500" />}
              <div className="flex flex-col">
                <span className={cn("font-mono font-bold text-sm", isSelected ? "text-white" : "text-gray-300")}>
                  #{inst.numeroParcela} - {new Date(inst.dataVencimento).toLocaleDateString("pt-BR")}
                </span>
                {isOverdue && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Atrasada</span>}
              </div>
            </div>
            <span className={cn("font-mono font-medium", isSelected ? "text-blue-400" : "text-white")}>
              {formatCurrency(Number(inst.valor) + taxaInst)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);