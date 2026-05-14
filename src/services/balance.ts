import { api } from "./api";

/* =======================
    MODELS
======================= */

/**
 * Tipo de fluxo financeiro (igual ao Enum do Prisma/Backend)
 */
export type TransactionFlow = "ENTRADA" | "SAIDA";

/**
 * Interface que representa um registro no Extrato (BalanceLog)
 */
export interface BalanceLog {
  id: string;
  tipo: TransactionFlow;
  // O backend pode enviar Decimal como string para precisão, ou number. Aceitamos ambos.
  valor: number | string; 
  descricao: string;
  saldoAnterior: number | string;
  saldoNovo: number | string;
  createdAt: string; // Data ISO (ex: 2023-10-25T14:00:00.000Z)
  userId: string;
}

/**
 * Resposta da rota de saldo atual
 */
export interface BalanceResponse {
  saldo: number;
}

/**
 * Payload usado para realizar Aporte ou Sangria
 */
export type BalanceOperationInput = {
  valor: number;
  descricao: string;
};

/* =======================
    API CALLS
======================= */

/**
 * Busca o saldo operacional atual do usuário logado
 * GET /balance
 */
export const getBalance = async (): Promise<BalanceResponse> => {
  const { data } = await api.get<BalanceResponse>("/balance");
  return data;
};

/**
 * Busca o histórico completo de movimentações (Extrato)
 * GET /balance/history
 */
export const getBalanceHistory = async (): Promise<BalanceLog[]> => {
  const { data } = await api.get<BalanceLog[]>("/balance/history");
  return data;
};

/**
 * Realiza um APORTE (Adicionar dinheiro ao caixa)
 * POST /balance/deposit
 * @param payload Valor e descrição
 */
export const addBalance = async (payload: BalanceOperationInput): Promise<{ novoSaldo: number; operacao: BalanceLog }> => {
  const { data } = await api.post("/balance/deposit", payload);
  return data;
};

/**
 * Realiza uma SANGRIA (Retirar dinheiro do caixa)
 * POST /balance/withdraw
 * @param payload Valor e descrição
 */
export const removeBalance = async (payload: BalanceOperationInput): Promise<{ novoSaldo: number; operacao: BalanceLog }> => {
  const { data } = await api.post("/balance/withdraw", payload);
  return data;
};