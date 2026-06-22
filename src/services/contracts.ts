import { api } from "./api";

/* =======================
    TYPES
======================= */

export type ContractStatus =
  | "ABERTO"
  | "ATRASADO"
  | "QUITADO"
  | "PAGO"
  | "COBRANCA_PESSOAL";

export type ContractPeriodicity = "DAILY" | "WEEKLY" | "MONTHLY" | "PARCELADO";
export type InstallmentStatus = "PENDENTE" | "PAGO";

/* ✅ TIPO DA PARCELA */
export type ContractInstallment = {
  id: string;
  numeroParcela: number;
  taxa: number;
  valor: string;        // Vem como string do Decimal do banco
  dataVencimento: string;
  status: InstallmentStatus;
  dataPagamento?: string | null;
};

/* ===== CLIENT ===== */

export type Client = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;

  createdAt: string;
  updatedAt: string;
};

/* ===== PAYMENTS ===== */

export type PaymentHistory = {
  id: string;

  // ✅ ADICIONADO: "AMORTIZACAO" incluído nos tipos de pagamentos
  tipo: "JUROS" | "PRINCIPAL" | "MISTO" | "PERSONALIZADO" | "AMORTIZACAO";

  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;
  multaCobrada: number;

  dataPagamento: string;
  observacao?: string | null;

  createdAt: string;

  createdByUser?: {
    id: string;
    nome: string;
    email: string;
  };
};

/* ✅ NOVO: INTERFACE PARA O PAYLOAD DE AMORTIZAÇÃO SECA */
export interface AmortizePaymentPayload {
  tipo: "AMORTIZACAO";
  valorPago: number;
  valorDestinadoPrincipal: number;
  valorDestinadoJuros: number;
  valorDestinadoTaxa: number;
  observacao?: string;
}

/* ===== CONTRACT ===== */

export type Contract = {
  id: string;

  valorPrincipal: string;
  valorEmAberto: string;

  taxa: string;

  jurosPercent: string;
  vencimentoEm: string;

  periodicity: ContractPeriodicity;

  status: ContractStatus;
  historico?: string | null;

  createdAt: string;
  updatedAt: string;

  clientId: string;
  userId: string;

  /** relations */
  client?: Client;
  payments?: PaymentHistory[];

  // ✅ Lista de parcelas (para Diário/Semanal)
  installments?: ContractInstallment[];
};

/* ===== INPUT ===== */
export type ContractInput = {
  clientId: string;
  valorPrincipal: number;
  jurosPercent: number;
  vencimentoEm: string;

  periodicity: ContractPeriodicity;

  dataInicio?: string; // 👈 novo campo opcional
  historico?: string;
  qtdParcelas?: number; // 🔥 ADICIONE ESTA LINHA AQUI!
};


/* =======================
    API CALLS
======================= */

export const listContracts = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Contract[]> => {
  const { data } = await api.get<Contract[]>("/contract", {
    params: {
      startDate: params?.startDate,
      endDate: params?.endDate,
    },
  });

  return data;
};


export const createContract = async (
  payload: ContractInput
): Promise<Contract> => {
  const { data } = await api.post<Contract>("/contract", payload);
  return data;
};

export const getContractById = async (id: string): Promise<Contract> => {
  const { data } = await api.get<Contract>(`/contract/${id}`);
  return data;
};

// Tipagem para o Summary
export type ContractSummary = {
  contractId: string;
  status: ContractStatus;
  principalEmAberto: number;
  taxaPendente: number;
  jurosDoMes: number;
  diasAtraso: number;
  multa: number;
  totalMes: number;
  totalComMulta: number;
  vencimentoEm: string;

  // ✅ O Summary agora retorna as parcelas para você mostrar na tela de pagamento
  installments?: ContractInstallment[];
};

export const getContractSummary = async (id: string): Promise<ContractSummary> => {
  const { data } = await api.get<ContractSummary>(`/contract/${id}/summary`);
  return data;
};

export const getContractsByClient = async (
  clientId: string
): Promise<Contract[]> => {
  const { data } = await api.get<Contract[]>(
    `/contract/client/${clientId}`
  );
  return data;
};


export async function deleteContract(id: string) {
  const { data } = await api.delete(`/contract/${id}`);
  return data;
}

/* =======================
    UPDATE DUE DATE
======================= */

export const updateContractDueDate = async (
  contractId: string,
  vencimentoEm: string
): Promise<Contract> => {
  const { data } = await api.patch<Contract>(
    `/contract/${contractId}/due-date`,
    { vencimentoEm }
  );

  return data;
};


export const notifyContractClient = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>(`/finance/contracts/${id}/notify`);
  return data;
};