"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Wallet,
  Eye,
  Loader2,
  TrendingDown,
  ArrowUpCircle,
  DollarSign,
  CheckCircle2,
  Info,
  TrendingUp,
  History,
  AlertCircle,
  Clock, // Adicionado para ícone de pendente
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import DateRangePicker from "@/components/DateRangePicker";
import { useDateRange } from "@/hooks/useDateRange";
import ExpenseDetailsModal from "@/components/ExpensesDetailsModal";
import TransactionSheet from "@/components/TransactionsSheet";

// Serviços
import {
  listFinanceExpenses,
  createFinanceExpense,
  updateFinanceExpense,
  removeFinanceExpense,
  updateTransactionStatus,
  getFinanceSummary,
  type FinanceExpense,
  type TransactionStatus,
} from "@/services/finance";

/* =======================
   HELPERS
======================= */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const Expenses = () => {
  const queryClient = useQueryClient();
  const { range, setRange } = useDateRange();

  /* ===== UI STATE ===== */
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FinanceExpense | null>(
    null
  );
  const [detailsExpense, setDetailsExpense] = useState<FinanceExpense | null>(
    null
  );
  const [expenseToDelete, setExpenseToDelete] = useState<FinanceExpense | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const canFetch = useMemo(() => !!(range.from && range.to), [range]);

  /* =======================
       QUERIES
  ======================= */
  const { data: allExpenses = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["finance-expenses-all"],
    queryFn: () => listFinanceExpenses({}),
  });

  const { data: financeSummary } = useQuery({
    queryKey: ["finance-summary", range.from, range.to],
    queryFn: () =>
      getFinanceSummary({
        startDate: new Date(range.from).toISOString(),
        endDate: new Date(range.to).toISOString(),
      }),
    enabled: canFetch,
  });

  /* =======================
       MUTATIONS
  ======================= */
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editingExpense
        ? updateFinanceExpense(editingExpense.id, data)
        : createFinanceExpense(data),
    onSuccess: () => {
      toast({
        title: editingExpense ? "Transação atualizada" : "Transação criada",
      });
      queryClient.invalidateQueries({ queryKey: ["finance-expenses-all"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      setIsOpen(false);
      setEditingExpense(null);
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      mode,
    }: {
      id: string;
      mode: "single" | "future" | "all";
    }) => removeFinanceExpense(id, mode),
    onSuccess: () => {
      toast({ title: "Exclusão concluída" });
      queryClient.invalidateQueries({ queryKey: ["finance-expenses-all"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TransactionStatus }) =>
      updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-expenses-all"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
  });

  /* =======================
       FILTROS
  ======================= */
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      const date = new Date(expense.dataInicio);
      const inRange =
        date >= new Date(range.from) && date <= new Date(range.to);
      if (!inRange) return false;

      const desc = expense.descricao?.toLowerCase() || "";
      const cat = expense.categoria?.toLowerCase() || "";
      const matchesSearch =
        desc.includes(searchTerm.toLowerCase()) ||
        cat.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || expense.tipo === typeFilter;
      const matchesStatus =
        statusFilter === "all" || expense.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allExpenses, range, searchTerm, typeFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-dark p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-premium">
              Fluxo de Caixa
            </h1>
            <p className="text-muted-foreground text-sm">
              Gestão de histórico e caixa real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={range} onApply={setRange} />
            <Sheet
              open={isOpen}
              onOpenChange={(val) => {
                setIsOpen(val);
                if (!val) setEditingExpense(null);
              }}
            >
              <SheetTrigger asChild>
                <Button className="bg-gradient-gold shadow-gold text-black font-bold border-none">
                  <Plus className="w-4 h-4 mr-2" /> Nova Transação
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card text-white border-white/10 sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-white text-2xl">
                    {editingExpense ? "Editar" : "Nova"} Transação
                  </SheetTitle>
                </SheetHeader>
                <TransactionSheet
                  onSave={(data) => saveMutation.mutate(data)}
                  initialData={editingExpense}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {/* Layout: Grid de 5 colunas para caber tudo ou layout adaptativo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. FLUXO DE CAIXA (MOVIMENTAÇÃO) */}
          <Card className="p-5 bg-card/50 border-white/10 backdrop-blur-sm relative group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    Entradas Totais
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-white/10 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Composição (Realizado):
                        </p>
                        <ul className="text-xs space-y-1">
                          <li className="flex justify-between gap-4">
                            <span>Manuais:</span>
                            <span className="text-white">
                              {formatCurrency(
                                financeSummary?.subDetalhes?.entradasManuais ?? 0
                              )}
                            </span>
                          </li>
                          <li className="flex justify-between gap-4">
                            <span>Contratos (Bruto):</span>
                            <span className="text-white">
                              {formatCurrency(
                                financeSummary?.subDetalhes?.recebidoContratos ?? 0
                              )}
                            </span>
                          </li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {formatCurrency(financeSummary?.totalEntradas ?? 0)}
                </h3>
                
                {/* PREVISÃO DE ENTRADA */}
                <div className="flex items-center gap-1.5 mt-1 bg-white/5 px-2 py-1 rounded w-fit">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400 font-medium">
                        Pendente: {formatCurrency(financeSummary?.previsao?.totalEntradas ?? 0)}
                    </span>
                </div>
              </div>
              <ArrowUpCircle className="text-gray-400 w-5 h-5 opacity-50" />
            </div>
          </Card>

          {/* 2. NOVO CARD: CAPITAL RETORNADO */}
          <Card className="p-5 bg-blue-500/5 border-blue-500/20 backdrop-blur-sm relative group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                    Capital Retornado
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-blue-400/50 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-white/10 p-2 text-xs">
                        Dinheiro emprestado que voltou pro caixa (Não é lucro).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <h3 className="text-2xl font-bold text-blue-400">
                  {formatCurrency(financeSummary?.totalPrincipalRecebido ?? 0)}
                </h3>
                
                {/* PREVISÃO DE CAPITAL */}
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-blue-400/60 font-medium">
                        A Receber: {formatCurrency(financeSummary?.previsao?.totalPrincipal ?? 0)}
                    </span>
                </div>
              </div>
              <Wallet className="text-blue-400 w-5 h-5" />
            </div>
          </Card>

          {/* 3. LUCRO REAL */}
          <Card className="p-5 bg-green-500/5 border-green-500/20 backdrop-blur-sm relative group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-green-400 font-bold uppercase tracking-wider">
                    Lucro Bruto (Juros)
                  </p>
                </div>
                <h3 className="text-2xl font-bold text-green-400">
                  {formatCurrency(financeSummary?.totalJurosRecebido ?? 0)}
                </h3>

                {/* PREVISÃO DE LUCRO */}
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-green-500/60 font-medium">
                        A Lucrar: {formatCurrency(financeSummary?.previsao?.totalJuros ?? 0)}
                    </span>
                </div>
              </div>
              <TrendingUp className="text-green-400 w-5 h-5" />
            </div>
          </Card>

          {/* 4. GASTOS (SAÍDAS) */}
          <Card className="p-5 bg-red-500/5 border-red-500/20 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider">
                  Gastos / Despesas
                </p>
                <h3 className="text-2xl font-bold text-red-400">
                  {formatCurrency(financeSummary?.totalGastos ?? 0)}
                </h3>
                <p className="text-[10px] text-red-400/60 font-medium mt-1">
                  Saídas manuais realizadas
                </p>
              </div>
              <TrendingDown className="text-red-400 w-5 h-5" />
            </div>
          </Card>

          {/* 5. SALDO LÍQUIDO (RESULTADO) */}
          <Card className="p-5 bg-card/50 border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Saldo Operacional
                </p>
                <h3
                  className={`text-2xl font-bold ${
                    Number(financeSummary?.saldo ?? 0) >= 0
                      ? "text-emerald-400"
                      : "text-red-500"
                  }`}
                >
                  {formatCurrency(financeSummary?.saldo ?? 0)}
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">
                  Lucro Bruto - Gastos
                </p>
              </div>
              <DollarSign className="text-emerald-400 w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* 6. CARD CUMULATIVO (BANDEIRA LARGA) */}
        <Card className="p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <History className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-100 uppercase tracking-wide">
                  Saldo Acumulado (Caixa Atual)
                </h4>
                <p className="text-xs text-emerald-400/60">
                  Soma histórica de todas as entradas e saídas
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-emerald-400">
                {formatCurrency(financeSummary?.saldoCumulativoGlobal ?? 0)}
              </h2>
            </div>
          </div>
        </Card>

        {/* TABELA DE HISTÓRICO */}
        <Card className="p-6 bg-card/50 border-white/10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="text-gold w-5 h-5" /> Histórico de
              Lançamentos
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 bg-white/5 border-white/10 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="FIXO">Fixo</SelectItem>
                  <SelectItem value="VARIAVEL">Variável</SelectItem>
                  <SelectItem value="PARCELADO">Parcelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[180px]">Situação / Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAll ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => {
                    const isOverdue =
                      new Date(expense.dataInicio) < new Date() &&
                      expense.status !== "CONCLUIDO";

                    return (
                      <TableRow
                        key={expense.id}
                        className="border-white/5 hover:bg-white/5 transition-colors h-16"
                      >
                        <TableCell>
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: expense.id,
                                status:
                                  expense.status === "CONCLUIDO"
                                    ? "PENDENTE"
                                    : "CONCLUIDO",
                              })
                            }
                            className="focus:outline-none"
                          >
                            {expense.status === "CONCLUIDO" ? (
                              <div className="flex items-center gap-1.5 font-medium text-[10px] px-2.5 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 uppercase">
                                <CheckCircle2 className="w-3 h-3" />
                                Pago
                              </div>
                            ) : (
                              <div
                                className={`flex items-center gap-1.5 font-bold text-[10px] px-3 py-1.5 rounded-md border shadow-lg transition-all uppercase
                                ${
                                  isOverdue
                                    ? "bg-red-600 border-red-400 text-white animate-pulse hover:bg-red-500"
                                    : "bg-green-600 border-green-400 text-white hover:bg-green-500"
                                }`}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                {isOverdue ? "Pagar Atrasado" : "Pagar Agora"}
                              </div>
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-100">
                              {expense.descricao}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {expense.tipo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-white/5 px-2 py-1 rounded border border-white/5">
                            {expense.categoria || "Geral"}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`font-bold ${
                            isOverdue
                              ? "text-red-600"
                              : expense.tipo_fluxo === "ENTRADA"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {expense.tipo_fluxo === "ENTRADA" ? "+ " : "- "}{" "}
                          {formatCurrency(Number(expense.valor))}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {new Date(expense.dataInicio).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* ATALHO RÁPIDO DE PAGAMENTO (CHECK) */}
                            {expense.status !== "CONCLUIDO" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="w-8 h-8 border-green-500/50 bg-green-500/20 hover:bg-green-600 text-green-400 hover:text-white transition-all"
                                      onClick={() =>
                                        toggleStatusMutation.mutate({
                                          id: expense.id,
                                          status: "CONCLUIDO",
                                        })
                                      }
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-green-600 text-white border-none text-[10px]">
                                    Baixa Rápida
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => setDetailsExpense(expense)}
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => {
                                setEditingExpense(expense);
                                setIsOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 text-yellow-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => {
                                setExpenseToDelete(expense);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* DIALOGS DE EXCLUSÃO */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Como deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {expenseToDelete?.tipo === "VARIAVEL"
                ? "Esta ação é permanente."
                : "Esta transação faz parte de uma série recorrente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {expenseToDelete?.tipo === "VARIAVEL" ? (
              <Button
                variant="destructive"
                onClick={() =>
                  deleteMutation.mutate({
                    id: expenseToDelete.id,
                    mode: "single",
                  })
                }
              >
                Confirmar Exclusão
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="justify-start border-white/10 hover:bg-white/5"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: expenseToDelete!.id,
                      mode: "single",
                    })
                  }
                >
                  1. Apenas este mês
                </Button>
                <Button
                  variant="outline"
                  className="justify-start border-white/10 hover:bg-white/5"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: expenseToDelete!.id,
                      mode: "future",
                    })
                  }
                >
                  2. Este e os próximos
                </Button>
                <Button
                  variant="destructive"
                  className="justify-start"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: expenseToDelete!.id,
                      mode: "all",
                    })
                  }
                >
                  3. Todo o histórico
                </Button>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-none hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExpenseDetailsModal
        open={!!detailsExpense}
        expense={detailsExpense}
        onClose={() => setDetailsExpense(null)}
      />
    </div>
  );
};

export default Expenses;