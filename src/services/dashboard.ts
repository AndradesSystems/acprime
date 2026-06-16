import { api } from "./api";

export type DashboardRecentContract = {
  id: string;
  clientName: string;
  valorPrincipal: number;
  jurosCalculados: number;
  vencimentoEm: string;
  status: string;
  periodicity: "DAILY" | "WEEKLY" | "MONTHLY";
  totalInstallments: number;
  paidInstallments: number;
};

export type DashboardSummary = {
  totalEmprestado: number;
  subTotalEmprestado: { diario: number; semanal: number; mensal: number };
  jurosETaxasAReceber: number;
  // 🎯 Atualizado para a nova estrutura discriminada do Back-end
  subJurosAReceber: { 
    jurosMensais: number; 
    jurosParcelados: number; 
    taxas: number; 
  };
  totalMontanteAReceber: number;
  subMontanteAReceber: { parcelas: number; mensal: number };
  totalRecebido: number;
  subTotalRecebido: {
    viaParcelas: number;
    viaMensal: number;
    viaTaxas: number;
  };
  recentContracts: DashboardRecentContract[];
  contratosAtrasados: number
};

export const getDashboardSummary = async (params: {
  startDate: string;
  endDate: string;
}): Promise<DashboardSummary> => {
  const { data } = await api.get<any>("/dashboard/summary", {
    params,
  })

  return data;
};