import { api } from "./api";

/* =================================================================================
   MODELS & TYPES
   ================================================================================= */

export interface NegotiationInstallment {
  id: string;
  negotiationId: string;
  numeroParcela: number;
  valorParcela: string | number;
  vencimentoEm: string;
  pagoEm: string | null;
  status: "PENDENTE" | "PAGO" | "ATRASADO";
  createdAt: string;
  updatedAt: string;
}

export interface Negotiation {
  id: string;
  contractId: string;
  valorOriginalPrincipal: string | number;
  valorOriginalEmAberto: string | number;
  valorOriginalTaxa: string | number;
  originalJurosPercent: string | number;
  valorDesconto: string | number;
  valorAcordado: string | number;
  tipo: "A_VISTA" | "PARCELADO";
  status: "PENDENTE" | "CONCLUIDO" | "QUEBRADO";
  createdAt: string;
  updatedAt: string;
  
  // Direto ao ponto: apenas o que o include do Prisma joga na tela
  contract?: {
    clientId: string;
    status: string;
    client?: {
      nome: string;
    };
  };
  installments: NegotiationInstallment[];
}

export type CreateNegotiationInput = {
  contractId: string;
  valorDesconto: number;
  tipo: "A_VISTA" | "PARCELADO";
  qtdParcelas: number;
  primeiroVencimento: string; 
};

export interface PayInstallmentResponse {
  installment: NegotiationInstallment;
  acordoConcluido: boolean; 
}

export interface NegotiationSummaryResponse {
  totalAcordado: number;
  totalDescontos: number;
  totalRecebido: number;
  totalQuebrado: number;
}

/* =================================================================================
   API CALLS
   ================================================================================= */

export const createNegotiation = async (payload: CreateNegotiationInput): Promise<Negotiation> => {
  const { data } = await api.post<Negotiation>("/negotiation", payload);
  return data;
};

export const payNegotiationInstallment = async (installmentId: string): Promise<PayInstallmentResponse> => {
  const { data } = await api.patch<PayInstallmentResponse>(`/negotiation/installments/${installmentId}/pay`);
  return data;
};

export const getNegotiationByContract = async (contractId: string): Promise<Negotiation | null> => {
  const { data } = await api.get<Negotiation | null>(`/negotiation/contract/${contractId}`);
  return data;
};

export const breakNegotiation = async (negotiationId: string): Promise<Negotiation> => {
  const { data } = await api.patch<Negotiation>(`/negotiation/${negotiationId}/break`);
  return data;
};

export const getNegotiationSummary = async (): Promise<NegotiationSummaryResponse> => {
  const { data } = await api.get<NegotiationSummaryResponse>(`/negotiation/summary`);
  return data;
};