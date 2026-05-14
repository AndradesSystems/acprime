import { api } from "./api";

/* =======================
    MODELS
======================= */

/**
 * Opções de periodicidade permitidas pelo Prisma
 */
export type ContractPeriodicity = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Taxa {
  id: string;
  type: ContractPeriodicity;
  value: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload usado para criar ou atualizar taxas (Upsert)
 */
export type TaxaInput = {
  type: ContractPeriodicity;
  value: number;
};

/* =======================
    API CALLS
======================= */

/**
 * Lista todas as taxas configuradas no sistema
 */
export const getTaxas = async (): Promise<Taxa[]> => {
  const { data } = await api.get<Taxa[]>("/taxas");
  return data;
};

/**
 * Busca uma taxa específica pelo tipo (ex: MONTHLY)
 */
export const getTaxaByType = async (type: ContractPeriodicity): Promise<Taxa> => {
  const { data } = await api.get<Taxa>(`/taxas/${type}`);
  return data;
};

/**
 * Atualiza ou cria uma taxa no sistema
 * @param payload Objeto contendo o tipo e o novo valor
 */
export const updateTaxa = async (payload: TaxaInput): Promise<Taxa> => {
  const { data } = await api.put<Taxa>("/taxas", payload);
  return data;
};