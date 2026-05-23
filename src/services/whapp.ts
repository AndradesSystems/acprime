import { api } from "./api";

// ==========================================================================
// TYPES
// ==========================================================================

export type WhatsAppStatus = 'CONNECTING' | 'QRCODE' | 'OPEN' | 'CLOSED';

export type WhatsAppStatusResponse = {
  success: boolean;
  data: {
    userId: string;
    status: WhatsAppStatus; // 'CONNECTING', 'QRCODE', 'OPEN' ou 'CLOSED'
    qrCode: string | null;   // String de texto pura para jogar no componente de QR Code
    conectado: boolean;      // true se estiver ativo ('OPEN')
  };
};

export type WhatsAppConnectResponse = {
  success: boolean;
  message: string;
};

export type WhatsAppDisconnectResponse = {
  success: boolean;
  message: string;
};

export type WhatsAppSendResponse = {
  success: boolean;
  message: string;
  data: any; 
};

export type SendMessageParams = {
  phone: string;     // Número do cliente (Ex: "5511999999999")
  message: string;   // Texto que será enviado
};

// ==========================================================================
// FUNCTIONS
// ==========================================================================

/**
 * 1. Liga o motor do WhatsApp na memória do servidor
 * POST /whatsapp/connect
 */
export const connectWhatsApp = async (): Promise<WhatsAppConnectResponse> => {
  const { data } = await api.post<WhatsAppConnectResponse>("/whatsapp/connect");
  return data;
};

/**
 * 2. Monitora o status da conexão e captura a string do QR Code
 * GET /whatsapp/status
 */
export const getWhatsAppStatus = async (): Promise<WhatsAppStatusResponse> => {
  const { data } = await api.get<WhatsAppStatusResponse>("/whatsapp/status");
  return data;
};

/**
 * 3. Dispara uma mensagem de texto usando o WhatsApp do usuário logado
 * POST /whatsapp/send
 */
export const sendWhatsAppMessage = async (
  payload: SendMessageParams
): Promise<WhatsAppSendResponse> => {
  const { data } = await api.post<WhatsAppSendResponse>("/whatsapp/send", payload);
  return data;
};

/**
 * 🟢 NOVO: 4. Desconecta o WhatsApp e limpa a sessão do servidor/banco de dados
 * POST /whatsapp/disconnect
 */
export const disconnectWhatsApp = async (): Promise<WhatsAppDisconnectResponse> => {
  const { data } = await api.post<WhatsAppDisconnectResponse>("/whatsapp/disconnect");
  return data;
};