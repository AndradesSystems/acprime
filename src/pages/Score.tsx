"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  CheckCircle2,
  XCircle,
  History,
  ShieldCheck,
  DollarSign,
  FileText,
  User,
  RefreshCw,
  Eye,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getClientsWithScores, forceRecalculateScores, ClientWithScore } from "@/services/score";

export default function Score() {
  const [customers, setCustomers] = useState<ClientWithScore[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para gerenciar o modal de detalhes do cliente
  const [selectedCustomer, setSelectedCustomer] = useState<ClientWithScore | null>(null);

  // Carrega os dados iniciais
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

  useEffect(() => {
    loadScoreData();
  }, []);

  // Força o recálculo via motor e já atualiza o estado com o retorno direto
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const response = await forceRecalculateScores();
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        await loadScoreData();
      }
    } catch (err) {
      console.error("Erro ao recalcular scores:", err);
      alert("Falha ao rodar o motor de crédito.");
    } finally {
      setRecalculating(false);
    }
  };

  // Filtro reativo por nome
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  // Estilos visuais dinâmicos baseados no scoreGlobal (0 a 1000)
  const getScoreTier = (score: number) => {
    if (score >= 850) return { label: "Altamente Seguro", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", color: "text-emerald-400", progress: "[&>div]:bg-emerald-500", glow: "group-hover:shadow-emerald-500/5" };
    if (score >= 700) return { label: "Bom Retorno", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", color: "text-amber-400", progress: "[&>div]:bg-amber-500", glow: "group-hover:shadow-amber-500/5" };
    if (score >= 400) return { label: "Moderado / Limítrofe", bg: "bg-orange-500/10 text-orange-400 border-orange-500/30", color: "text-orange-400", progress: "[&>div]:bg-orange-500", glow: "group-hover:shadow-orange-500/5" };
    return { label: "Risco Crítico", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", color: "text-rose-400", progress: "[&>div]:bg-rose-500", glow: "group-hover:shadow-rose-500/5" };
  };

  // Cores dinâmicas para o status individual de cada contrato no Dossiê
  const getContractStatusStyle = (status: string) => {
    switch (status) {
      case "QUITADO": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "ABERTO": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ATRASADO": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "COBRANCA_PESSOAL": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "CALOTEIRO": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="min-h-screen p-6 text-white bg-[#060913]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Análise de Crédito Segura
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Score dos Clientes
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Análise em tempo real do dossiê de contratos e consistência de recebimentos.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Buscar cliente pelo nome..."
                className="pl-9 bg-zinc-900/40 border-white/10 text-white focus-visible:ring-zinc-700 h-10 rounded-xl backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleRecalculate}
              disabled={recalculating || loading}
              variant="outline" 
              className="border-white/10 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all h-10 rounded-xl backdrop-blur-sm"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", recalculating && "animate-spin")} />
              {recalculating ? "Processando..." : "Atualizar Scores"}
            </Button>
          </div>
        </div>

        {/* FEEDBACK DE CARREGAMENTO OU ERRO */}
        {loading ? (
          <div className="py-24 text-center text-zinc-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-9 h-9 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Processando inteligência financeira dos contratos...</p>
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
                const scoreReal = customer.scoreGlobal;
                const tier = getScoreTier(scoreReal);
                const painel = customer.painelScore;

                const totalEmprestado = painel ? painel.totalEmprestado : 0;
                const totalRecebido = painel ? painel.totalDevolvido : 0;
                const percentPaid = painel ? Math.round(painel.retornoCapitalPercent) : 0;

                return (
                  <Card
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={cn(
                      "relative flex flex-col bg-gradient-to-br from-zinc-900/40 to-zinc-950/60 border border-white/5 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl overflow-hidden shadow-xl group hover:-translate-y-1 cursor-pointer select-none backdrop-blur-md",
                      tier.glow
                    )}
                  >
                    {/* Indicador de Score no topo do card */}
                    <div className={cn("h-[2px] w-full bg-current absolute top-0 left-0 opacity-30 group-hover:opacity-100 transition-opacity duration-300", tier.color)} />

                    <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-5">

                      {/* IDENTIFICAÇÃO DO CLIENTE */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center text-zinc-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
                            <User className="w-5 h-5 text-zinc-300" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-base truncate group-hover:text-zinc-200 transition-colors" title={customer.nome}>
                              {customer.nome}
                            </h3>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 font-medium">
                              <FileText className="w-3 h-3 text-zinc-600" />
                              {customer.contratos.length} {customer.contratos.length === 1 ? "Contrato ativo" : "Contratos no histórico"}
                            </span>
                          </div>
                        </div>

                        <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase font-black shrink-0 border", tier.bg)}>
                          {painel ? painel.nivelAnalise : tier.label}
                        </Badge>
                      </div>

                      {/* DISPLAY CENTRAL DO SCORE */}
                      <div className="bg-zinc-950/60 border border-white/[0.03] rounded-xl p-4 flex items-center justify-between group-hover:bg-zinc-950/80 transition-colors">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Score de Confiança</span>
                          <div className={cn("text-3xl font-black tracking-tight mt-0.5 font-mono", tier.color)}>
                            {scoreReal}
                          </div>
                        </div>

                        <div className="w-28 space-y-1.5">
                          <Progress
                            value={Math.min(scoreReal / 10, 100)}
                            className={cn("h-1.5 bg-zinc-900 overflow-hidden rounded-full", tier.progress)}
                          />
                          <div className="text-[10px] text-zinc-500 text-right font-medium flex items-center justify-end gap-1">
                            {!painel ? "⚠️ Sem Análise" : "Motor Sincronizado"}
                          </div>
                        </div>
                      </div>

                      {/* FLUXO FINANCEIRO: EMPRESTADO VS RECEBIDO */}
                      <div className="space-y-3 bg-zinc-950/30 p-4 rounded-xl border border-white/[0.02]">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-zinc-600" /> Emprestado
                            </span>
                            <div className="text-sm font-bold font-mono text-zinc-300 mt-0.5">
                              {formatCurrency(totalEmprestado)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider inline-flex items-center gap-1">
                              Recebido <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            </span>
                            <div className={cn("text-sm font-bold font-mono mt-0.5", percentPaid > 100 ? "text-indigo-400 flex items-center justify-end gap-1" : "text-emerald-400")}>
                              {formatCurrency(totalRecebido)}
                              {percentPaid > 100 && <TrendingUp className="w-3 h-3 text-indigo-400" />}
                            </div>
                          </div>
                        </div>

                        {/* Progresso Dinâmico de Retorno/Amortização */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-zinc-500 font-semibold">
                            <span>Valor recebido</span>
                            <span className={cn(percentPaid > 100 ? "text-indigo-400 font-bold" : "text-zinc-400")}>
                              {percentPaid}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(percentPaid, 100)} 
                            className={cn(
                              "h-1.5 bg-zinc-900 rounded-full", 
                              percentPaid > 100 ? "[&>div]:bg-indigo-500" : "[&>div]:bg-zinc-600"
                            )} 
                          />
                        </div>
                      </div>

                      {/* COMPORTAMENTO DAS PARCELAS (RESUMO HISTÓRICO) */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/[0.02]">
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/70" /> {painel ? painel.contadores.noPrazo : 0} no prazo
                        </span>
                        <span className="group-hover:text-zinc-400 transition-colors flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider">
                          Ver Dossiê <Eye className="w-3 h-3" />
                        </span>
                      </div>

                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* MODAL COMPLETO DE ANÁLISE E DOSSIÊ DE CONTRATOS */}
        <Dialog open={selectedCustomer !== null} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
          {selectedCustomer && (() => {
            const modalScore = selectedCustomer.scoreGlobal;
            const modalTier = getScoreTier(modalScore);
            const painel = selectedCustomer.painelScore;
            const modalPercent = painel ? Math.round(painel.retornoCapitalPercent) : 0;

            return (
              <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-2xl rounded-2xl p-6 backdrop-blur-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
                <DialogHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={cn("uppercase text-[10px] tracking-wider border", modalTier.bg)}>
                      {painel ? painel.nivelAnalise : "Score Geral"}
                    </Badge>
                    <span className="text-xs text-zinc-500 font-mono">CPF: {selectedCustomer.cpf}</span>
                  </div>
                  <DialogTitle className="text-2xl font-black text-white tracking-tight">
                    {selectedCustomer.nome}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-xs">
                    Dados estruturais de contratos históricos e logs gerados pelo motor de decisão.
                  </DialogDescription>
                </DialogHeader>

                <hr className="border-white/5 my-3" />

                <div className="space-y-6">
                  {/* Visão de Topo: Score e Acumulado */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex flex-col justify-center text-center">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Score Global</span>
                      <div className={cn("text-4xl font-black font-mono mt-1", modalTier.color)}>
                        {modalScore}
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl md:col-span-2 space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Fluxo Consolidado</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500 block">Total Emprestado:</span>
                          <span className="font-mono font-bold text-zinc-300">{formatCurrency(painel?.totalEmprestado || 0)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Total Recebido:</span>
                          <span className={cn("font-mono font-bold", modalPercent > 100 ? "text-indigo-400" : "text-emerald-400")}>
                            {formatCurrency(painel?.totalDevolvido || 0)} ({modalPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Histórico Consolidado de Parcelas do Painel */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" /> Métricas Agrupadas de Parcelas
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 py-2.5 rounded-xl">
                        <div className="text-emerald-400 font-bold font-mono text-base">
                          {painel ? painel.contadores.noPrazo : 0}
                        </div>
                        <span className="text-[9px] text-zinc-500 uppercase font-medium">No Prazo</span>
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/10 py-2.5 rounded-xl">
                        <div className="text-amber-400 font-bold font-mono text-base">
                          {painel ? painel.contadores.atrasos : 0}
                        </div>
                        <span className="text-[9px] text-zinc-500 uppercase font-medium">Atrasos</span>
                      </div>

                      <div className="bg-rose-500/5 border border-rose-500/10 py-2.5 rounded-xl">
                        <div className="text-rose-400 font-bold font-mono text-base">
                          {painel ? painel.contadores.abertas : 0}
                        </div>
                        <span className="text-[9px] text-zinc-500 uppercase font-medium">Abertas</span>
                      </div>
                    </div>
                  </div>

                  {/* DOSSIÊ DE CONTRATOS REAIS (Novo Backend) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" /> Dossiê Analítico de Contratos ({selectedCustomer.contratos.length})
                    </h4>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 space-y-2.5">
                      {selectedCustomer.contratos.length === 0 ? (
                        <div className="text-center py-6 text-zinc-600 text-xs border border-dashed border-white/5 rounded-xl">
                          Nenhum contrato indexado neste cliente.
                        </div>
                      ) : (
                        selectedCustomer.contratos.map((contrato) => (
                          <div key={contrato.id} className="bg-zinc-900/30 border border-white/5 p-3 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-zinc-500">ID: ...{contrato.id.slice(-8)}</span>
                              <Badge className={cn("text-[9px] font-black rounded-md px-1.5 py-0", getContractStatusStyle(contrato.status))}>
                                {contrato.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-zinc-400">
                              <div>Emprestado: <span className="text-zinc-200 font-mono font-medium">{formatCurrency(contrato.dinheiroEmprestado)}</span></div>
                              <div>Valor Recebido: <span className="text-emerald-400 font-mono font-medium">{formatCurrency(contrato.totalPago)}</span></div>
                              <div>Em Aberto: <span className="text-rose-400 font-mono font-medium">{formatCurrency(contrato.valorEmAbertoAtual)}</span></div>
                              <div>Juros Acordados: <span className="text-zinc-300">{contrato.taxaDeJurosContratual}%</span></div>
                              <div>Multas Acumuladas: <span className="text-amber-500 font-mono">{formatCurrency(contrato.taxaAcumuladaInadimplencia)}</span></div>
                              <div className="text-[10px] text-zinc-500">Prazo: {contrato.historicoPagamentos.noPrazo}/{contrato.historicoPagamentos.totalLancamentos} dias</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* LOGS E MOTIVOS DE AUDITORIA DO MOTOR */}
                  {painel && painel.motivos && painel.motivos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Notas do Motor de Crédito
                      </h4>
                      <div className="bg-zinc-950 border border-white/5 p-3 rounded-xl space-y-1.5">
                        {painel.motivos.map((motivo, index) => (
                          <p key={index} className="text-[11px] text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                            {motivo}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={() => setSelectedCustomer(null)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl"
                  >
                    Fechar Dossiê
                  </Button>
                </div>
              </DialogContent>
            );
          })()}
        </Dialog>

      </div>
    </div>
  );
}