import { api } from "./api";

// ==========================================================================
// TYPES
// ==========================================================================

export type WhatsAppQrCodeResponse = {
  success: boolean;
  qrcode: string; // String em Base64 pronta para a tag <img src="data:image/png;base64,..." />
};

export type WhatsAppSendResponse = {
  success: boolean;
  message: string;
  data: any; // Retorno bruto da Evolution API com os detalhes do envio
};

export type SendMessageParams = {
  phone: string;     // Número do cliente (Ex: "5511999999999")
  message: string;   // Texto que será enviado
};

// ==========================================================================
// FUNCTIONS
// ==========================================================================

/**
 * 1. Busca ou gera o QR Code da instância do usuário logado
 * GET /whatsapp/qrcode
 */
export const getWhatsAppQrCode = async (): Promise<WhatsAppQrCodeResponse> => {
  const { data } = await api.get<WhatsAppQrCodeResponse>("/whatsapp/qrcode");
  return data;
};

/**
 * 2. Dispara uma mensagem de texto usando o WhatsApp do usuário logado
 * POST /whatsapp/send
 */
export const sendWhatsAppMessage = async (
  payload: SendMessageParams
): Promise<WhatsAppSendResponse> => {
  const { data } = await api.post<WhatsAppSendResponse>("/whatsapp/send", payload);
  return data;
};