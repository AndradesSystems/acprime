"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
  Loader2,
  Eye,
  ImageIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  getClients,
  deleteClient,
  type Client,
} from "@/services/clients";

import ClientSheet from "@/components/NewClientSheet";
import ClientContractsModal from "@/components/ClientesContractsModal";
import { api } from "@/services/api";
import { authService } from "@/lib/auth";

// --- FUNÇÕES DE MÁSCARA (HELPERS) ---
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
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contractsOpen, setContractsOpen] = useState(false);
  const [contractsClientId, setContractsClientId] = useState<string | null>(null);
  const [contractsClientName, setContractsClientName] = useState<string | undefined>();

  // 🟢 Estados para controle da galeria de fotos do cliente
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedClientPhotos, setSelectedClientPhotos] = useState<string[]>([]);
  const [selectedClientName, setSelectedClientName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch {
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
    setIsAdmin(authService.isAdmin());
  }, []);

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      setLoading(true);
      await deleteClient(clientToDelete.id);
      toast({
        title: "Cliente removido",
        description: `${clientToDelete.nome} foi excluído com sucesso.`,
      });
      loadClients();
    } catch (error) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível remover o cliente selecionado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setClientToDelete(null);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      toast({ title: "Preparando backup...", description: "Isso pode levar alguns segundos." });
      const response = await api.get("/admin/backup/download", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const dataFormatada = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      link.setAttribute("download", `backup-jurista-${dataFormatada}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Backup concluído!", description: "Arquivo JSON salvo com sucesso." });
    } catch {
      toast({ title: "Erro no download", description: "Não foi possível gerar o backup.", variant: "destructive" });
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const json = JSON.parse(e.target?.result as string);
        await api.post("/admin/backup/restore", json);
        toast({ title: "Importação concluída!", description: "Os dados foram restaurados." });
        loadClients();
      } catch {
        toast({ title: "Erro na importação", description: "O arquivo pode estar corrompido.", variant: "destructive" });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
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

  // Função utilitária para abrir a visualização de fotos de forma controlada
  const handleOpenGallery = (client: Client) => {
    setSelectedClientPhotos(client.images ?? []);
    setSelectedClientName(client.nome);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen p-6 text-white bg-[#0a0e17]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER RESPONSIVO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-premium">Clientes</h1>
            <p className="text-sm text-muted-foreground">Cadastro e gestão da sua base de clientes</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {isAdmin && (
              <>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportBackup}
                />
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-orange-500/20 hover:text-orange-400 gap-2 flex-1 sm:flex-none justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <UploadCloud className="w-4 h-4" /> <span className="text-sm">Importar</span>
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-green-500/20 hover:text-green-400 gap-2 flex-1 sm:flex-none justify-center"
                  onClick={handleDownloadBackup}
                  disabled={loading}
                >
                  <DownloadCloud className="w-4 h-4" /> <span className="text-sm">Backup</span>
                </Button>
              </>
            )}

            <div className="w-full sm:w-auto [&>button]:w-full">
              <ClientSheet
                client={editingClient ?? undefined}
                onClose={() => setEditingClient(null)}
                onSuccess={(client) => {
                  setClients((prev) =>
                    prev.some((c) => c.id === client.id)
                      ? prev.map((c) => (c.id === client.id ? client : c))
                      : [client, ...prev]
                  );
                  setEditingClient(null);
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD CONTAINER PRINCIPAL */}
        <Card className="p-4 md:p-6 bg-card/50 border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" /> Listagem Geral
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por Nome, CPF ou Tel..."
                  className="pl-10 bg-white/5 border-white/10 w-full md:w-[300px] text-white focus:ring-blue-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/5 border-white/10 hover:bg-white/10"
                onClick={loadClients}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* VIEW DESKTOP: TABELA PADRÃO */}
          <div className="hidden md:block rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <Trash2 className="w-0 h-0 hidden" /> {/* Dummy para manter integridade estrutural das colunas */}
                  <TableHead className="text-gray-400">Nome / E-mail</TableHead>
                  <TableHead className="text-gray-400">CPF</TableHead>
                  <TableHead className="text-gray-400">Telefone</TableHead>
                  <TableHead className="text-gray-400">Nascimento</TableHead>
                  <TableHead className="text-right text-gray-400">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : currentClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <NoneClientsFound />
                    </TableCell>
                  </TableRow>
                ) : (
                  currentClients.map((client) => (
                    <TableRow key={client.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white italic">{client.nome}</span>
                          {client.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {client.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-gray-300">
                        {formatCPF(client.cpf)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-blue-400" />
                          {formatTelefone(client.telefone)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          {client.dataNascimento
                            ? new Date(client.dataNascimento).toLocaleDateString("pt-BR")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          client={client}
                          setEditingClient={setEditingClient}
                          setContractsClientId={setContractsClientId}
                          setContractsClientName={setContractsClientName}
                          setContractsOpen={setContractsOpen}
                          setClientToDelete={setClientToDelete}
                          onOpenGallery={handleOpenGallery}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* VIEW MOBILE: LISTA DE CARDS */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : currentClients.length === 0 ? (
              <NoneClientsFound />
            ) : (
              currentClients.map((client) => (
                <div key={client.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold italic">{client.nome}</h3>
                      {client.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {client.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm border-y border-white/5 py-2 font-mono">
                    <div>
                      <p className="text-gray-400 text-[10px] font-sans">CPF</p>
                      <p className="text-gray-200">{formatCPF(client.cpf)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-sans">TELEFONE</p>
                      <p className="text-gray-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-400" /> {formatTelefone(client.telefone)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      {client.dataNascimento
                        ? new Date(client.dataNascimento).toLocaleDateString("pt-BR")
                        : "-"}
                    </div>
                    <ActionButtons
                      client={client}
                      setEditingClient={setEditingClient}
                      setContractsClientId={setContractsClientId}
                      setContractsClientName={setContractsClientName}
                      setContractsOpen={setContractsOpen}
                      setClientToDelete={setClientToDelete}
                      onOpenGallery={handleOpenGallery}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINAÇÃO RESPONSIVA */}
          {!loading && filteredClients.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 px-2">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Mostrando <span className="text-white font-medium">{startIndex + 1}</span>-
                <span className="text-white font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredClients.length)}
                </span> de <span className="text-white font-medium">{filteredClients.length}</span>
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white disabled:opacity-30 flex-1 sm:flex-none"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Anterior</span>
                </Button>

                <span className="text-xs text-white/70 px-2">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white disabled:opacity-30 flex-1 sm:flex-none"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Próximo</span> <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <ClientContractsModal
        open={contractsOpen}
        clientId={contractsClientId}
        clientName={contractsClientName}
        onClose={() => setContractsOpen(false)}
      />

      {/* 🟢 MODAL DE VISUALIZAÇÃO DAS FOTOS E DOCUMENTOS */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-850 text-white max-w-3xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-3">
              <ImageIcon className="w-5 h-5 text-gold" /> Documentos de {selectedClientName}
            </DialogTitle>
          </DialogHeader>

          {selectedClientPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <ImageIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm">Nenhuma foto ou documento anexado a este cliente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {selectedClientPhotos.map((url, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg border border-white/10 overflow-hidden bg-zinc-900 cursor-pointer hover:border-gold transition-all shadow-md"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  title="Clique para abrir em tamanho real"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Documento ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs bg-zinc-950/80 px-2 py-1 rounded text-white font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ampliar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DO DELETE */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente{" "}
              <span className="text-red-400 font-semibold">{clientToDelete?.nome}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* COMPONENTE AUXILIAR INTERNO PARA MENSAGEM DE ERRO/LIMPO */
const NoneClientsFound = () => (
  <p className="text-center py-10 text-muted-foreground">Nenhum cliente encontrado.</p>
);

/* COMPONENTE AUXILIAR REUTILIZÁVEL PARA AS AÇÕES */
const ActionButtons = ({
  client,
  setEditingClient,
  setContractsClientId,
  setContractsClientName,
  setContractsOpen,
  setClientToDelete,
  onOpenGallery
}: any) => {
  const totalPhotos = client.images?.length ?? 0;

  return (
    <div className="flex items-center justify-end gap-1">
      {/* 🟢 BOTÃO DE VISUALIZAR FOTOS */}
      <Button
        size="icon"
        variant="ghost"
        className="text-emerald-400 hover:bg-emerald-400/10 h-8 w-8 relative group"
        onClick={() => onOpenGallery(client)}
        title="Visualizar documentos anexados"
      >
        <Eye className="w-4 h-4" />
        {totalPhotos > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-zinc-950 text-[9px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full animate-fade-in border border-zinc-950">
            {totalPhotos}
          </span>
        )}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="text-blue-400 hover:bg-blue-400/10 h-8 w-8"
        onClick={() => setEditingClient(client)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-gold hover:bg-yellow-400/10 h-8 w-8"
        onClick={() => {
          setContractsClientId(client.id);
          setContractsClientName(client.nome);
          setContractsOpen(true);
        }}
      >
        <FileText className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-red-500 hover:bg-red-500/10 h-8 w-8"
        onClick={() => setClientToDelete(client)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Clients;