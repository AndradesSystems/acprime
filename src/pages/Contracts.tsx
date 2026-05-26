"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Serviços e Tipagens
import {
  listContracts,
  type Contract,
  deleteContract,
} from "@/services/contracts";
import { getFinanceSummary, getPaymentsByPeriod } from "@/services/payment";
import { sendWhatsAppMessage } from "@/services/whapp"; 
import { toggleContractCaloteiroStatus, type CaloteiroAction } from "@/services/clients"; // 🔴 Importado o novo serviço de caloteiro

import NewContractSheet from "@/components/NewContractSheet";
import PaymentContractModal from "@/components/PaymentContractModal";
import PaymentHistoryModal from "@/components/PaymentHistoryModal";
import FinanceSummaryCard from "@/components/FinanceSummaryCard";
import DateRangePicker from "@/components/DateRangePicker";
import SettingsModal from "@/components/SettingModal";
import UpdateDueDateModal from "@/components/updateDueDateModal";

import { useDateRange } from "@/hooks/useDateRange";
import ContractsTable from "@/components/ContractsTable";
import PaymentsTable from "@/components/PaymentsTable";

/* =================================================================================
   FUNÇÕES AUXILIARES MOVIDAS PARA FORA DO COMPONENTE
   ================================================================================= */
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

const getPeriodicityBadge = (type: string) => {
  switch (type) {
    case "DAILY":
      return {
        label: "Diário (20x)",
        className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      };
    case "WEEKLY":
      return {
        label: "Semanal (4x)",
        className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    case "MONTHLY":
      return {
        label: "Mensal",
        className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    default:
      return { label: type, className: "bg-gray-500/10 text-gray-400" };
  }
};

const Contracts = () => {
  const queryClient = useQueryClient();
  const { range, setRange } = useDateRange();

  /* ===== UI STATE ===== */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [historyContract, setHistoryContract] = useState<Contract | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dueDateContract, setDueDateContract] = useState<Contract | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updatingCaloteiroId, setUpdatingCaloteiroId] = useState<string | null>(null); // 🔴 Estado de carregamento individual do botão

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

  /* ===== QUERIES ===== */
  const {
    data: contracts = [],
    isLoading: isLoadingContracts,
    isRefetching: isRefetchingContracts,
  } = useQuery({
    queryKey: ["contracts", dates.start, dates.end],
    queryFn: () =>
      listContracts({ startDate: dates.start, endDate: dates.end }),
    enabled: canFetch,
  });

  const { data: financeSummary, isRefetching: isRefetchingSummary } = useQuery({
    queryKey: ["finance-summary", dates.start, dates.end],
    queryFn: () => getFinanceSummary(dates.start, dates.end),
    enabled: canFetch,
  });

  const {
    data: payments = [],
    isLoading: isLoadingPayments,
    isRefetching: isRefetchingPayments,
  } = useQuery({
    queryKey: ["payments-period", dates.start, dates.end],
    queryFn: () => getPaymentsByPeriod(dates.start, dates.end),
    enabled: canFetch,
  });

  const isGlobalLoading =
    isRefetchingContracts || isRefetchingSummary || isRefetchingPayments;

  /* ===== REFETCH MANUAL ===== */
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["contracts"] }),
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["payments-period"] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
    toast.info("Dados atualizados.");
  };

  /* ===== MUTATIONS ===== */
  const notifyMutation = useMutation({
    mutationFn: async (contract: Contract) => {
      const phone = contract.client?.telefone || (contract.client as any)?.phone;
      if (!phone) {
        throw new Error("Este cliente não possui telefone cadastrado.");
      }

      const message = `Olá, *${contract.client?.nome}*! Passando para lembrar do seu contrato com vencimento em ${formatDateIgnoreTimezone(contract.vencimentoEm)}. Valor em aberto: ${formatCurrency(contract.valorEmAberto)}.`;

      return await sendWhatsAppMessage({ phone, message });
    },
    onSuccess: () => {
      toast.success("Notificação enviada com sucesso via WhatsApp! 🤖");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Falha ao enviar notificação.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      toast.success("Contrato excluído permanentemente.");
      handleManualRefresh();
    },
    onError: () => {
      toast.error("Erro ao tentar excluir o contrato.");
    },
  });

  // 🔴 NOVA MUTATION: Trata a requisição de caloteiro e atualiza as tabelas em seguida
  const toggleCaloteiroMutation = useMutation({
    mutationFn: async ({ contractId, acao }: { contractId: string; acao: CaloteiroAction }) => {
      setUpdatingCaloteiroId(contractId);
      return await toggleContractCaloteiroStatus(contractId, acao);
    },
    onSuccess: (_, variables) => {
      if (variables.acao === "MANDAR_PRO_QUADRO") {
        toast.error("Contrato movido para o Quadro de Caloteiros! 🚨");
      } else {
        toast.success("Contrato rebaixado para Atrasado padrão.");
      }
      // Invalida a lista de contratos do período e de caloteiros globais
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["caloteiros"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao tentar alterar o status de caloteiro.");
    },
    onSettled: () => {
      setUpdatingCaloteiroId(null);
    },
  });

  /* =================================================================================
     CALLBACKS MEMOIZADOS
     ================================================================================= */
  const handleNotify = useCallback(
    (contract: Contract) => {
      notifyMutation.mutate(contract);
    },
    [notifyMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  // 🔴 NOVO CALLBACK: Aciona a mutação ao clicar no botão da tabela
  const handleToggleCaloteiro = useCallback(
    (contractId: string, acao: CaloteiroAction) => {
      toggleCaloteiroMutation.mutate({ contractId, acao });
    },
    [toggleCaloteiroMutation],
  );

  /* ===== FILTROS E HELPERS ===== */
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch =
        c.client?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        true;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-dark p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-premium">
              Gestão Financeira
            </h1>
            <p className="text-muted-foreground text-sm">
              Contratos ativos e recebimentos
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              Taxas
            </Button>

            <DateRangePicker value={range} onApply={setRange} />

            <Button
              variant="outline"
              size="icon"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={handleManualRefresh}
              disabled={isGlobalLoading || isRefreshing}
            >
              <RefreshCcw
                className={`w-4 h-4 ${isGlobalLoading || isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>

            <NewContractSheet classButton="text-sm font-bold bg-gradient-gold text-black border-none" />
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FinanceSummaryCard
            type="TOTAL_EMPRESTADO"
            value={financeSummary?.totalEmprestado ?? 0}
            subInfo={financeSummary?.subTotalEmprestado}
          />
          <FinanceSummaryCard
            type="JUROS_A_RECEBER"
            value={financeSummary?.jurosETaxasAReceber ?? 0}
            subInfo={financeSummary?.subJurosAReceber}
          />
          <FinanceSummaryCard
            type="MONTANTE_TOTAL"
            value={financeSummary?.totalMontanteAReceber ?? 0}
            subInfo={financeSummary?.subMontanteAReceber}
          />
          <FinanceSummaryCard
            type="TOTAL_RECEBIDO"
            value={financeSummary?.totalRecebido ?? 0}
            subInfo={financeSummary?.subTotalRecebido}
          />
        </div>

        {/* TABELA CONTRATOS */}
        <ContractsTable
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isLoading={isLoadingContracts}
          contracts={filteredContracts}
          onNotify={handleNotify}
          isNotifying={notifyMutation.isPending}
          onDelete={handleDelete}
          onSelectContract={setSelectedContract}
          onHistoryContract={setHistoryContract}
          onDueDateContract={setDueDateContract}
          onToggleCaloteiro={handleToggleCaloteiro} // 🔴 Passado o manipulador para o componente da tabela
          isUpdatingCaloteiro={updatingCaloteiroId} // 🔴 Passado o ID de carregamento atual
          formatCurrency={formatCurrency}
          formatDate={formatDateIgnoreTimezone}
          getBadge={getPeriodicityBadge}
        />

        {/* TABELA DE PAGAMENTOS REALIZADOS */}
        <PaymentsTable
          payments={payments}
          isLoading={isLoadingPayments}
          formatCurrency={formatCurrency}
          formatDate={formatDateIgnoreTimezone}
        />
      </div>

      {/* MODALS */}
      <PaymentContractModal
        open={!!selectedContract}
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
        onUpdatedContract={() => {
          setSelectedContract(null);
          handleManualRefresh();
        }}
      />

      <PaymentHistoryModal
        open={!!historyContract}
        contract={historyContract}
        onClose={() => setHistoryContract(null)}
      />

      <UpdateDueDateModal
        open={!!dueDateContract}
        contract={dueDateContract}
        onClose={() => setDueDateContract(null)}
        onUpdated={() => {
          setDueDateContract(null);
          handleManualRefresh();
        }}
      />

      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Contracts;