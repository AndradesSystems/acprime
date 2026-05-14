import { Card } from "@/components/ui/card";
import { Wallet, Percent, TrendingUp, CheckCircle2 } from "lucide-react";

// Tipagem para garantir que o componente entenda a nova estrutura
interface SubInfo {
  // Total Emprestado
  diario?: number;
  semanal?: number;
  mensal?: number;
  // Juros (Estrutura nova)
  jurosMensal?: number;
  jurosParcelado?: number;
  taxas?: number;
  // Montante
  parcelas?: number;
  // Recebido
  viaParcelas?: number;
  viaMensal?: number;
  viaTaxas?: number;
}

type Props = {
  type: "TOTAL_EMPRESTADO" | "JUROS_A_RECEBER" | "MONTANTE_TOTAL" | "TOTAL_RECEBIDO";
  value: number;
  subInfo?: SubInfo; 
};

export default function FinanceSummaryCard({ type, value, subInfo }: Props) {
  const format = (v: number | undefined) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v ?? 0);

  const config = {
    TOTAL_EMPRESTADO: {
      label: "Total Emprestado (Ativo)",
      icon: <Wallet className="w-5 h-5 text-blue-500" />,
    },
    JUROS_A_RECEBER: {
      label: "Juros + Taxas a Receber",
      icon: <Percent className="w-5 h-5 text-yellow-500" />,
    },
    MONTANTE_TOTAL: {
      label: "Montante a Receber (No Período)",
      icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
    },
    TOTAL_RECEBIDO: {
      label: "Total Recebido (No Período)",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    },
  }[type];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-white/5 shadow-xl min-h-[140px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {config.label}
        </p>
        <div className="p-2 bg-white/5 rounded-lg">{config.icon}</div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-white">
          {format(value)}
        </p>

        {/* ÁREA DE DETALHAMENTO (SUB-INFOS) */}
        {subInfo && (
          <div className="mt-2 flex flex-col gap-1 text-[10px] text-muted-foreground font-medium border-t border-white/5 pt-2">
            
            {/* Detalhes para Total Emprestado */}
            {type === "TOTAL_EMPRESTADO" && (
              <>
                <div className="flex justify-between"><span>Diário:</span><span className="text-white">{format(subInfo.diario)}</span></div>
                <div className="flex justify-between"><span>Semanal:</span><span className="text-white">{format(subInfo.semanal)}</span></div>
                <div className="flex justify-between"><span>Mensal:</span><span className="text-white">{format(subInfo.mensal)}</span></div>
              </>
            )}

            {/* Detalhes para Juros e Taxas - AJUSTADO AQUI */}
            {type === "JUROS_A_RECEBER" && (
              <>
                <div className="flex justify-between">
                  <span>Juros Mensais:</span>
                  <span className="text-white">{format(subInfo.jurosMensal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Juros Parcelados:</span>
                  <span className="text-white">{format(subInfo.jurosParcelado)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas:</span>
                  <span className="text-blue-400">{format(subInfo.taxas)}</span>
                </div>
              </>
            )}

            {/* Detalhes para Montante a Receber */}
            {type === "MONTANTE_TOTAL" && (
              <>
                <div className="flex justify-between"><span>Parcelas (D/S):</span><span className="text-white">{format(subInfo.parcelas)}</span></div>
                <div className="flex justify-between"><span>Contratos Mensais:</span><span className="text-white">{format(subInfo.mensal)}</span></div>
              </>
            )}

            {/* Detalhes para Total Recebido */}
            {type === "TOTAL_RECEBIDO" && (
              <>
                <div className="flex justify-between"><span>Via Parcelas:</span><span className="text-white">{format(subInfo.viaParcelas)}</span></div>
                <div className="flex justify-between"><span>Via Mensal:</span><span className="text-white">{format(subInfo.viaMensal)}</span></div>
                <div className="flex justify-between"><span>Taxas/Multas:</span><span className="text-blue-400">{format(subInfo.viaTaxas)}</span></div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}