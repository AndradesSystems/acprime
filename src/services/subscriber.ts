import { api } from "./api";

/* =======================
    MODELS
======================= */

export type SubscriberStatus = "ATIVO" | "BLOQUEADO";

export interface Subscriber {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  plan: "VAZIO" | "STARTER" | "PRO";
  tipo: "ASSINANTE" | "ADMIN" | "OPERADOR";
  status: SubscriberStatus; 
  vencimento: string | null; 
  createdAt: string;
  updatedAt: string;
}

export type SubscriberInput = {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  diasValidade?: number;
};

export type SubscriberUpdateInput = {
  nome?: string;
  email?: string;
  senha?: string;
  cpf?: string;
  vencimento?: string; // String ISO esperada pelo backend
  diasValidade?: number;
  plan?: "VAZIO" | "STARTER" | "PRO"; // 🌟 Corrigido: Agora é opcional
  status?: SubscriberStatus; 
};

export type ChangePasswordInput = {
  senhaAntiga: string;
  novaSenha: string;
};

/* =======================
    API CALLS (ADMIN)
======================= */

export const getSubscribers = async (): Promise<Subscriber[]> => {
  const { data } = await api.get<Subscriber[]>("/users/assinantes");
  return data;
};

export const createSubscriber = async (
  payload: SubscriberInput
): Promise<Subscriber> => {
  const { data } = await api.post<Subscriber>("/users/assinantes", payload);
  return data;
};

export const updateSubscriber = async (
  id: string,
  payload: SubscriberUpdateInput
): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, payload);
  return data;
};

export const renewSubscriber = async (id: string, dias: number = 30): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, { diasValidade: dias });
  return data;
};

export const deleteSubscriber = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

/* =======================
    API CALLS (ASSINANTE / PERFIL)
======================= */

export const updateMyProfile = async (
  id: string, 
  payload: SubscriberUpdateInput
): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, payload);
  return data;
};

export const changeMyPassword = async (
  id: string,
  novaSenha: string
): Promise<Subscriber> => {
  const { data } = await api.put<Subscriber>(`/users/${id}`, { senha: novaSenha });
  return data;
};