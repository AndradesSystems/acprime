import { api } from "./api";

/* =======================
   MODELS
======================= */

export interface Contract {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  valorEmAberto?: number; // 🟢 Adicionado para refletir o saldo devedor no quadro de caloteiros
}

export interface Client {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;
  endereco?: string | null;
  images?: string[]; // Propriedade adicionada para listar as URLs que vêm do banco
  createdAt: string;
  updatedAt: string;

  userId: string;
  contracts: Contract[];
}

/**
 * Payload usado em CREATE e UPDATE nos componentes do Front-end
 */
export type ClientInput = {
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;
  endereco?: string | null;
  documentos?: File[]; // Campo adicionado para receber os arquivos binários do input do HTML
};

// 🔴 Tipagem das ações permitidas para o gerenciamento do quadro
export type CaloteiroAction = "MANDAR_PRO_QUADRO" | "TIRAR_DO_QUADRO";

/* =======================
   HELPER FUNCTION
======================= */

/**
 * Converte o objeto de input tradicional em um FormData legível pelo Multer no backend
 */
const prepareFormData = (payload: ClientInput): FormData => {
  const formData = new FormData();

  // Anexa os campos de texto normais
  if (payload.nome) formData.append("nome", payload.nome);
  if (payload.cpf) formData.append("cpf", payload.cpf);
  if (payload.telefone) formData.append("telefone", payload.telefone);
  if (payload.email) formData.append("email", payload.email);
  if (payload.dataNascimento) formData.append("dataNascimento", payload.dataNascimento);
  if (payload.endereco) formData.append("endereco", payload.endereco);

  // Anexa os arquivos binários no campo idêntico ao configurado no backend: 'documentos'
  if (payload.documentos && payload.documentos.length > 0) {
    payload.documentos.forEach((file) => {
      formData.append("documentos", file);
    });
  }

  return formData;
};

/* =======================
   API CALLS
======================= */

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get<Client[]>("/client");
  return data;
};

// 🟢 NOVA CHAMADA: Busca a lista global de clientes negativados (caloteiros)
export const getCaloteiros = async (): Promise<Client[]> => {
  const { data } = await api.get<Client[]>("/client/caloteiros");
  return data;
};

export const createClient = async (
  payload: ClientInput
): Promise<Client> => {
  // Converte os dados antes do disparo da rota POST
  const formData = prepareFormData(payload);
  
  const { data } = await api.post<Client>("/client", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateClient = async (
  id: string,
  payload: ClientInput
): Promise<Client> => {
  // Converte os dados antes do disparo da rota PUT
  const formData = prepareFormData(payload);

  const { data } = await api.put<Client>(`/client/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/client/${id}`);
};

/**
 * 🔴 NOVA CHAMADA: Altera o status do contrato para incluir ou remover o devedor do quadro de caloteiros
 */
export const toggleContractCaloteiroStatus = async (
  contractId: string,
  acao: CaloteiroAction
): Promise<any> => {
  const { data } = await api.patch(`/client/contracts/${contractId}/toggle-caloteiro`, { acao });
  return data;
};