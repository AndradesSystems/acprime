"use client";

import React, { useState } from "react";
import {
  Search,
  Receipt,
  Loader2,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Trash2,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PaymentPeriodItem, deletePayment } from "@/services/payment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PaymentsTableProps {
  payments: PaymentPeriodItem[];
  isLoading: boolean;
  formatCurrency: (v: number | string) => string;
  formatDate: (d: string) => string;
}

const PaymentsTable = ({
  payments,
  isLoading,
  formatCurrency,
  formatDate,
}: PaymentsTableProps) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      toast.success("Pagamento estornado!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payments-period"] });
    },
    onError: () => toast.error("Erro ao estornar."),
  });

  const filteredPayments = payments.filter((p) =>
    p.contract?.client?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <Card className="p-4 md:p-6 bg-card/50 border-white/10 backdrop-blur-md">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 font-premium">
          <Receipt className="w-5 h-5 text-gold" /> Fluxo de Pagamentos
        </h2>
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-10 bg-white/5 border-white/10 w-full text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* VIEW DESKTOP */}
      <div className="hidden md:block rounded-md border border-white/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent text-gray-300">
              <TableHead>Data / Cliente</TableHead>
              <TableHead>Tipo / Ref</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Lucro (Juros)</TableHead>
              <TableHead>Capital (Amort.)</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : currentItems.map((p) => (
              <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /> {formatDate(p.dataPagamento)}</span>
                    <span className="font-medium text-white italic">{p.contract?.client?.nome}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-500/50 text-blue-400 bg-blue-500/10">{p.tipo}</span>
                </TableCell>
                <TableCell className="font-semibold text-white">{formatCurrency(p.valorPago)}</TableCell>
                <TableCell className="text-green-400 font-medium">{formatCurrency(p.pagoJuros)}</TableCell>
                <TableCell className="text-yellow-500/80">{formatCurrency(p.pagoPrincipal)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><User className="w-3 h-3" /></div>
                    {p.createdByUser?.nome.split(" ")[0]}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteAction p={p} formatCurrency={formatCurrency} deleteMutation={deleteMutation} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* VIEW MOBILE: CARDS DE EXTRATO */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : currentItems.map((p) => (
          <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(p.dataPagamento)}</p>
                <h3 className="text-white font-bold italic">{p.contract?.client?.nome}</h3>
              </div>
              <DeleteAction p={p} formatCurrency={formatCurrency} deleteMutation={deleteMutation} />
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-500/50 text-blue-400">{p.tipo}</span>
                <div className="flex gap-3 text-[11px]">
                  <span className="text-green-400">Juros: {formatCurrency(p.pagoJuros)}</span>
                  <span className="text-yellow-500/80">Cap: {formatCurrency(p.pagoPrincipal)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">VALOR PAGO</p>
                <p className="text-lg font-bold text-white leading-none">{formatCurrency(p.valorPago)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINAÇÃO RESPONSIVA */}
      {!isLoading && filteredPayments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <p className="text-xs text-muted-foreground font-mono order-2 sm:order-1">
            {filteredPayments.length} registros no total
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground">Pág {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

/* COMPONENTE DE DELETAR (REUTILIZÁVEL) */
const DeleteAction = ({ p, formatCurrency, deleteMutation }: any) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 h-8 w-8">
        <Trash2 className="w-4 h-4" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white w-[95vw] max-w-md rounded-xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Estornar Pagamento?</AlertDialogTitle>
        <AlertDialogDescription className="text-zinc-400 text-sm">
          O valor de <strong>{formatCurrency(p.valorPago)}</strong> voltará como dívida para o cliente <strong>{p.contract?.client?.nome}</strong>.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-row gap-2 mt-4">
        <AlertDialogCancel className="flex-1 bg-white/5 border-zinc-800 mt-0">Voltar</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => deleteMutation.mutate(p.id)}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Estornar"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default PaymentsTable;