"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  AlertTriangle,
  FileSpreadsheet,
  Handshake,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  getCaloteiros,
  type Client,
} from "@/services/clients";

import ClientContractsModal from "@/components/ClientesContractsModal";
import CreateNegotiationModal from "@/components/NegotiationModal";

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

  // Estado para gerenciar qual cliente está com o modal de débitos aberto
  const [selectedDebtsClient, setSelectedDebtsClient] = useState<Client | null>(null);

  // Estados para o modal de histórico de contratos
  const [contractsOpen, setContractsOpen] = useState(false);
  const [contractsClientId, setContractsClientId] = useState<string | null>(null);
  const [contractsClientName, setContractsClientName] = useState<string | undefined>();

  // ESTADOS CORRIGIDOS PARA O NOVO FORMATO DO MODAL DE NEGOCIAÇÃO
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [selectedContractForNegotiation, setSelectedContractForNegotiation] = useState<any | null>(null);

  // Estados para a galeria de imagens/provas anexadas
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedClientPhotos, setSelectedClientPhotos] = useState<string[]>([]);
  const [selectedClientName, setSelectedClientName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  // FUNÇÃO AUXILIAR PARA PASSAR O CONTRATO
  const handleOpenNegotiation = (contract: any) => {
    setSelectedContractForNegotiation(contract);
    setNegotiationOpen(true);
  };

  return (
    <div className="min-h-screen p-6 text-white bg-[#060913]">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-widest">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" /> Restrição Provedora de Risco
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Quadro de Inadimplentes
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Lista consolidada de quebras de contratos ativos e restrições financeiras internas.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Buscar por Nome, CPF..."
                className="pl-9 bg-zinc-900/40 border-white/10 text-white focus-visible:ring-zinc-700 h-10 rounded-xl backdrop-blur-sm focus:ring-rose-500 focus-visible:ring-rose-950"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="border-white/10 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all h-10 w-10 rounded-xl backdrop-blur-sm"
              onClick={loadCaloteiros}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* FEEDBACK DE CARREGAMENTO */}
        {loading ? (
          <div className="py-24 text-center text-zinc-400 flex flex-col items-center gap-3">
            <Loader2 className="w-9 h-9 animate-spin text-rose-500" />
            <p className="text-sm font-medium">Cruzando dados de fluxo de caixa e atrasos em aberto...</p>
          </div>
        ) : currentClients.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
            Nenhum devedor encontrado no quadro.
          </div>
        ) : (

          /* GRID RESPONSIVO DE CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentClients.map((client) => {
              const totalDivida = client.contracts?.reduce(
                (acc, contract) => acc + Number(contract.valorEmAberto || 0), 0
              ) || 0;

              const totalPhotos = client.images?.length ?? 0;

              return (
                <Card
                  key={client.id}
                  className="relative flex flex-col bg-gradient-to-br from-zinc-900/40 to-zinc-950/60 border border-white/5 hover:border-rose-500/30 transition-all duration-300 rounded-2xl overflow-hidden shadow-xl group hover:-translate-y-1 backdrop-blur-md hover:shadow-rose-500/5"
                >
                  <div className="h-[2px] w-full bg-rose-500 absolute top-0 left-0 opacity-30 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">

                    {/* VISUALIZAÇÃO COMPACTA DO PERFIL FIXO NO CARD */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl border border-white/5 overflow-hidden bg-zinc-800/50 flex items-center justify-center relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                            {client.images && client.images.length > 0 ? (
                              <img
                                src={client.images[0]}
                                alt={client.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white font-bold text-base truncate group-hover:text-zinc-200 transition-colors" title={client.nome}>
                              {client.nome}
                            </h3>
                            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{formatCPF(client.cpf)}</p>
                          </div>
                        </div>

                        <Badge variant="outline" className="px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase font-black shrink-0 border bg-rose-500/10 text-rose-400 border-rose-500/30">
                          Risco Crítico
                        </Badge>
                      </div>

                      {/* Exibição rápida do saldo devedor consolidado */}
                      <div className="bg-rose-500/[0.02] border border-rose-500/10 rounded-xl p-3 flex justify-between items-center">
                        <span className="text-[11px] text-zinc-400 font-medium">Débito Consolidado:</span>
                        <span className="text-base font-black font-mono text-rose-400">{formatCurrency(totalDivida)}</span>
                      </div>

                      {/* Informações estruturais de contato */}
                      <div className="space-y-1.5 text-xs text-zinc-400">
                        <div className="flex items-center gap-2 bg-zinc-950/40 p-2 rounded-xl border border-white/[0.02]">
                          <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="font-medium text-zinc-300">{formatTelefone(client.telefone)}</span>
                        </div>

                        {client.email && (
                          <div className="flex items-center gap-2 bg-zinc-950/40 p-2 rounded-xl border border-white/[0.02] truncate">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate text-zinc-300">{client.email}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 bg-zinc-950/40 p-2 rounded-xl border border-white/[0.02]">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-zinc-300">
                            Nascimento: {client.dataNascimento
                              ? new Date(client.dataNascimento).toLocaleDateString("pt-BR")
                              : "Não informado"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BLOCO DE AÇÕES REESTRUTURADO */}
                    <div className="pt-3 border-t border-white/[0.03] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {/* Ver Débitos */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedDebtsClient(client)}
                          className="text-xs gap-1.5 font-bold flex-1 h-9 rounded-xl transition-all bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-white/5"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-zinc-400" /> Ver Débitos ({client.contracts?.length || 0})
                        </Button>

                        <div className="flex gap-1.5 shrink-0">
                          {/* Ver Documentação Anexada */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 h-9 w-9 rounded-xl relative group transition-colors"
                            onClick={() => handleOpenGallery(client)}
                            title="Visualizar documentos anexados"
                          >
                            <Eye className="w-4 h-4" />
                            {totalPhotos > 0 && (
                              <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border-2 border-[#060913]">
                                {totalPhotos}
                              </span>
                            )}
                          </Button>

                          {/* Gerenciar Dossiê Geral */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 h-9 w-9 rounded-xl transition-colors"
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

                      {/* PASSANDO O PRIMEIRO CONTRATO VÁLIDO DIRETAMENTE DO LOOP */}
                      {/* <Button
                        size="sm"
                        onClick={() => {
                          if (client.contracts && client.contracts.length > 0) {
                            handleOpenNegotiation(client.contracts[0]);
                          } else {
                            toast({ title: "Este cliente não possui contratos para negociar.", variant: "destructive" });
                          }
                        }}
                        className="w-full text-xs gap-2 font-bold h-9 rounded-xl transition-all bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/10"
                      >
                        <Handshake className="w-4 h-4" /> Negociar Dívida
                      </Button> */}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CONTROLE DE PAGINAÇÃO */}
        {!loading && filteredClients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 px-2 pt-2 border-t border-white/5">
            <div className="text-xs text-zinc-500 order-2 sm:order-1 font-medium">
              Mostrando <span className="text-zinc-300 font-bold">{startIndex + 1}</span>-
              <span className="text-zinc-300 font-bold">
                {Math.min(startIndex + itemsPerPage, filteredClients.length)}
              </span> de <span className="text-zinc-300 font-bold">{filteredClients.length}</span> devedores em ficha.
            </div>

            <div className="flex items-center gap-4 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 flex-1 sm:flex-none rounded-xl h-9 px-3 font-medium transition-all"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>

              <span className="text-xs text-zinc-400 font-mono font-bold bg-zinc-950 border border-white/5 px-2.5 py-1 rounded-lg">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="border-white/5 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 flex-1 sm:flex-none rounded-xl h-9 px-3 font-medium transition-all"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DETALHAMENTO DE DÉBITOS DO DEVEDOR */}
      <Dialog open={selectedDebtsClient !== null} onOpenChange={(open) => !open && setSelectedDebtsClient(null)}>
        {selectedDebtsClient && (() => {
          const totalDivida = selectedDebtsClient.contracts?.reduce(
            (acc, contract) => acc + Number(contract.valorEmAberto || 0), 0
          ) || 0;

          return (
            <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-xl rounded-2xl p-6 backdrop-blur-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase border bg-rose-500/10 text-rose-400 border-rose-500/20">
                    Inadimplência Crítica
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">CPF: {formatCPF(selectedDebtsClient.cpf)}</span>
                </div>
                <DialogTitle className="text-2xl font-black text-white tracking-tight">
                  Débitos de {selectedDebtsClient.nome}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  Quebra analítica de valores vencidos e pendentes atrelados a este cadastro devedor.
                </DialogDescription>
              </DialogHeader>

              <hr className="border-white/5 my-3" />

              <div className="space-y-5">
                {/* Indicador Consolidado de Dívida */}
                <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Acumulado em Débito</span>
                    <div className="text-3xl font-black font-mono text-rose-500 mt-0.5">
                      {formatCurrency(totalDivida)}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Lista de Contratos em Aberto */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" /> Contratos Cobrados ({selectedDebtsClient.contracts?.length || 0})
                  </h4>

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {selectedDebtsClient.contracts && selectedDebtsClient.contracts.length > 0 ? (
                      selectedDebtsClient.contracts.map((contract: any) => (
                        <div key={contract.id} className="bg-zinc-900/30 border border-white/5 p-3 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="text-zinc-400 flex items-center gap-1.5 font-mono text-[11px]">
                              <FileText className="w-3.5 h-3.5 text-zinc-600" /> ID Contrato: ...{contract.id.slice(-6)}
                            </span>
                            <span className="text-rose-400 font-mono font-bold">
                              {formatCurrency(contract.valorEmAberto)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1.5 border-t border-white/[0.03]">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-zinc-500" /> Periodicidade: <span className="text-zinc-200">{translatePeriodicity(contract.periodicity)}</span>
                            </span>
                            <span className="flex items-center gap-1.5 justify-end">
                              <Percent className="w-3 h-3 text-zinc-500" /> Taxa Juros: <span className="text-zinc-200">{Number(contract.jurosPercent)}%</span>
                            </span>
                          </div>

                          <p className="text-[10px] text-zinc-500 text-right font-mono font-medium">
                            Vencimento original: {new Date(contract.vencimentoEm).toLocaleDateString("pt-BR")}
                          </p>

                          {/* SEGUNDO TRIGGER DE NEGOCIAÇÃO DENTRO DA ANÁLISE DE CADA CONTRATO DO MODAL */}
                          {/* <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDebtsClient(null);
                              handleOpenNegotiation(contract);
                            }}
                            className="w-full mt-2 bg-zinc-800 border border-white/5 hover:bg-rose-600 hover:text-white transition-colors rounded-xl text-[11px] font-bold h-7 gap-1"
                          >
                            <Handshake className="w-3 h-3" /> Negociar Este Contrato
                          </Button> */}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-6 border border-dashed border-white/5 rounded-xl">
                        Nenhum contrato marcado como calote ativo.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                {/* <Button
                  onClick={() => {
                    if (selectedDebtsClient.contracts && selectedDebtsClient.contracts.length > 0) {
                      const contractToNegotiate = selectedDebtsClient.contracts[0];
                      setSelectedDebtsClient(null);
                      handleOpenNegotiation(contractToNegotiate);
                    } else {
                      toast({ title: "Este cliente não possui contratos para negociar.", variant: "destructive" });
                    }
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-10 font-bold gap-2"
                >
                  <Handshake className="w-4 h-4" /> Iniciar Acordo Agora
                </Button> */}
                <Button
                  onClick={() => setSelectedDebtsClient(null)}
                  variant="outline"
                  className="w-full bg-transparent hover:bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white rounded-xl h-10 font-medium"
                >
                  Fechar Janela de Débito
                </Button>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* MODAL EXTERNO: GERENCIADOR COMPLETO DE CONTRATOS DO CLIENTE */}
      <ClientContractsModal
        open={contractsOpen}
        clientId={contractsClientId}
        clientName={contractsClientName}
        onClose={() => setContractsOpen(false)}
      />

      {/* MONTAGEM INLINE DO SEU MODAL DE ACORDO ATUALIZADO */}
      <CreateNegotiationModal
        open={negotiationOpen}
        onClose={() => setNegotiationOpen(false)}
        contract={selectedContractForNegotiation}
        onCreated={() => loadCaloteiros()}
      />

      {/* DIALOG DE VISUALIZAÇÃO DE COMPROVANTES/DOCUMENTOS */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="bg-zinc-950 border border-white/10 text-white max-w-2xl rounded-2xl p-6 backdrop-blur-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-white tracking-tight flex items-center gap-2 pb-2 border-b border-white/5">
              <ImageIcon className="w-5 h-5 text-rose-500" /> Documentação de Anexo
            </DialogTitle>
            <p className="text-zinc-400 text-xs">
              Mídias anexadas e provas vinculadas à inadimplência do devedor <span className="text-zinc-200 font-bold">{selectedClientName}</span>.
            </p>
          </DialogHeader>

          {selectedClientPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600 gap-2 border border-dashed border-white/5 rounded-xl mt-4">
              <ImageIcon className="w-10 h-10 opacity-20" />
              <p className="text-xs font-medium">Nenhuma evidência documental ou contrato escaneado anexado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {selectedClientPhotos.map((url, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-xl border border-white/5 overflow-hidden bg-zinc-900/40 cursor-pointer hover:border-rose-500 transition-all shadow-md"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  title="Clique para expandir mídia"
                >
                  <img
                    src={url}
                    alt={`Anexo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <span className="text-[11px] bg-zinc-950/90 border border-white/10 px-2.5 py-1 rounded-xl text-white font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3 text-zinc-300" /> Expandir Original
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={() => setGalleryOpen(false)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 rounded-xl"
            >
              Fechar Mídias
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}