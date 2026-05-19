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
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getWhatsAppQrCode } from "@/services/whapp";

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

  // Query para buscar o QR Code com Polling e Trava de Segurança
  // Query para buscar o QR Code com Polling e Trava de Segurança
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["whatsapp-qrcode"],
    queryFn: () => getWhatsAppQrCode(),
    // Só executa se o modal estiver aberto E se não estiver em tela de sucesso
    enabled: open && !showSuccessState,

    // 🟢 CORREÇÃO AQUI: Passamos uma função que avalia o estado atual da query em tempo de execução
    refetchInterval: (query) => {
      const hasError = query.state.status === 'error';
      return open && !showSuccessState && !hasError ? 8000 : false;
    },

    // Configurações de resiliência controladas
    retry: 1,
    staleTime: 0,
    gcTime: 0,
  });

  // Monitora falhas e alerta o usuário uma única vez por ciclo
  useEffect(() => {
    if (isError && open) {
      toast.error("Falha ao gerar código de conexão com o WhatsApp.");
    }
  }, [isError, open]);

  const handleForceRefresh = () => {
    // Limpa o estado de erro antigo no client antes de tentar de novo
    queryClient.resetQueries({ queryKey: ["whatsapp-qrcode"] });
    refetch();
    toast.info("Tentando restabelecer conexão com a Evolution API...");
  };

  const handleClose = () => {
    setShowSuccessState(false);
    // 🟢 Limpa a query ao fechar para impedir que qualquer execução pendente rode solta em background
    queryClient.removeQueries({ queryKey: ["whatsapp-qrcode"] });
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
              Conectar Dispositivo
            </DialogTitle>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs md:text-sm text-gray-400 truncate italic">
                Vincule sua conta do WhatsApp para automações de cobrança
              </p>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 uppercase text-[9px] px-1.5 h-4 animate-pulse">
                Evolution v2
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full h-9 w-9 md:h-10 md:w-10 transition-all active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </DialogHeader>

        {/* CORPO DO MODAL */}
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
                <span>Abra o <strong>WhatsApp</strong> no seu aparelho celular.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center bg-white/5 border border-white/10 rounded-full w-6 h-6 shrink-0 text-xs font-mono font-bold text-blue-400">2</span>
                <span>Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong>.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center bg-white/5 border border-white/10 rounded-full w-6 h-6 shrink-0 text-xs font-mono font-bold text-blue-400">3</span>
                <span>Selecione <strong>Dispositivos conectados</strong> e depois <strong>Conectar um dispositivo</strong>.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center bg-white/5 border border-white/10 rounded-full w-6 h-6 shrink-0 text-xs font-mono font-bold text-blue-400">4</span>
                <span>Aponte a câmera do seu celular para o código QR ao lado.</span>
              </li>
            </ol>

            <Separator className="bg-white/10 my-6" />

            <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded border border-white/5">
              💡 <strong>Nota de estabilidade:</strong> Mantenha o seu celular conectado à internet para uma sincronização perfeita das instâncias.
            </p>
          </div>

          {/* LADO DIREITO: STATES */}
          <div className="shrink-0 w-full md:w-[380px] bg-[#020617] border-t md:border-t-0 md:border-l border-white/10 flex flex-col items-center justify-center p-6 relative">

            {/* ESTADO 1: LOADING */}
            {isLoading && !isError && (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-sm font-medium text-gray-200">Gerando instância segura...</p>
                <p className="text-xs text-gray-500 mt-1">Isso pode levar alguns segundos no Render</p>
              </div>
            )}

            {/* ESTADO 2: ERRO TRATADO COM ABORTO DE REQUISIÇÃO */}
            {isError && (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-sm font-bold text-white">Tentativas Interrompidas</p>
                <p className="text-xs text-gray-400 mt-1 mb-5 max-w-[240px]">
                  O servidor respondeu com um erro crítico. O disparo automático foi pausado para proteger sua API.
                </p>
                <Button
                  onClick={handleForceRefresh}
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
                </Button>
              </div>
            )}

            {/* ESTADO 3: EXIBIÇÃO SEGURA DO QR CODE */}
            {!isLoading && !isError && data?.qrcode && (
              <div className="flex flex-col items-center justify-center w-full animate-fadeIn">
                <div className="relative bg-white p-4 rounded-xl shadow-2xl border-4 border-white/5">
                  <img
                    src={`data:image/png;base64,${data.qrcode}`}
                    alt="WhatsApp QR Code"
                    className={cn(
                      "w-56 h-56 object-contain transition-opacity duration-300",
                      isFetching ? "opacity-40" : "opacity-100"
                    )}
                  />
                  {isFetching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-lg">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>

                <div className="mt-6 text-center w-full">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4 font-mono">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Código atualiza a cada 8 segundos
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white border border-white/5 hover:bg-white/5 w-full max-w-[200px]"
                    onClick={handleForceRefresh}
                    disabled={isFetching}
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-2", isFetching && "animate-spin")} />
                    Forçar Atualização
                  </Button>
                </div>
              </div>
            )}

            {/* ESTADO 4: SUCESSO */}
            {showSuccessState && (
              <div className="absolute inset-0 bg-[#020617] z-30 flex flex-col items-center justify-center text-center p-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h4 className="text-lg font-bold text-white">Dispositivo Conectado!</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                  O webhook e a sincronização do seu sistema já estão operando em segundo plano.
                </p>
                <Button onClick={handleClose} className="mt-6 bg-green-600 hover:bg-green-700 text-white w-full max-w-[160px]">
                  Concluir
                </Button>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}