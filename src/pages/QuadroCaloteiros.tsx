"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Phone,
  Mail,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Eye,
  ImageIcon,
  DollarSign,
  User,
  Percent,
  Clock,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  getCaloteiros,
  type Client,
} from "@/services/clients";

import ClientContractsModal from "@/components/ClientesContractsModal";

// --- HELPERS DE FORMATAÇÃO ---
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .substring(0, 14);
};

const formatTelefone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2").substring(0, 14);
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").substring(0, 15);
};

const formatCurrency = (value: number | string) => {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const translatePeriodicity = (periodicity: string) => {
  const types: Record<string, string> = {
    DAILY: "Diário",
    WEEKLY: "Semanal",
    MONTHLY: "Mensal",
  };
  return types[periodicity] || periodicity;
};

export default function QuadroCaloteiros() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Mapa de controle para alternar a visualização individual de cada Card (Cadastro <-> Débitos)
  const [showDebtsMap, setShowDebtsMap] = useState<Record<string, boolean>>({});

  // Estados para o modal de histórico de contratos
  const [contractsOpen, setContractsOpen] = useState(false);
  const [contractsClientId, setContractsClientId] = useState<string | null>(null);
  const [contractsClientName, setContractsClientName] = useState<string | undefined>();

  // Estados para a galeria de imagens/provas anexadas
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedClientPhotos, setSelectedClientPhotos] = useState<string[]>([]);
  const [selectedClientName, setSelectedClientName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Grid 3x2 ideal para visualização de cartões

  const loadCaloteiros = async () => {
    try {
      setLoading(true);
      const data = await getCaloteiros();
      setClients(data);
    } catch {
      toast({ title: "Erro ao carregar quadro de caloteiros", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaloteiros();
  }, []);

  const toggleCardView = (clientId: string) => {
    setShowDebtsMap((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/\D/g, "");

    if (/^\d+$/.test(cleanValue)) {
      if (cleanValue.length > 11) {
        setSearchTerm(formatTelefone(value));
      } else if (cleanValue.length > 9) {
        setSearchTerm(formatCPF(value));
      } else {
        setSearchTerm(value);
      }
    } else {
      setSearchTerm(value);
    }
  };

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/\D/g, "");

    if (!term) return clients;

    return clients.filter((client) => {
      const nomeMatch = client.nome.toLowerCase().includes(term);
      const emailMatch = client.email?.toLowerCase().includes(term) ?? false;
      const cleanCPF = client.cpf.replace(/\D/g, "");
      const cleanPhone = client.telefone.replace(/\D/g, "");

      const cpfMatch = cleanCPF.includes(cleanTerm || term);
      const phoneMatch = cleanPhone.includes(cleanTerm || term);

      return nomeMatch || emailMatch || cpfMatch || phoneMatch;
    });
  }, [clients, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenGallery = (client: Client) => {
    setSelectedClientPhotos(client.images ?? []);
    setSelectedClientName(client.nome);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen p-6 text-white bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER DA NOVA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-red-500 font-premium flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 animate-pulse text-red-500" /> Quadro de Inadimplentes
            </h1>
            <p className="text-sm text-muted-foreground">Lista de inadimplentes do sistema com valores em aberto</p>
          </div>
        </div>

        {/* CONTAINER DO FILTRO DE BUSCA */}
        <Card className="p-4 md:p-6 bg-card/50 border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-red-400/90 flex items-center gap-2">
              <Search className="w-5 h-5 text-red-500" /> Localizar Devedores Ativos
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por Nome, CPF..."
                  className="pl-10 bg-white/5 border-white/10 w-full md:w-[300px] text-white focus:ring-red-500 focus-visible:ring-red-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/5 border-white/10 hover:bg-white/10"
                onClick={loadCaloteiros}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* GRID RESPONSIVO DE CARDS */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-red-500 w-8 h-8" />
            </div>
          ) : currentClients.length === 0 ? (
            <p className="text-center py-20 text-muted-foreground">Nenhum devedor encontrado no quadro.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentClients.map((client) => {
                const viewDebts = !!showDebtsMap[client.id];
                
                // Calcula o montante acumulado dinamicamente no front-end
                const totalDivida = client.contracts?.reduce(
                  (acc, contract) => acc + Number(contract.valorEmAberto || 0), 0
                ) || 0;

                const totalPhotos = client.images?.length ?? 0;

                return (
                  <Card 
                    key={client.id} 
                    className="bg-zinc-900/90 border-zinc-850 hover:border-red-500/30 transition-all duration-350 flex flex-col justify-between overflow-hidden group shadow-lg"
                  >
                    {/* CONTEÚDO ROTATIVO DO CARD */}
                    <div className="p-5 space-y-4">
                      
                      {!viewDebts ? (
                        /* VISUALIZAÇÃO 1: PERFIL DO INADIMPLENTE */
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800 flex items-center justify-center relative shrink-0">
                              {client.images && client.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={client.images[0]} 
                                  alt={client.nome} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-zinc-600" />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <h3 className="text-white font-bold text-lg truncate italic group-hover:text-red-400 transition-colors">
                                {client.nome}
                              </h3>
                              <p className="text-xs font-mono text-zinc-400 mt-0.5">{formatCPF(client.cpf)}</p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-zinc-800/60 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                              <span>{formatTelefone(client.telefone)}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-2 truncate">
                                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                              <span>
                                Nasc: {client.dataNascimento 
                                  ? new Date(client.dataNascimento).toLocaleDateString("pt-BR") 
                                  : "Não informado"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* VISUALIZAÇÃO 2: VALORES EM DÉBITO E DETALHES TÉCNICOS */
                        <div className="space-y-3 animate-fade-in max-h-[190px] overflow-y-auto pr-1">
                          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-3 text-center">
                            <p className="text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">Total em Débito</p>
                            <p className="text-2xl font-bold text-red-500 font-mono mt-0.5">
                              {formatCurrency(totalDivida)}
                            </p>
                          </div>

                          {/* REPETIDOR DE CONTRATOS COBRADOS */}
                          <div className="space-y-2">
                            {client.contracts && client.contracts.length > 0 ? (
                              client.contracts.map((contract: any) => (
                                <div key={contract.id} className="bg-zinc-950/60 border border-zinc-800 p-2.5 rounded text-xs space-y-1">
                                  <div className="flex justify-between font-medium">
                                    <span className="text-zinc-500 flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-zinc-500" /> Contrato
                                    </span>
                                    <span className="text-red-400 font-mono font-semibold">
                                      {formatCurrency(contract.valorEmAberto)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-500 pt-1 border-t border-zinc-900">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-zinc-400" /> {translatePeriodicity(contract.periodicity)}
                                    </span>
                                    <span className="flex items-center gap-1 justify-end">
                                      <Percent className="w-2.5 h-2.5 text-zinc-400" /> Juros: {Number(contract.jurosPercent)}%
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-600 font-mono text-right">
                                    Venc: {new Date(contract.vencimentoEm).toLocaleDateString("pt-BR")}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-zinc-500 text-center py-2">Sem contratos de calote.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTÕES DE INTERAÇÃO DO CARD */}
                    <div className="bg-zinc-950/40 p-4 border-t border-zinc-850 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleCardView(client.id)}
                        className={`text-xs gap-1.5 font-medium flex-1 transition-all ${
                          viewDebts 
                            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200" 
                            : "bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400"
                        }`}
                      >
                        {viewDebts ? (
                          <>
                            <User className="w-3.5 h-3.5" /> Ver Cadastro
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3.5 h-3.5" /> Ver Débitos ({client.contracts?.length || 0})
                          </>
                        )}
                      </Button>

                      <div className="flex gap-1">
                        {/* Ação: Provas/Anexos */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-emerald-400 hover:bg-emerald-400/10 h-8 w-8 relative group"
                          onClick={() => handleOpenGallery(client)}
                          title="Visualizar documentos anexados"
                        >
                          <Eye className="w-4 h-4" />
                          {totalPhotos > 0 && (
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-zinc-950 text-[9px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full border border-zinc-950">
                              {totalPhotos}
                            </span>
                          )}
                        </Button>

                        {/* Ação: Abrir Janela Geral de Contratos */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-yellow-500 hover:bg-yellow-400/10 h-8 w-8"
                          onClick={() => {
                            setContractsClientId(client.id);
                            setContractsClientName(client.nome);
                            setContractsOpen(true);
                          }}
                          title="Gerenciar Contratos"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* CONTROLE DE PAGINAÇÃO DA PÁGINA */}
          {!loading && filteredClients.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 px-2">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Mostrando <span className="text-white font-medium">{startIndex + 1}</span>-
                <span className="text-white font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredClients.length)}
                </span> de <span className="text-white font-medium">{filteredClients.length}</span> devedores
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white disabled:opacity-30 flex-1 sm:flex-none"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Anterior</span>
                </Button>

                <span className="text-xs text-white/70 px-2 font-mono">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white disabled:opacity-30 flex-1 sm:flex-none"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Próximo</span> <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* MODAL EXTERNO: GERENCIADOR COMPLETO DE CONTRATOS DO CLIENTE */}
      <ClientContractsModal
        open={contractsOpen}
        clientId={contractsClientId}
        clientName={contractsClientName}
        onClose={() => setContractsOpen(false)}
      />

      {/* DIALOG DE VISUALIZAÇÃO DE COMPROVANTES/DOCUMENTOS */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-850 text-white max-w-3xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-3">
              <ImageIcon className="w-5 h-5 text-red-500" /> Documentação e Mídias de {selectedClientName}
            </DialogTitle>
          </DialogHeader>

          {selectedClientPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <ImageIcon className="w-12 h-12 opacity-10" />
              <p className="text-sm">Nenhum documento anexado a este devedor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {selectedClientPhotos.map((url, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg border border-white/10 overflow-hidden bg-zinc-900 cursor-pointer hover:border-red-500 transition-all shadow-md"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  title="Clique para expandir mídia"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Anexo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs bg-zinc-950/80 px-2 py-1 rounded text-white font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Abrir Original
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}