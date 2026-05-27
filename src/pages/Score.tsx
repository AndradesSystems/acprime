"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  CheckCircle2,
  XCircle,
  History,
  ShieldCheck,
  DollarSign,
  FileText,
  User,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getClientsWithScores, forceRecalculateScores, ClientWithScore } from "@/services/score";

export default function Score() {
  const [customers, setCustomers] = useState<ClientWithScore[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar os dados da API
  const loadScoreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClientsWithScores();
      setCustomers(data);
    } catch (err) {
      console.error("Erro ao carregar scores:", err);
      setError("Não foi possível carregar a análise de crédito dos clientes.");
    } finally {
      setLoading(false);
    }
  };

  // Carrega ao montar o componente
  useEffect(() => {
    loadScoreData();
  }, []);

  // Força o recálculo via API
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await forceRecalculateScores();
      await loadScoreData(); // Recarrega a lista atualizada
    } catch (err) {
      console.error("Erro ao recalcular scores:", err);
      alert("Falha ao rodar o motor de crédito.");
    } finally {
      setRecalculating(false);
    }
  };

  // Filtro computado em memória para pesquisa reativa
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  // Gerenciador visual de cores e badges baseado na pontuação real calculada
  const getScoreTier = (score: number) => {
    if (score >= 850) return { label: "Altamente Seguro", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", color: "text-emerald-400", progress: "[&>div]:bg-emerald-500" };
    if (score >= 700) return { label: "Bom Retorno", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", color: "text-amber-400", progress: "[&>div]:bg-amber-500" };
    if (score >= 400) return { label: "Moderado / Limítrofe", bg: "bg-orange-500/10 text-orange-400 border-orange-500/30", color: "text-orange-400", progress: "[&>div]:bg-orange-500" };
    return { label: "Risco Crítico", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", color: "text-rose-400", progress: "[&>div]:bg-rose-500" };
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  };

  return (
    <div className="min-h-screen p-6 text-white bg-[#0a0e17]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Análise de Crédito Segura
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1">
              Score dos Clientes
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Análise baseada em recorrência, consistência e volume de contratos quitados.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Buscar cliente pelo nome..."
                className="pl-9 bg-zinc-900/50 border-white/10 text-white focus-visible:ring-zinc-700 h-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* BOTÃO DE RECALCULAR COMPORTAMENTO (ACIONA O MOTOR) */}
            <Button 
              onClick={handleRecalculate}
              disabled={recalculating || loading}
              variant="outline" 
              className="border-white/10 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors h-10 rounded-xl"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", recalculating && "animate-spin")} />
              {recalculating ? "Processando..." : "Atualizar Scores"}
            </Button>
          </div>
        </div>

        {/* FEEDBACK DE CARREGAMENTO OU ERRO */}
        {loading ? (
          <div className="py-24 text-center text-zinc-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Buscando inteligência financeira do banco de dados...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-2xl">
            {error}
          </div>
        ) : (
          
          /* GRID DE CARDS DOS CLIENTES */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full py-16 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                Nenhum cliente localizado com análise de score ativa.
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                // Se o cliente não possuir a tabela de score criada pelo motor, usamos a pontuação básica dele
                const scoreReal = customer.clientScore ? customer.clientScore.valor : Number(customer.score || 500);
                const tier = getScoreTier(scoreReal);
                
                const scoreData = customer.clientScore;

                // Valores monetários seguros vindo do model
                const totalEmprestado = scoreData ? scoreData.totalEmprestado : "0";
                const totalPago = scoreData ? scoreData.totalPago : "0";
                const percentPaid = scoreData ? Math.round(Number(scoreData.retornoCapital)) : 0;

                return (
                  <Card
                    key={customer.id}
                    className="relative flex flex-col bg-zinc-900/20 border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl overflow-hidden shadow-xl group hover:-translate-y-1"
                  >
                    {/* Indicador de Score no topo do card */}
                    <div className={cn("h-[2px] w-full bg-current absolute top-0 left-0 opacity-20 group-hover:opacity-60 transition-opacity", tier.color)} />

                    <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">

                      {/* IDENTIFICAÇÃO DO CLIENTE */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                            <User className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-base truncate group-hover:text-amber-400 transition-colors" title={customer.nome}>
                              {customer.nome}
                            </h3>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 font-medium">
                              <FileText className="w-3 h-3 text-zinc-500" />
                              Análise Geral do Cadastro
                            </span>
                          </div>
                        </div>

                        <Badge variant="outline" className={cn("px-2 py-0.5 rounded-md text-[10px] tracking-wider uppercase font-black shrink-0", tier.bg)}>
                          {scoreData ? scoreData.nivelAnalise : tier.label}
                        </Badge>
                      </div>

                      {/* DISPLAY CENTRAL DO SCORE */}
                      <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Score de Confiança</span>
                          <div className={cn("text-3xl font-black tracking-tight mt-0.5 font-mono", tier.color)}>
                            {scoreReal}
                          </div>
                        </div>

                        <div className="w-28 space-y-1">
                          <Progress
                            value={scoreReal / 10}
                            className={cn("h-1.5 bg-zinc-950 overflow-hidden rounded-full", tier.progress)}
                          />
                          <div className="text-[9px] text-zinc-500 text-right font-medium truncate">
                            {!scoreData ? "⚠️ Sem Histórico Cron" : "Análise Consistente"}
                          </div>
                        </div>
                      </div>

                      {/* FLUXO FINANCEIRO: EMPRESTADO VS PAGO */}
                      <div className="space-y-3 bg-zinc-950/20 p-3 rounded-xl border border-white/[0.02]">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                              <DollarSign className="w-2.5 h-2.5" /> Total Emprestado
                            </span>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-0.5">
                              {formatCurrency(totalEmprestado)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider inline-flex items-center gap-1">
                              Total Devolvido <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            </span>
                            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                              {formatCurrency(totalPago)}
                            </div>
                          </div>
                        </div>

                        {/* Barra de amortização do montante */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-zinc-500 font-medium">
                            <span>Retorno do capital</span>
                            <span>{percentPaid}% quitado</span>
                          </div>
                          <Progress value={percentPaid} className="h-1 bg-zinc-900 [&>div]:bg-zinc-600" />
                        </div>
                      </div>

                      {/* COMPORTAMENTO DAS PARCELAS */}
                      <div className="pt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-zinc-950/20 py-2 rounded-lg border border-white/[0.01]">
                          <div className="text-emerald-500 font-bold font-mono text-xs flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {scoreData ? scoreData.noPrazo : 0}
                          </div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide">No Prazo</span>
                        </div>

                        <div className="bg-zinc-950/20 py-2 rounded-lg border border-white/[0.01]">
                          <div className="text-amber-500 font-bold font-mono text-xs flex items-center justify-center gap-1">
                            <History className="w-3 h-3" /> {scoreData ? scoreData.atrasos : 0}
                          </div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide">Atrasos</span>
                        </div>

                        <div className="bg-zinc-950/20 py-2 rounded-lg border border-white/[0.01]">
                          <div className="text-rose-500 font-bold font-mono text-xs flex items-center justify-center gap-1">
                            <XCircle className="w-3 h-3" /> {scoreData ? scoreData.abertas : 0}
                          </div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide">Abertas</span>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}