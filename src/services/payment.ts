import { api } from "./api";

/* ===============================
    TIPAGENS (INDIVIDUAL E GERAL)
=============================== */

export type PaymentHistoryItem = {
  id: string;
  contractId: string;
  tipo: "JUROS" | "PRINCIPAL" | "MISTO" | "AMORTIZACAO"; // ✅ Adicionado AMORTIZACAO
  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;
  multaCobrada: number;
  observacao?: string;
  createdAt: string;
  createdByUser?: {
    id: string;
    nome: string;
    email: string;
  };
};

export interface FinanceSummaryResponse {
  totalEmprestado: number;
  subTotalEmprestado: {
    diario: number;
    semanal: number;
    mensal: number;
  };

  jurosETaxasAReceber: number;
  subJurosAReceber: {
    jurosMensal: number;
    jurosParcelado: number;
    taxas: number;
  };

  totalMontanteAReceber: number;
  subMontanteAReceber: {
    parcelas: number;
    mensal: number;
  };

  totalRecebido: number;
  subTotalRecebido: {
    viaParcelas: number;
    viaMensal: number;
    viaTaxas: number;
  };
}

export type PaymentPeriodItem = {
  id: string;
  tipo: "JUROS" | "PRINCIPAL" | "MISTO" | "AMORTIZACAO"; // ✅ Adicionado AMORTIZACAO
  valorPago: number;
  pagoJuros: number;
  pagoPrincipal: number;
  pagoTaxa: number;
  multaCobrada: number;
  dataPagamento: string;
  observacao?: string;
  contractId: string;
  createdAt: string;

  contract: {
    id: string;
    vencimentoEm: string;
    jurosPercent: number;
    valorPrincipal: number;
    periodicity: string;
    client: {
      nome: string;
    };
  };

  createdByUser: {
    id: string;
    nome: string;
    email: string;
  };
};

/* ✅ NOVO: INTERFACE PARA O PAYLOAD DE AMORTIZAÇÃO SECA */
export interface AmortizePaymentPayload {
  tipo: string;
  valorPago: number;
  valorDestinadoPrincipal: number;
  valorDestinadoJuros: number;
  valorDestinadoTaxa: number;
  observacao?: string;
}

/* ===============================
    ✅ OPERAÇÕES DE PAGAMENTO
=============================== */

export async function createPayment(
  contractId: string,
  paymentData: { tipo: string; valorPago: number; observacao?: string }
) {
  const { data } = await api.post(
    `/payment/contracts/${contractId}`,
    paymentData
  );
  return data;
}

/**
 * 🎯 NOVO: AMORTIZAÇÃO DIRETA DE CONTRATO
 * Envia os valores exatos de abatimento para o backend
 */
export async function amortizeContract(
  contractId: string,
  amortizeData: AmortizePaymentPayload
) {
  // Ajustado para seguir o seu padrão de prefixo de rota `/payment/...`
  const { data } = await api.post(
    `/payment/amortize/${contractId}`,
    amortizeData
  );
  return data;
}

/**
 * 🗑️ EXCLUIR PAGAMENTO (Estorno)
 * Remove o registro de histórico e reverte os valores no contrato
 */
export async function deletePayment(paymentId: string) {
  const { data } = await api.delete(`/payment/${paymentId}`);
  return data;
}

/* ===============================
    🔍 CONSULTAS (HISTÓRICO E LISTAGEM)
=============================== */

export async function getPaymentHistoryByContract(contractId: string) {
  const { data } = await api.get<PaymentHistoryItem[]>(
    `/payment/contracts/${contractId}/history`
  );
  return data;
}

/* ===============================
    📊 DASHBOARD FINANCEIRO
=============================== */

export async function getFinanceSummary(startDate: string, endDate: string) {
  const { data } = await api.get<FinanceSummaryResponse>(
    "/payment/finance/summary",
    {
      params: { startDate, endDate },
    }
  );
  return data;
}

export async function getPaymentsByPeriod(startDate: string, endDate: string) {
  const { data } = await api.get<PaymentPeriodItem[]>(
    "/payment/finance/payments",
    {
      params: { startDate, endDate },
    }
  );
  return data;
}