import { api } from "@/services/api";

/* =======================
   TIPAGENS GERAIS
======================= */

export type ExpenseType = "FIXO" | "PARCELADO" | "VARIAVEL";
export type TransactionFlow = "ENTRADA" | "SAIDA";
export type TransactionStatus = "PENDENTE" | "CONCLUIDO" | "CANCELADO";

export type FinanceExpense = {
  id: string;
  descricao: string;
  tipo: ExpenseType;
  tipo_fluxo: TransactionFlow;
  status: TransactionStatus;
  categoria?: string | null;
  valor: number;
  pago: boolean;
  dataInicio: string;
  parcelasTotal?: number | null;
  parcelaAtual?: number | null;
  diaDoMes?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceExpenseInput = {
  descricao: string;
  tipo: ExpenseType;
  tipo_fluxo?: TransactionFlow;
  status?: TransactionStatus;
  categoria?: string | null;
  valor: number;
  pago?: boolean;
  dataInicio?: string;
  parcelasTotal?: number | null;
  parcelaAtual?: number | null;
  diaDoMes?: number | null;
};

/* =========================================================
   📊 INTERFACE ATUALIZADA: RESUMO FINANCEIRO
   (Alinhada com o cálculo de Juros Real vs Caixa)
========================================================= */
export interface FinanceSummaryResponse {
  // REALIZADO
  totalEntradas: number;           
  totalPrincipalRecebido: number;
  totalJurosRecebido: number;      
  totalGastos: number;             
  saldo: number;
  saldoCumulativoGlobal?: number; 

  // PREVISTO (Novo Objeto)
  previsao: {
    totalEntradas: number;  // Quanto falta entrar (Geral)
    totalPrincipal: number; // Quanto falta voltar de capital
    totalJuros: number;     // Quanto falta lucrar
  };

  subDetalhes?: {
    entradasManuais: number;
    recebidoContratos: number;
    taxasRecebidas: number;
  };
}

/* =======================
   CHAMADAS API
======================= */

export async function listFinanceExpenses(params?: {
  startDate?: string;
  endDate?: string;
  tipo?: ExpenseType;
  tipo_fluxo?: TransactionFlow;
  status?: TransactionStatus;
  search?: string;
}): Promise<FinanceExpense[]> {
  const { data } = await api.get("/finance/expenses", { params });
  return data;
}

export const getFinanceSummary = async (params: {
  startDate: string;
  endDate: string;
}): Promise<FinanceSummaryResponse> => {
  const { data } = await api.get<FinanceSummaryResponse>(
    "/finance/expenses/summary",
    { params }
  );
  return data;
};

export async function createFinanceExpense(
  payload: FinanceExpenseInput
): Promise<FinanceExpense> {
  const { data } = await api.post("/finance/expenses", payload);
  return data;
}

export async function updateFinanceExpense(
  id: string,
  payload: Partial<FinanceExpenseInput>
): Promise<FinanceExpense> {
  const { data } = await api.put(`/finance/expenses/${id}`, payload);
  return data;
}

export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<FinanceExpense> {
  const { data } = await api.patch(`/finance/expenses/${id}/status`, {
    status,
  });
  return data;
}

export async function removeFinanceExpense(
  id: string,
  mode: "single" | "future" | "all" = "single"
): Promise<void> {
  await api.delete(`/finance/expenses/${id}`, { params: { mode } });
}