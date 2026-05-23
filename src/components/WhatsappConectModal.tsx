import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  QrCode,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  X,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { connectWhatsApp, disconnectWhatsApp, getWhatsAppStatus } from "@/services/whapp";

type Props = {
  open: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
};

export default function WhatsAppConnectModal({
  open,
  onClose,
  onConnectionSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false); // 🟢 Estado de loading para a desconexão

  /**
   * 🟢 GATILHO INICIAL: Só acorda o motor se o usuário NÃO estiver conectado ainda
   */
  useEffect(() => {
    if (open) {
      const verificarEInicializar = async () => {
        try {
          setIsInitializing(true);
          // Faz uma checagem rápida antes de forçar o ligamento do motor
          const checaStatus = await getWhatsAppStatus();

          if (checaStatus.data?.status !== 'OPEN') {
            await connectWhatsApp();
          }
          queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
        } catch (err) {
          toast.error("Erro ao verificar canais de conexão do WhatsApp.");
        } finally {
          setIsInitializing(false);
        }
      };
      verificarEInicializar();
    }
  }, [open, queryClient]);

  /**
   * 🔄 QUERY DE STATUS: Polling constante (4s)
   */
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: () => getWhatsAppStatus(),
    enabled: open && !showSuccessState && !isInitializing && !isDisconnecting,
    refetchInterval: open && !showSuccessState && !isDisconnecting ? 4000 : false,
    retry: 1,
    staleTime: 0,
    gcTime: 0,
  });

  const statusAtual = data?.data?.status;
  const stringDoQrCode = data?.data?.qrCode;

  // Monitor de sucesso para o primeiro pareamento
  useEffect(() => {
    if (statusAtual === 'OPEN' && !showSuccessState && !isInitializing) {
      // Usamos uma variável no localStorage ou state para só disparar a animação de "Sucesso!" se ele acabou de ler o QR Code
      // Se ele já abriu o modal estando conectado, não mostra o feedback de "Concluído" direto.
    }
  }, [statusAtual, showSuccessState, isInitializing]);

  /**
   * 🔴 FUNÇÃO DE DESCONEXÃO E DESATIVAÇÃO
   */
  const handleDisconnect = async () => {
    if (!window.confirm("Tem certeza que deseja desativar as automações e desconectar este número de WhatsApp?")) {
      return;
    }

    try {
      setIsDisconnecting(true);
      await disconnectWhatsApp();
      queryClient.setQueryData(["whatsapp-status"], null); // Limpa o cache imediatamente
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });

      toast.success("WhatsApp desativado e desconectado com sucesso!");
      handleClose();
    } catch (error) {
      toast.error("Falha ao desativar a instância do WhatsApp.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleForceRefresh = async () => {
    queryClient.resetQueries({ queryKey: ["whatsapp-status"] });
    try {
      await connectWhatsApp();
      refetch();
      toast.info("Re-enviando comando de inicialização...");
    } catch {
      toast.error("Não foi possível reiniciar o motor.");
    }
  };

  const handleClose = () => {
    setShowSuccessState(false);
    queryClient.removeQueries({ queryKey: ["whatsapp-status"] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="max-w-4xl h-[100dvh] sm:h-[80vh] bg-[#071e30] border-white/10 text-white p-0 overflow-hidden flex flex-col [&>button]:hidden">

        {/* CABEÇALHO */}
        <DialogHeader className="shrink-0 p-4 md:p-6 border-b border-white/10 bg-white/5 flex flex-row justify-between items-center space-y-0 z-20">
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-lg md:text-xl flex items-center gap-2 text-white font-bold">
              <QrCode className="text-blue-400 w-5 h-5 md:w-6 md:h-6" />
              Instância do WhatsApp
            </DialogTitle>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs md:text-sm text-gray-400 truncate italic">
                Gerenciamento de conexão para disparos e cobranças
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full h-9 w-9 md:h-10 md:w-10"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </DialogHeader>

        {/* 🟢 CASO JÁ ESTEJA CONECTADO: EXIBE TELA DE GERENCIAMENTO COM BOTÃO DE DESATIVAR */}
        {statusAtual === 'OPEN' && !isDisconnecting && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#020617]/50 text-center animate-fadeIn">
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-full mb-4 text-green-400">
              <ShieldCheck className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Integração Ativa e Operando</h3>
            <p className="text-sm text-gray-400 max-w-md mb-8">
              Este número de WhatsApp está pareado com o sistema e pronto para disparar as mensagens automáticas de vencimento dos contratos.
            </p>

            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-400">Status do Motor:</span>
                <Badge className="bg-green-600 text-white font-bold">ONLINE</Badge>
              </div>
              <Separator className="bg-white/10 my-4" />

              {/* 🔴 O BOTÃO PEDIDO BEM CLARO E DESTACADO */}
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 font-bold gap-2 text-white py-5 shadow-lg shadow-red-900/20 active:scale-[0.98] transition-transform"
              >
                <LogOut className="w-4 h-4" />
                Desativar Funcionalidade WhatsApp
              </Button>
              <p className="text-[11px] text-gray-500 mt-2 italic text-center">
                Isso interromperá imediatamente os envios automatizados deste usuário.
              </p>
            </div>
          </div>
        )}

        {/* CASO NÃO ESTEJA CONECTADO: EXIBE FLUXO NORMAL (INSTRUÇÕES + QR CODE) */}
        {statusAtual !== 'OPEN' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

            {/* LADO ESQUERDO: INSTRUÇÕES */}
            <div className="flex-1 flex flex-col justify-center p-6 md:p-10 bg-black/10">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gray-400" />
                Instruções de pareamento
              </h3>

              <ol className="space-y-4 text-sm md:text-base text-gray-300 list-none">
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center bg-white/5 border border-white/10 rounded-full w-6 h-6 shrink-0 text-xs font-mono font-bold text-blue-400">1</span>
                  <span>Abra o <strong>WhatsApp</strong> no seu celular.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center bg-white/5 border border-white/10 rounded-full w-6 h-6 shrink-0 text-xs font-mono font-bold text-blue-400">2</span>
                  <span>Vá em <strong>Dispositivos conectados</strong> e toque em <strong>Conectar um dispositivo</strong>.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center bg-white/5 border border-white/10 rounded-full w-6 h-6 shrink-0 text-xs font-mono font-bold text-blue-400">3</span>
                  <span>Aponte a câmera para o código QR ao lado.</span>
                </li>
              </ol>
            </div>

            {/* LADO DIREITO: EXIBIÇÃO DINÂMICA DO QR CODE / LOADINGS */}
            <div className="shrink-0 w-full md:w-[380px] bg-[#020617] border-t md:border-t-0 md:border-l border-white/10 flex flex-col items-center justify-center p-6 relative">

              {/* LOADING GERAL OU DISCONNECTING */}
              {(isLoading || isInitializing || isDisconnecting || statusAtual === 'CONNECTING') && !isError && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-sm font-medium text-gray-200">
                    {isDisconnecting ? "Desativando canal..." : "Iniciando canais seguros..."}
                  </p>
                </div>
              )}

              {/* RETORNO DE ERRO */}
              {isError && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-sm font-bold text-white">Falha na Comunicação</p>
                  <Button onClick={handleForceRefresh} variant="outline" className="mt-4 border-white/10 bg-white/5 text-white">
                    <RefreshCw className="w-4 h-4 mr-2" /> Forçar Reinício
                  </Button>
                </div>
              )}

              {/* RENDERIZAÇÃO DO QR CODE */}
              {!isLoading && !isInitializing && !isError && !isDisconnecting && statusAtual === 'QRCODE' && stringDoQrCode && (
                <div className="flex flex-col items-center justify-center w-full animate-fadeIn">
                  <div className="relative bg-white p-4 rounded-xl shadow-2xl">
                    <div className={cn("transition-opacity", isFetching ? "opacity-30" : "opacity-100")}>
                      <QRCodeSVG value={stringDoQrCode} size={220} level="M" />
                    </div>
                    {isFetching && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 text-center w-full">
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white" onClick={handleForceRefresh} disabled={isFetching}>
                      <RefreshCw className={cn("w-3 h-3 mr-2", isFetching && "animate-spin")} /> Resetar Conexão
                    </Button>
                  </div>
                </div>
              )}

              {/* AGUARDANDO QR CODE DA REDE */}
              {!isLoading && !isInitializing && !isError && !isDisconnecting && statusAtual === 'CLOSED' && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-3" />
                  <p className="text-sm font-medium text-gray-300">Aguardando geração do código...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}