import { api } from "./api";

/* =======================
   MODELS
======================= */

export interface Contract {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
}

export interface Client {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;
  endereco?: string | null;
  createdAt: string;
  updatedAt: string;

  userId: string;
  contracts: Contract[];
}

/**
 * Payload usado em CREATE e UPDATE
 * ❌ NÃO inclui userId nem contracts
 */
export type ClientInput = {
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;
  endereco?: string | null;
};

/* =======================
   API CALLS
======================= */

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get<Client[]>("/client");
  return data;
};

export const createClient = async (
  payload: ClientInput
): Promise<Client> => {
  const { data } = await api.post<Client>("/client", payload);
  return data;
};

export const updateClient = async (
  id: string,
  payload: ClientInput
): Promise<Client> => {
  const { data } = await api.put<Client>(`/client/${id}`, payload);
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/client/${id}`);
};
