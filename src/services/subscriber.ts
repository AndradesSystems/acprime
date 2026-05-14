import { api } from "./api";

/* =======================
    MODELS
======================= */

// Atualizado para bater com o Enum UserStatus do Prisma
export type SubscriberStatus = "ATIVO" | "BLOQUEADO";

export interface Subscriber {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  tipo: "ASSINANTE" | "ADMIN" | "OPERADOR";
  status: SubscriberStatus; // Adicionado: Campo real do banco agora
  vencimento: string | null; 
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload usado para criação pelo Admin
 */
export type SubscriberInput = {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  diasValidade?: number;
};

/**
 * Payload usado para atualizar perfil ou dados pelo Admin
 */
export type SubscriberUpdateInput = {
  nome?: string;
  email?: string;
  senha?: string;
  cpf?: string;
  vencimento?: string;
  diasValidade?: number;
  status?: SubscriberStatus; // Adicionado para permitir Pausar/Bloquear
};

/**
 * Payload para alteração de senha
 */
export type ChangePasswordInput = {
  senhaAntiga: string;
  novaSenha: string;
};

/* =======================
    API CALLS (ADMIN)
======================= */

/**
 * Lista todos os assinantes (Painel Admin)
 */
export const getSubscribers = async (): Promise<Subscriber[]> => {
  const { data } = await api.get<Subscriber[]>("/users/assinantes");
  return data;
};

/**
 * Cria um novo assinante
 */
export const createSubscriber = async (
  payload: SubscriberInput
): Promise<Subscriber> => {
  const { data } = await api.post<Subscriber>("/users/assinantes", payload);
  return data;
};

/**
 * Altera dados de um assinante (Nome, Email, Senha ou Status)
 */
export const updateSubscriber = async (
  id: string,
  payload: SubscriberUpdateInput
): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, payload);
  return data;
};

/**
 * Renova a assinatura por mais X dias
 */
export const renewSubscriber = async (id: string, dias: number = 30): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, { diasValidade: dias });
  return data;
};

/**
 * Deleta um assinante/usuário permanentemente
 */
export const deleteSubscriber = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

/* =======================
    API CALLS (ASSINANTE / PERFIL)
======================= */

/**
 * Atualiza os dados do próprio perfil logado
 */
export const updateMyProfile = async (
  id: string, 
  payload: SubscriberUpdateInput
): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, payload);
  return data;
};

/**
 * Altera a própria senha
 */
export const changeMyPassword = async (
  id: string,
  novaSenha: string
): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, { senha: novaSenha });
  return data;
};