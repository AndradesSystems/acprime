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
import { authService } from "@/lib/auth"; // Importado para verificar permissão

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Estado para controle de Admin
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contractsOpen, setContractsOpen] = useState(false);
  const [contractsClientId, setContractsClientId] = useState<string | null>(null);
  const [contractsClientName, setContractsClientName] = useState<string | undefined>();

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
    setIsAdmin(authService.isAdmin()); // Verifica se é admin ao montar o componente
  }, []);

  // --- FUNÇÃO PARA DOWNLOAD DO BACKUP ---
  const handleDownloadBackup = async () => {
    try {
      toast({ title: "Preparando backup...", description: "Isso pode levar alguns segundos." });
      
      const response = await api.get("/admin/backup/download", {
        responseType: "blob",
      });

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
    } catch (error) {
      toast({ title: "Erro no download", description: "Não foi possível gerar o backup.", variant: "destructive" });
    }
  };

  // --- FUNÇÃO PARA IMPORTAR O BACKUP ---
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
      } catch (error) {
        toast({ 
          title: "Erro na importação", 
          description: "O arquivo pode estar corrompido ou é inválido.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;

    return clients.filter((client) =>
      [client.nome, client.cpf, client.email, client.telefone]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [clients, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-premium">Clientes</h1>
            <p className="text-muted-foreground">
              Cadastro e gestão da sua base de clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* RENDERIZAÇÃO CONDICIONAL PARA ADMIN */}
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
                  className="bg-white/5 border-white/10 hover:bg-orange-500/20 hover:text-orange-400 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <UploadCloud className="w-4 h-4" />
                  Importar
                </Button>

                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-green-500/20 hover:text-green-400 gap-2"
                  onClick={handleDownloadBackup}
                  disabled={loading}
                >
                  <DownloadCloud className="w-4 h-4" />
                  Backup
                </Button>
              </>
            )}

            <ClientSheet
              onSuccess={(client) =>
                setClients((prev) =>
                  prev.some((c) => c.id === client.id)
                    ? prev.map((c) => (c.id === client.id ? client : c))
                    : [client, ...prev]
                )
              }
            />
          </div>
        </div>

        {/* TABELA */}
        <Card className="p-6 bg-card/50 border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
               <Search className="w-5 h-5 text-blue-400" /> Listagem Geral
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  className="pl-10 bg-white/5 border-white/10 w-full md:w-[300px] text-white focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className="rounded-md border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
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
                      Processando dados...
                    </TableCell>
                  </TableRow>
                ) : currentClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      Nenhum cliente encontrado.
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
                      <TableCell className="font-mono text-gray-300">{client.cpf}</TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-blue-400" />
                          {client.telefone}
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
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-blue-400 hover:bg-blue-400/10"
                            onClick={() => setEditingClient(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-gold hover:bg-yellow-400/10"
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
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => deleteClient(client.id).then(loadClients)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINAÇÃO */}
          {!loading && filteredClients.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <div className="text-sm text-muted-foreground">
                Exibindo <span className="text-white font-medium">{startIndex + 1}</span>-
                <span className="text-white font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredClients.length)}
                </span> de{" "}
                <span className="text-white font-medium">{filteredClients.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-white/60">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
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
    </div>
  );
};

export default Clients;