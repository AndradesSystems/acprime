import { api } from "./api";

/* =========================================================
    📋 MODELS (FRONTEND REFINADO PARA O NOVO BACKEND)
   ========================================================= */

/**
 * 🟢 NOVO: Estrutura detalhada de lançamentos e pontualidade do histórico de pagamentos
 */
export interface PaymentHistoryCounters {
  noPrazo: number;          // Quantidade de pagamentos reais feitos em dia
  atrasos: number;          // Quantidade de pagamentos reais feitos após o vencimento
  totalLancamentos: number; // Quantidade total de registros na tabela PaymentHistory
}

/**
 * Interface que representa a quebra analítica de cada contrato do cliente
 */
export interface ContractDossier {
  id: string;
  status: "ABERTO" | "ATRASADO" | "QUITADO" | "COBRANCA_PESSOAL" | "CALOTEIRO";
  periodicidade: "DAILY" | "WEEKLY" | "MONTHLY";
  vencimento: string;
  dinheiroEmprestado: number; 
  valorEmAbertoAtual: number;  
  taxaAcumuladaInadimplencia: number; // Multas geradas pelo motor
  taxaDeJurosContratual: number;      // % de juros acordado
  totalPago: number;     // Tudo que já foi pago neste contrato
  principalPago: number; // Apenas amortização do principal
  jurosPagos: number;    // Juros recuperados
  taxasPagas: number;    // Multas/taxas recuperadas
  totalParcelas: number;
  
  // 🟢 CAMPO ATUALIZADO: Vinculado diretamente ao retorno do novo ScoreService
  historicoPagamentos: PaymentHistoryCounters;
}

/**
 * Estrutura exata mapeada para renderizar os cards e contadores da foto do painel
 */
export interface PainelScoreData {
  valor: number;
  nivelAnalise: string; // Ex: "Análise Consistente", "Risco Crítico"
  totalEmprestado: number; 
  totalDevolvido: number;   
  retornoCapitalPercent: number; // Ex: 84.00 (Pronto para a barra de progresso)
  contadores: {
    noPrazo: number;  // Parcelas pagas rigorosamente no prazo (acumulado histórico)
    atrasos: number;  // Total de atrasos (atrasos históricos pagos + parcelas vencidas hoje)
    abertas: number;  // Parcelas em aberto atualmente sem atraso crítico
  };
  motivos: string[];  // Array de logs explicativos para auditoria na tela
}

/**
 * Interface principal do Cliente com o Dossiê e Painel Acoplados
 */
export interface ClientWithScore {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  scoreGlobal: number; // Score numérico direto (0 a 1000)
  painelScore: PainelScoreData | null; // Dados exatos para os cards da foto
  contratos: ContractDossier[]; // Dossiê de todos os contratos dele
}

/**
 * Resposta atualizada da rota de recálculo manual (que agora já traz os dados novos)
 */
export interface RecalculateScoresResponse {
  success: boolean;
  message: string;
  data: ClientWithScore[]; // O backend agora já retorna os dados atualizados!
}

/* =========================================================
    🌐 API CALLS
   ========================================================= */

/**
 * Busca a listagem completa de todos os clientes do usuário com seus respectivos scores incluídos
 * GET /score/clients
 */
export const getClientsWithScores = async (): Promise<ClientWithScore[]> => {
  const { data } = await api.get<ClientWithScore[]>("/score/clients");
  return data;
};

/**
 * Dispara o motor de crédito para recalcular as notas instantaneamente e já colhe a resposta atualizada
 * POST /score/recalculate
 */
export const forceRecalculateScores = async (): Promise<RecalculateScoresResponse> => {
  const { data } = await api.post<RecalculateScoresResponse>("/score/recalculate");
  return data;
};