import axios from 'axios';

// Configurações vindas das variáveis de ambiente da SUA API principal
const EVOLUTION_API_URL = 'https://evolution-api-v2-1-1-pidk.onrender.com';
const GLOBAL_API_KEY = 'F2A1G5JH41F54HGASDF1ASD'; // A chave mestra que configuramos no Render

export class WhatsAppService {
  
  /**
   * 1. CRIA A INSTÂNCIA DO USUÁRIO
   * Rodado quando o usuário clica em "Conectar WhatsApp" no seu front-end.
   */
  static async createInstance(userId: string | number): Promise<void> {
    const instanceName = `user_${userId}`;

    try {
      await axios.post(
        `${EVOLUTION_API_URL}/instance/create`,
        {
          instanceName: instanceName,
          token: `token_${userId}`, // Token opcional de segurança específico desta instância
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        },
        {
          headers: {
            'apikey': GLOBAL_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      // Se a instância já existir, a Evolution API retorna erro 400. 
      // Tratamos aqui para ignorar esse erro específico, pois significa que ela já está pronta.
      if (error.response?.status !== 400) {
        console.error(`Erro ao criar instância para o usuário ${userId}:`, error.response?.data || error.message);
        throw new Error('Falha ao inicializar conexão com o WhatsApp.');
      }
    }
  }

  /**
   * 2. PEGA O QR CODE EM BASE64
   * Retorna a string pronta que o seu front-end precisa para renderizar a imagem na tela.
   */
  static async getQrCode(userId: string | number): Promise<string> {
    const instanceName = `user_${userId}`;

    try {
      // Garante que a instância exista antes de tentar pegar o QR Code
      await this.createInstance(userId);

      const response = await axios.get(
        `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        {
          headers: {
            'apikey': GLOBAL_API_KEY
          }
        }
      );

      // A Evolution API retorna o Base64 dentro de response.data.base64
      if (response.data && response.data.base64) {
        return response.data.base64;
      }

      throw new Error('QR Code não gerado pela API.');
    } catch (error: any) {
      console.error(`Erro ao buscar QR Code para o usuário ${userId}:`, error.response?.data || error.message);
      throw new Error('Não foi possível gerar o código de conexão.');
    }
  }

  /**
   * 3. DISPARA UMA MENSAGEM DE TEXTO
   * Envia a mensagem usando estritamente o WhatsApp conectado daquele usuário.
   */
  static async sendMessage(userId: string | number, toNumber: string, messageText: string): Promise<any> {
    const instanceName = `user_${userId}`;

    // Limpa o número para garantir o padrão internacional (Remove espaços, traços, etc.)
    const cleanNumber = toNumber.replace(/\D/g, '');

    try {
      const response = await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
        {
          number: cleanNumber,
          text: messageText,
          delay: 1200, // Delay amigável de 1.2 segundos para simular comportamento humano e evitar ban
          linkPreview: true
        },
        {
          headers: {
            'apikey': GLOBAL_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao enviar mensagem do usuário ${userId} para ${toNumber}:`, error.response?.data || error.message);
      throw new Error('Falha ao enviar a mensagem via WhatsApp. Verifique se o aparelho está conectado.');
    }
  }
}