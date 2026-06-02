import React from "react";
import { Loader2, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NegotiationInstallment } from "@/services/negotiation";

interface NegotiationTableProps {
  installments: NegotiationInstallment[];
  qtdParcelas: number;
  isNegotiationActive: boolean;
  onPayInstallment: (installmentId: string) => void;
  isPaying: boolean;
  formatCurrency: (v: number | string) => string;
  formatDate: (d: string) => string;
}

export default function NegotiationTable({
  installments,
  qtdParcelas,
  isNegotiationActive,
  onPayInstallment,
  isPaying,
  formatCurrency,
  formatDate,
}: NegotiationTableProps) {
  
  // Auxiliar para as Badges de Status das Parcelas
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO":
        return {
          label: "Pago",
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
        };
      case "ATRASADO":
        return {
          label: "Atrasado",
          className: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: <XCircle className="w-3 h-3 text-red-400" />,
        };
      default:
        return {
          label: "Pendente",
          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: <Clock className="w-3 h-3 text-amber-400" />,
        };
    }
  };

  if (!installments || installments.length === 0) {
    return (
      <p className="text-center py-6 text-sm text-muted-foreground">
        Nenhuma parcela encontrada para este acordo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🖥️ VIEW DESKTOP */}
      <div className="hidden md:block rounded-lg border border-white/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="h-10 text-xs">Parcela</TableHead>
              <TableHead className="h-10 text-xs">Valor da Parcela</TableHead>
              <TableHead className="h-10 text-xs">Data Vencimento</TableHead>
              <TableHead className="h-10 text-xs">Status</TableHead>
              <TableHead className="h-10 text-right text-xs">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map((inst) => {
              const badge = getStatusBadge(inst.status);
              return (
                <TableRow key={inst.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium py-3 text-sm">
                    {inst.numeroParcela} / {qtdParcelas}
                  </TableCell>
                  <TableCell className="py-3 font-mono text-sm text-gray-200">
                    {formatCurrency(inst.valorParcela)}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-gray-300">
                    {formatDate(inst.vencimentoEm)}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {inst.status !== "PAGO" && isNegotiationActive ? (
                      <Button
                        size="sm" // 🟢 CORRIGIDO: de "xs" para "sm" (padrão Shadcn)
                        disabled={isPaying}
                        onClick={() => onPayInstallment(inst.id)}
                        className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1 ml-auto"
                      >
                        {isPaying ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <DollarSign className="w-3 h-3" />
                        )}
                        Dar Baixa
                      </Button>
                    ) : inst.pagoEm ? (
                      <span className="text-[11px] text-gray-500 italic">
                        Pago em {formatDate(inst.pagoEm)}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 📱 VIEW MOBILE */}
      <div className="md:hidden space-y-3">
        {installments.map((inst) => {
          const badge = getStatusBadge(inst.status);
          return (
            <div key={inst.id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">
                  Parcela {inst.numeroParcela} de {qtdParcelas}
                </span>
                <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>

              <div className="flex justify-between items-end border-t border-white/5 pt-2">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Valor / Vencimento</p>
                  <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(inst.valorParcela)}</p>
                  <p className="text-[11px] text-gray-300">{formatDate(inst.vencimentoEm)}</p>
                </div>

                <div>
                  {inst.status !== "PAGO" && isNegotiationActive ? (
                    <Button
                      size="sm"
                      disabled={isPaying}
                      onClick={() => onPayInstallment(inst.id)}
                      className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
                    >
                      {isPaying ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
                      Baixar
                    </Button>
                  ) : inst.pagoEm ? (
                    <p className="text-[10px] text-gray-500 italic text-right">
                      Pago: {formatDate(inst.pagoEm)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}