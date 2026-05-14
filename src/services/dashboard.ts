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
  subJurosAReceber: { juros: number; taxas: number };
  totalMontanteAReceber: number;
  subMontanteAReceber: { parcelas: number; mensal: number };
  totalRecebido: number;
  subTotalRecebido: {
    viaParcelas: number;
    viaMensal: number;
    viaTaxas: number;
  };
  recentContracts: DashboardRecentContract[];
};

export const getDashboardSummary = async (params: {
  startDate: string;
  endDate: string;
}): Promise<DashboardSummary> => {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary", {
    params,
  });
  return data;
};
