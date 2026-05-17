"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isBefore, startOfDay, isToday } from "date-fns";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSignIcon,
  Calendar,
  Clock,
  Loader2,
  ArrowUpRight,
  Wallet,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";

import DateRangePicker from "@/components/DateRangePicker";
import {
  getDashboardSummary,
  type DashboardRecentContract,
} from "@/services/dashboard";
import { getBalance } from "@/services/balance";

import FinanceSummaryCard from "@/components/FinanceSummaryCard";
import NewContractSheet from "@/components/NewContractSheet";
import ClientSheet from "@/components/NewClientSheet";
import TransactionSheet from "@/components/TransactionsSheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createFinanceExpense } from "@/services/finance";
import { toast } from "@/hooks/use-toast";
import { useDateRange } from "@/hooks/useDateRange";

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { range, setRange } = useDateRange();
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // 1. Query do Resumo Geral (Consumindo a API Local com o novo payload)
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", range.from, range.to],
    queryFn: () =>
      getDashboardSummary({
        startDate: new Date(range.from).toISOString(),
        endDate: new Date(range.to).toISOString(),
      }),
    enabled: !!(range.from && range.to),
  });

  // 2. Query do Saldo Atual (Balance)
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["balance"],
    queryFn: getBalance,
    refetchOnWindowFocus: true,
  });

  const saveExpenseMutation = useMutation({
    mutationFn: (payload: any) => createFinanceExpense(payload),
    onSuccess: () => {
      toast({ title: "Gasto registrado!" });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      setIsExpenseSheetOpen(false);
    },
  });

  // Formatação local para segurança de arredondamento em tela
  const formatCurrency = (v: number) => {
    const valueToFormat = Math.round((v + Number.EPSILON) * 100) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valueToFormat);
  };

  const getBadge = (type: string) => {
    const config: any = {
      DAILY: {
        label: "Diário",
        class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      },
      WEEKLY: {
        label: "Semanal",
        class: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      },
      MONTHLY: {
        label: "Mensal",
        class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      },
    };
    return (
      config[type] || {
        label: type,
        class: "bg-gray-500/10 text-gray-400 border-white/10",
      }
    );
  };

  if (isLoading || !data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter font-premium">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Resumo de Ativos e Operações
            </p>
          </div>
          <DateRangePicker value={range} onApply={setRange} />
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FinanceSummaryCard
            type="TOTAL_EMPRESTADO"
            value={data.totalEmprestado}
            subInfo={data.subTotalEmprestado}
          />
          <FinanceSummaryCard
            type="JUROS_A_RECEBER"
            value={data.jurosETaxasAReceber}
            subInfo={data.subJurosAReceber}
          />
          <FinanceSummaryCard
            type="MONTANTE_TOTAL"
            value={data.totalMontanteAReceber}
            subInfo={data.subMontanteAReceber}
          />
          <FinanceSummaryCard
            type="TOTAL_RECEBIDO"
            value={data.totalRecebido}
            subInfo={data.subTotalRecebido}
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: TABLE */}
          <Card className="lg:col-span-2 p-6 bg-card/40 border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Próximos Vencimentos
              </h2>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
              <Table>
                <TableHeader className="bg-white/[0.03]">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white font-bold h-12">
                      Cliente / Tipo
                    </TableHead>
                    <TableHead className="text-white font-bold">
                      Principal
                    </TableHead>
                    <TableHead className="text-white font-bold">
                      Juros/Lucro
                    </TableHead>
                    <TableHead className="text-white font-bold text-center">
                      Parcelas
                    </TableHead>
                    <TableHead className="text-white font-bold">
                      Vencimento
                    </TableHead>
                    <TableHead className="text-right text-white font-bold pr-6">
                      Situação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentContracts.map(
                    (contract: DashboardRecentContract) => {
                      const venc = new Date(contract.vencimentoEm);
                      const isVencendoHoje = isToday(venc);
                      const isOverdue =
                        isBefore(venc, startOfDay(new Date())) &&
                        contract.status !== "QUITADO";
                      const badge = getBadge(contract.periodicity);

                      return (
                        <TableRow
                          key={contract.id}
                          className="border-white/5 hover:bg-white/[0.04] transition-all h-16"
                        >
                          <TableCell className="pl-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-sm text-white">
                                {contract.clientName}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border w-fit ${badge.class}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-gray-200">
                            {formatCurrency(contract.valorPrincipal)}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-bold text-emerald-400">
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              {formatCurrency(contract.jurosCalculados)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {contract.periodicity !== "MONTHLY" ? (
                              <span className="text-[11px] font-black bg-white/5 px-2 py-1 rounded text-blue-400 border border-white/10">
                                {contract.paidInstallments}/
                                {contract.totalInstallments}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center gap-2 text-xs font-bold ${isOverdue
                                  ? "text-red-400"
                                  : isVencendoHoje
                                    ? "text-blue-400"
                                    : "text-muted-foreground"
                                }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {venc.toLocaleDateString("pt-BR")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <span
                              className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest border ${isOverdue
                                  ? "bg-red-600 border-red-400 text-white animate-pulse"
                                  : isVencendoHoje
                                    ? "bg-blue-600 border-blue-400 text-white"
                                    : "bg-white/5 border-white/10 text-gray-500"
                                }`}
                            >
                              {isOverdue
                                ? "Atrasado"
                                : isVencendoHoje
                                  ? "Vence Hoje"
                                  : contract.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* RIGHT COLUMN: ACTIONS & WALLET */}
          <div className="space-y-6">

            {/* CARD DE BALANCE (SALDO OPERACIONAL) */}
            <Card className="relative overflow-hidden p-6 border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-black backdrop-blur-xl shadow-2xl group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Caixa Operacional</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-1 mb-2">
                  {isLoadingBalance ? (
                    <div className="h-10 w-32 bg-white/10 animate-pulse rounded" />
                  ) : (
                    <h3 className="text-4xl font-extrabold text-white tracking-tighter">
                      {showBalance ? formatCurrency(balanceData?.saldo || 0) : "R$ ••••••••"}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> Disponível para novos empréstimos
                  </p>
                </div>
              </div>
            </Card>

            {/* CARD DE AÇÕES RÁPIDAS */}
            <Card className="p-7 bg-card/40 border-white/5 shadow-2xl backdrop-blur-md">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                  <DollarSignIcon className="w-5 h-5 text-primary" />
                </div>
                Ações Rápidas
              </h2>
              <div className="space-y-4">
                <NewContractSheet
                  triggerLabel="Novo Empréstimo"
                  classButton="w-full p-4 py-8 text-white rounded-2xl bg-secondary border border-white/5 hover:bg-secondary/80 transition-all font-bold shadow-lg"
                />
                <ClientSheet
                  triggerLabel="Cadastrar Cliente"
                  classButton="w-full p-4 py-8 text-white rounded-2xl bg-secondary border border-white/5 hover:bg-secondary/80 transition-all font-bold shadow-lg"
                />
                <Sheet
                  open={isExpenseSheetOpen}
                  onOpenChange={setIsExpenseSheetOpen}
                >
                  <SheetTrigger asChild>
                    <Button className="w-full p-4 py-8 text-white rounded-2xl bg-secondary border border-white/5 hover:bg-secondary/80 transition-all font-bold shadow-lg">
                      <DollarSignIcon className="w-5 h-5 mr-2 text-red-500" />
                      Registrar Saída
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-card text-white border-white/10 sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle className="text-white text-2xl font-premium">
                        Nova Saída
                      </SheetTitle>
                    </SheetHeader>
                    <TransactionSheet
                      onSave={(d) => saveExpenseMutation.mutate(d)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;