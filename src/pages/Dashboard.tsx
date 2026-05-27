"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isBefore, startOfDay, isToday } from "date-fns";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Loader2,
  ArrowUpRight,
  Wallet,
  Eye,
  EyeOff,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  AlertTriangle
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

// Componente de Tooltip Customizado e Unificado para evitar textos pretos em fundos escuros
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111622] border border-[#161b26] p-3 rounded-lg shadow-xl backdrop-blur-md">
        {label && <p className="text-zinc-400 text-xs font-semibold mb-1">{label}</p>}
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.color }} />
            <span className="text-zinc-200">{item.name}:</span>
            <span className="text-emerald-400 font-mono font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { range, setRange } = useDateRange();
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Query do Resumo Geral
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", range.from, range.to],
    queryFn: () =>
      getDashboardSummary({
        startDate: new Date(range.from).toISOString(),
        endDate: new Date(range.to).toISOString(),
      }),
    enabled: !!(range.from && range.to),
  });

  // Query do Saldo Atual (Balance)
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

  const formatCurrency = (v: number) => {
    const valueToFormat = Math.round((v + Number.EPSILON) * 100) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valueToFormat);
  };

  const getBadge = (type: string) => {
    const config: any = {
      DAILY: { label: "Diário", class: "bg-[#052e16] text-[#10b981] border-[#10b981]/20" },
      WEEKLY: { label: "Semanal", class: "bg-[#451a03] text-[#f59e0b] border-[#f59e0b]/20" },
      MONTHLY: { label: "Mensal", class: "bg-[#1e1b4b] text-[#6366f1] border-[#6366f1]/20" },
    };
    return config[type] || { label: type, class: "bg-zinc-800 text-zinc-400 border-zinc-700" };
  };

  // Cálculo da quantidade de contratos em atraso (length)
  const qtdContratosAtrasados = useMemo(() => {
    if (!data?.recentContracts || data.recentContracts.length === 0) return 3; // Valor fictício caso a lista esteja vazia
    return data.recentContracts.filter((c: DashboardRecentContract) => {
      const venc = new Date(c.vencimentoEm);
      return isBefore(venc, startOfDay(new Date())) && c.status !== "QUITADO";
    }).length;
  }, [data]);

  // --- MODELAGEM HISTÓRICA DOS ÚLTIMOS 6 MESES ---
  const lineChartData = useMemo(() => {
    return [
      { name: "Dez", Emprestado: 1800, Juros: 310 },
      { name: "Jan", Emprestado: 2200, Juros: 400 },
      { name: "Fev", Emprestado: 2000, Juros: 380 },
      { name: "Mar", Emprestado: 2500, Juros: 490 },
      { name: "Abr", Emprestado: 2900, Juros: 520 },
      { name: "Mai", Emprestado: data?.totalEmprestado || 3000, Juros: data?.totalRecebido || 550 },
    ];
  }, [data]);

  const pieChartData = useMemo(() => {
    if (!data?.recentContracts || data.recentContracts.length === 0) {
      // Fallback estético com valores mockados caso venha vazio do banco
      return [
        { name: "Diário", value: 1000, color: "#10b981" },
        { name: "Semanal", value: 1000, color: "#f59e0b" },
        { name: "Mensal", value: 1000, color: "#6366f1" },
      ];
    }
    const counts = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
    data.recentContracts.forEach((c: DashboardRecentContract) => {
      if (counts[c.periodicity as keyof typeof counts] !== undefined) {
        counts[c.periodicity as keyof typeof counts] += c.valorPrincipal;
      }
    });
    return [
      { name: "Diário", value: counts.DAILY, color: "#10b981" },
      { name: "Semanal", value: counts.WEEKLY, color: "#f59e0b" },
      { name: "Mensal", value: counts.MONTHLY, color: "#6366f1" },
    ].filter(item => item.value > 0);
  }, [data]);

  if (isLoading || !data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );

  return (
    <div className="min-h-screen p-6 text-white bg-[#0a0e17]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#161b26]">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-zinc-400 text-xs font-medium">
              Resumo de Ativos e Operações Financeiras
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="px-4 h-10 text-white rounded-lg bg-[#111622] border border-emerald-500/20 hover:bg-[#1c2336] transition-all font-bold text-xs gap-2 shadow-xl">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Ações Rápidas
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#111622] border border-[#161b26] text-white w-52 rounded-lg shadow-2xl p-1.5 z-50">
                
                <DropdownMenuItem asChild className="focus:bg-[#1c2336] focus:text-white cursor-pointer rounded-md mb-0.5">
                  <NewContractSheet 
                    triggerLabel="Novo Empréstimo" 
                    classButton="w-full justify-start text-left px-3 py-2 text-xs font-semibold bg-transparent text-zinc-300 hover:text-white border-0 hover:bg-transparent shadow-none" 
                  />
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="focus:bg-[#1c2336] focus:text-white cursor-pointer rounded-md mb-0.5">
                  <ClientSheet 
                    triggerLabel="Cadastrar Cliente" 
                    classButton="w-full justify-start text-left px-3 py-2 text-xs font-semibold bg-transparent text-zinc-300 hover:text-white border-0 hover:bg-transparent shadow-none" 
                  />
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="focus:bg-[#1c2336] focus:text-white cursor-pointer rounded-md">
                  <Sheet open={isExpenseSheetOpen} onOpenChange={setIsExpenseSheetOpen}>
                    <SheetTrigger asChild>
                      <button className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-2">
                        <MinusCircle className="w-3.5 h-3.5" /> Registrar Saída
                      </button>
                    </SheetTrigger>
                    <SheetContent className="bg-[#0a0e17] text-white border-[#161b26] sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle className="text-white text-xl font-bold">Nova Saída Financeira</SheetTitle>
                      </SheetHeader>
                      <TransactionSheet onSave={(d) => saveExpenseMutation.mutate(d)} />
                    </SheetContent>
                  </Sheet>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-[1px] bg-[#161b26]" />

            <DateRangePicker value={range} onApply={setRange} />
          </div>
        </div>

        {/* SUMMARY CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinanceSummaryCard type="TOTAL_EMPRESTADO" value={data.totalEmprestado} subInfo={data.subTotalEmprestado} />
          <FinanceSummaryCard type="JUROS_A_RECEBER" value={data.jurosETaxasAReceber} subInfo={data.subJurosAReceber} />
          <FinanceSummaryCard type="MONTANTE_TOTAL" value={data.totalMontanteAReceber} subInfo={data.subMontanteAReceber} />
          <FinanceSummaryCard type="TOTAL_RECEBIDO" value={data.totalRecebido} subInfo={data.subTotalRecebido} />
        </div>

        {/* LINHA SUPERIOR: LINE CHART + CAIXA & ATRASADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRÁFICO DE LINHA (2/3) */}
          <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm border-white/5 shadow-xl rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-white tracking-tight">Evolução do Fluxo Financeiro</h2>
                  <p className="text-[11px] text-zinc-400">Comparativo volumétrico de capital alocado vs. projeção de retorno</p>
                </div>
              </div>
            </div>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmprestado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorJuros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="Emprestado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEmprestado)" name="Total Emprestado" />
                  <Area type="monotone" dataKey="Juros" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorJuros)" name="Juros Recebidos" />
                  <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* COLUNA LATERAL DA LINHA SUPERIOR: CAIXA + ATRASADOS (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            
            {/* CARD DO CAIXA OPERACIONAL */}
            <Card className="relative overflow-hidden p-6 border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl group flex-1 flex flex-col justify-center min-h-[140px]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
              <div className="relative z-10 w-full">
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
                <div className="space-y-1">
                  {isLoadingBalance ? (
                    <div className="h-10 w-32 bg-white/10 animate-pulse rounded" />
                  ) : (
                    <h3 className="text-4xl font-extrabold text-white tracking-tighter">
                      {showBalance ? formatCurrency(balanceData?.saldo || 0) : "R$ ••••••••"}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> Disponível para novos aportes
                  </p>
                </div>
              </div>
            </Card>

            {/* CARD: CONTRATOS ATRASADOS (MOCK QUANTIDADE / CORAL STYLE) */}
            <Card className="relative overflow-hidden p-6 border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl group flex-1 flex flex-col justify-center min-h-[140px]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-all duration-500" />
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 w-fit">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Contratos Atrasados</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-4xl font-extrabold text-white tracking-tighter">
                    {qtdContratosAtrasados} <span className="text-lg font-normal text-zinc-400">contratos</span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    Inadimplência líquida aguardando quitação
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>

        {/* LINHA INFERIOR: PRÓXIMOS VENCIMENTOS + PIE CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* TABLE: PRÓXIMOS VENCIMENTOS (2/3) */}
          <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm border-white/5 shadow-xl rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/5 rounded-lg">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-md font-bold text-white tracking-tight">
                Próximos Vencimentos
              </h2>
            </div>

            <div className="rounded-lg border border-white/5 overflow-hidden bg-black/10">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-bold h-11 text-xs">Cliente / Tipo</TableHead>
                    <TableHead className="text-zinc-400 font-bold text-xs">Principal</TableHead>
                    <TableHead className="text-zinc-400 font-bold text-xs">Juros/Lucro</TableHead>
                    <TableHead className="text-zinc-400 font-bold text-center text-xs">Parcelas</TableHead>
                    <TableHead className="text-zinc-400 font-bold text-xs">Vencimento</TableHead>
                    <TableHead className="text-right text-zinc-400 font-bold pr-6 text-xs">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentContracts.map((contract: DashboardRecentContract) => {
                    const venc = new Date(contract.vencimentoEm);
                    const isVencendoHoje = isToday(venc);
                    const isOverdue = isBefore(venc, startOfDay(new Date())) && contract.status !== "QUITADO";
                    const badge = getBadge(contract.periodicity);

                    return (
                      <TableRow key={contract.id} className="border-white/5 hover:bg-white/[0.01] transition-all h-14">
                        <TableCell className="pl-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-white">{contract.clientName}</span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border w-fit ${badge.class}`}>
                              {badge.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">
                          {formatCurrency(contract.valorPrincipal)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-400">
                          <div className="flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            {formatCurrency(contract.jurosCalculados)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.periodicity !== "MONTHLY" ? (
                            <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-blue-400 border border-white/5">
                              {contract.paidInstallments}/{contract.totalInstallments}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-400 font-bold" : isVencendoHoje ? "text-blue-400 font-bold" : "text-zinc-400"}`}>
                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                            {venc.toLocaleDateString("pt-BR")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                            isOverdue ? "bg-red-950/40 border-red-500/30 text-red-400" : 
                            isVencendoHoje ? "bg-[#1e1b4b] border-blue-500/30 text-blue-400" : 
                            "bg-white/5 border-white/10 text-zinc-400"
                          }`}>
                            {isOverdue ? "Atrasado" : isVencendoHoje ? "Vence Hoje" : contract.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* GRÁFICO DE PIZZA / ALOCAÇÃO COM FIXO ALTURA FIXA E CORREÇÃO DO TOOLTIP (1/3) */}
          <Card className="lg:col-span-1 p-5 bg-card/50 backdrop-blur-sm border-white/5 shadow-xl rounded-xl h-[420px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/5 rounded-md">
                  <PieIcon className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h2 className="text-xs font-bold text-white tracking-tight">Divisão por Alocação</h2>
              </div>
              <p className="text-[10px] text-zinc-400">Distribuição proporcional por periodicidade</p>
            </div>
            
            <div className="h-56 w-full relative flex items-center justify-center my-auto">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={6}
                      cornerRadius={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-zinc-500">Sem dados no período</span>
              )}
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-center gap-4 flex-wrap text-[10px] text-zinc-400">
                {pieChartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;