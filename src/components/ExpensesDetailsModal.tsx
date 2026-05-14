import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import type { FinanceExpense } from "@/services/finance";

type Props = {
  open: boolean;
  expense: FinanceExpense | null;
  onClose: () => void;
};

export default function ExpenseDetailsModal({ open, expense, onClose }: Props) {
  if (!expense) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const info = [
    { label: "ID", value: expense.id },
    { label: "Descrição", value: expense.descricao },
    { label: "Tipo", value: expense.tipo },
    { label: "Valor", value: formatCurrency(Number(expense.valor)) },
    { label: "Data", value: new Date(expense.dataInicio).toLocaleDateString("pt-BR") },
    { label: "Criado em", value: new Date(expense.createdAt).toLocaleString("pt-BR") },
    { label: "Atualizado em", value: new Date(expense.updatedAt).toLocaleString("pt-BR") },
  ];

  if (expense.tipo === "PARCELADO") {
    info.splice(4, 0,
      { label: "Parcelas Total", value: String(expense.parcelasTotal ?? "-") },
      { label: "Parcela Atual", value: String(expense.parcelaAtual ?? "-") },
      { label: "Dia do mês", value: String(expense.diaDoMes ?? "-") }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-lg bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">Detalhes do Gasto</DialogTitle>
        </DialogHeader>

        <Card className="p-4 bg-card border-border/50 space-y-2">
          {info.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm gap-6">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-foreground font-medium text-right break-all">
                {row.value}
              </span>
            </div>
          ))}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
