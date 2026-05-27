import { api } from "./api";

/* =======================
    MODELS
======================= */

/**
 * Tipos válidos de exportação mapeados conforme o layout do Front-end
 */
export type ExportType = "TOTAL" | "CLIENTES" | "CONTRATOS" | "PAGAMENTOS" | "FINANÇAS";

/**
 * Contadores rápidos retornados para conferência no Front-end após a geração do snapshot
 */
export interface BackupStats {
  clientes: number;
  contratos: number;
  parcelas: number;
  pagamentos: number;
  despesas: number;
  taxas: number;
}

/**
 * Objeto bruto contendo as tabelas filtradas por módulo
 */
export interface BackupTables {
  taxas: any[];
  clients: any[];
  personalExpense: any[];
  contracts: any[];
  contractInstallment: any[];
  paymentHistory: any[];
}

/**
 * Interface que representa a estrutura completa do arquivo JSON de Backup/Exportação
 */
export interface BackupSnapshotResponse {
  backupDate: string; // Data ISO (ex: 2026-05-27T20:15:00.000Z)
  exportType: ExportType;
  userId: string;
  stats: BackupStats;
  tables: BackupTables;
}

/**
 * Resposta padrão retornada após o upload e processamento do arquivo de restauração
 */
export interface ImportBackupResponse {
  success: boolean;
  message: string;
}

/* =======================
    API CALLS
======================= */

/**
 * Baixa o snapshot de dados (Integral ou Segmentado por Módulo) do lojista autenticado
 * GET /backup/export?type=...
 * * @param type O tipo do módulo que deseja exportar (padrão: "TOTAL")
 */
export const exportBackupData = async (type: ExportType = "TOTAL"): Promise<BackupSnapshotResponse> => {
  const { data } = await api.get<BackupSnapshotResponse>("/backup/export", {
    params: { type },
    // Caso precise forçar o download como arquivo bruto pelo Axios diretamente, use responseType: 'blob'
  });
  return data;
};

/**
 * Envia um objeto de backup completo para restaurar e sobrescrever os dados no banco do backend
 * POST /backup/import
 * * @param backupData Objeto contendo o snapshot estruturado com as tabelas e estatísticas
 */
export const importBackupData = async (backupData: BackupSnapshotResponse): Promise<ImportBackupResponse> => {
  const { data } = await api.post<ImportBackupResponse>("/backup/import", backupData);
  return data;
};