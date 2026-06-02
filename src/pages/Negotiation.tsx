"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Handshake, Search, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
    payNegotiationInstallment,
    breakNegotiation,
    getNegotiationSummary,
    Negotiation
} from "@/services/negotiation";
import { api } from "@/services/api";

import { useDateRange } from "@/hooks/useDateRange";
import DateRangePicker from "@/components/DateRangePicker";
import NegotiationHistoryModal from "@/components/NegotiationHistoryModal";

const formatCurrency = (v: number | string) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));

const formatDateIgnoreTimezone = (dateString: string) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
};

const Negotiations = () => {
    const queryClient = useQueryClient();
    const { range, setRange } = useDateRange();

    /* ===== UI STATE ===== */
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedNegotiationId, setSelectedNegotiationId] = useState<string | null>(null);

    /* ===== DATA FETCHING PREP ===== */
    const canFetch = useMemo(() => !!(range.from && range.to), [range]);

    const dates = useMemo(() => {
        if (!canFetch) return { start: "", end: "" };
        const start = new Date(range.from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(range.to);
        end.setHours(23, 59, 59, 999);

        return {
            start: start.toISOString(),
            end: end.toISOString(),
        };
    }, [range, canFetch]);

    /* ===== QUERY: BUSCA TODAS AS NEGOCIAÇÕES ===== */
    const {
        data: negotiations = [],
        isLoading: isLoadingNegotiations,
    } = useQuery<Negotiation[]>({
        queryKey: ["all-negotiations", dates.start, dates.end],
        queryFn: async () => {
            const { data } = await api.get(`/negotiation?start=${dates.start}&end=${dates.end}`);
            return data;
        },
        enabled: canFetch,
    });

    /* ===== QUERY: DASHBOARD METRICAS (SUMMARY) ===== */
    const {
        data: summaryData
    } = useQuery({
        queryKey: ["negotiations-summary"],
        queryFn: () => getNegotiationSummary(),
    });

    /* ===== TRATAMENTO DO SUMMARY (Mapeamento Direto e Simples) ===== */
    const summary = useMemo(() => {
        if (!summaryData) {
            return { totalAcordado: 0, totalDescontos: 0, totalRecebido: 0, totalQuebrado: 0 };
        }

        // Como limpamos o backend, os dados agora chegam prontos e planos aqui
        return {
            totalAcordado: summaryData.totalAcordado ?? 0,
            totalDescontos: summaryData.totalDescontos ?? 0,
            totalRecebido: summaryData.totalRecebido ?? 0,
            totalQuebrado: summaryData.totalQuebrado ?? 0,
        };
    }, [summaryData]);

    /* ===== FILTRAGEM DO ACORDO (LINHA DA NEGOCIAÇÃO) ===== */
    const filteredNegotiations = useMemo(() => {
        return negotiations.filter((neg) => {
            const clientName = neg.contract?.client?.nome || "Cliente Desconhecido";
            const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || neg.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [negotiations, searchTerm, statusFilter]);

    const currentSelectedNegotiation = useMemo(() => {
        if (!selectedNegotiationId) return null;
        return negotiations.find(neg => neg.id === selectedNegotiationId) || null;
    }, [selectedNegotiationId, negotiations]);

    /* ===== REFETCH MANUAL ===== */
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["all-negotiations"] }),
            queryClient.invalidateQueries({ queryKey: ["negotiations-summary"] })
        ]);
        setIsRefreshing(false);
    };

    /* ===== MUTATIONS ===== */
    const payInstallmentMutation = useMutation({
        mutationFn: payNegotiationInstallment,
        onSuccess: (data: any) => {
            if (data?.acordoConcluido) {
                toast.success("Última parcela paga! Acordo 100% Finalizado! 🎉");
                setSelectedNegotiationId(null);
            } else {
                toast.success("Parcela baixada com sucesso! 💰");
            }
            handleManualRefresh();
        },
        onError: (error: any) => toast.error(error.message || "Erro ao baixar parcela.")
    });

    const breakNegotiationMutation = useMutation({
        mutationFn: breakNegotiation,
        onSuccess: () => {
            toast.error("Acordo cancelado e marcado como QUEBRADO! 🚨");
            setSelectedNegotiationId(null);
            handleManualRefresh();
        },
        onError: (error: any) => toast.error(error.message || "Erro ao quebrar o acordo.")
    });

    return (
        <div className="min-h-screen bg-[#0a0e17] p-6 text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Handshake className="w-8 h-8 text-emerald-400" /> Painel de Acordos
                        </h1>
                        <p className="text-muted-foreground text-sm">Monitoramento de renegociações e parcelas geradas</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <DateRangePicker value={range} onApply={setRange} />
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            onClick={() => {
                                handleManualRefresh();
                                toast.info("Painel de acordos atualizado.");
                            }}
                            disabled={isRefreshing || isLoadingNegotiations}
                        >
                            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* CARDS DE RESUMO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-card/50 border-white/10 backdrop-blur-md">
                        <p className="text-[11px] text-gray-400 uppercase font-medium">Movimentado em Acordos</p>
                        <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">{formatCurrency(summary.totalAcordado)}</p>
                    </Card>
                    <Card className="p-4 bg-card/50 border-white/10 backdrop-blur-md">
                        <p className="text-[11px] text-gray-400 uppercase font-medium">Total de Descontos Concedidos</p>
                        <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{formatCurrency(summary.totalDescontos)}</p>
                    </Card>
                    <Card className="p-4 bg-card/50 border-white/10 backdrop-blur-md">
                        <p className="text-[11px] text-gray-400 uppercase font-medium">Acordos Quitados</p>
                        <p className="text-2xl font-bold text-blue-400 font-mono mt-1">{formatCurrency(summary.totalRecebido)}</p>
                    </Card>
                    <Card className="p-4 bg-card/50 border-white/10 backdrop-blur-md">
                        <p className="text-[11px] text-gray-400 uppercase font-medium">Prejuízo (Acordos Quebrados)</p>
                        <p className="text-2xl font-bold text-red-400 font-mono mt-1">{formatCurrency(summary.totalQuebrado)}</p>
                    </Card>
                </div>

                {/* FILTROS E TABELA DE NEGOCIAÇÕES */}
                <Card className="p-4 md:p-6 bg-card/50 border-white/10 backdrop-blur-md space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-emerald-400">Histórico de Acordos Firmados</h2>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-60">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar devedor..."
                                    className="pl-10 bg-white/5 border-white/10 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="PENDENTE">Pendentes</SelectItem>
                                    <SelectItem value="CONCLUIDO">Concluídos</SelectItem>
                                    <SelectItem value="QUEBRADO">Quebrados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400">
                                    <th className="py-3 px-4">Devedor</th>
                                    <th className="py-3 px-4">Tipo</th>
                                    <th className="py-3 px-4">Valor Acordado</th>
                                    <th className="py-3 px-4">Desconto</th>
                                    <th className="py-3 px-4">Parcelas</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNegotiations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">
                                            Nenhum acordo encontrado para os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredNegotiations.map((neg) => (
                                        <tr key={neg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-4 font-medium">
                                                {neg.contract?.client?.nome || "Cliente Desconhecido"}
                                            </td>
                                            <td className="py-3 px-4 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full ${neg.tipo === 'PARCELADO' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                                    {neg.tipo}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-emerald-400 font-mono">
                                                {formatCurrency(neg.valorAcordado)}
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 font-mono">
                                                {formatCurrency(neg.valorDesconto)}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs">
                                                {neg.installments?.length || 1}x
                                            </td>
                                            <td className="py-3 px-4 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                    neg.status === 'CONCLUIDO' ? 'bg-blue-500/20 text-blue-300' :
                                                    neg.status === 'QUEBRADO' ? 'bg-red-500/20 text-red-300' :
                                                    'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                    {neg.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                                                    onClick={() => setSelectedNegotiationId(neg.id)}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> Parcelas
                                                </Button>
                                                
                                                {neg.status === "PENDENTE" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs"
                                                        disabled={breakNegotiationMutation.isPending}
                                                        onClick={() => {
                                                            if(confirm("Tem certeza que deseja quebrar e cancelar esta negociação?")) {
                                                                breakNegotiationMutation.mutate(neg.id);
                                                            }
                                                        }}
                                                    >
                                                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Quebrar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* MODAL HISTÓRICO DE PAGAMENTO */}
            <NegotiationHistoryModal
                open={!!selectedNegotiationId}
                negotiation={currentSelectedNegotiation}
                onClose={() => setSelectedNegotiationId(null)}
                onPayInstallment={payInstallmentMutation.mutate}
                isPaying={payInstallmentMutation.isPending}
                onBreakNegotiation={breakNegotiationMutation.mutate}
                isBreaking={breakNegotiationMutation.isPending}
                formatCurrency={formatCurrency}
                formatDate={formatDateIgnoreTimezone}
            />
        </div>
    );
};

export default Negotiations;