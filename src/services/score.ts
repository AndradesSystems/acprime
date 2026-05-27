import { api } from "./api";

/* =======================
    MODELS
======================= */

/**
 * Interface que representa os detalhes analíticos do Score de um cliente (Model ClientScore do Prisma)
 */
export interface ClientScore {
  id: string;
  valor: number;
  nivelAnalise: string;
  // O backend envia campos Decimal como string para manter a precisão numérica
  totalEmprestado: string;
  totalPago: string;
  retornoCapital: string;
  noPrazo: number;
  atrasos: number;
  abertas: number;
  motivos: string[];
  clientId: string;
  updatedAt: string; // Data ISO (ex: 2026-05-27T14:00:00.000Z)
}

/**
 * Interface estendida do Cliente que já vem com o objeto de Score acoplado
 */
export interface ClientWithScore {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  score: string; // Coluna legada/string do cliente
  userId: string;
  createdAt: string;
  updatedAt: string;
  clientScore: ClientScore | null; // Pode ser nulo se o motor nunca tiver rodado para este cliente
}

/**
 * Resposta padrão da rota de recálculo manual
 */
export interface RecalculateScoresResponse {
  success: boolean;
  message: string;
}

/* =======================
    API CALLS
======================= */

/**
 * Busca a listagem completa de todos os clientes do usuário com seus respectivos scores incluídos
 * GET /scores/clients-scores
 */
export const getClientsWithScores = async (): Promise<ClientWithScore[]> => {
  const { data } = await api.get<ClientWithScore[]>("/score/clients");
  return data;
};

/**
 * Dispara o motor de crédito do backend para recalcular as notas de todos os clientes instantaneamente
 * POST /scores/recalculate-scores
 */
export const forceRecalculateScores = async (): Promise<RecalculateScoresResponse> => {
  const { data } = await api.post<RecalculateScoresResponse>("/score/recalculate");
  return data;
};