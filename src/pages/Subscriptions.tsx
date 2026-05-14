"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Trash2,
  UserPlus,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Key,
  CalendarClock,
  History,
  Ban,
  Edit,
  UserCheck,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  getSubscribers,
  createSubscriber,
  deleteSubscriber,
  renewSubscriber,
  updateSubscriber,
  Subscriber,
  SubscriberInput,
} from "@/services/subscriber";

const Subscriptions = () => {
  const [users, setUsers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Subscriber | null>(null);

  const [formData, setFormData] = useState<SubscriberInput & { senhaPlana: string }>({
    nome: "",
    email: "",
    cpf: "",
    senha: "",
    senhaPlana: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const maskCPF = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    return rawValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  };

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubscribers();
      setUsers(data);
    } catch (error) {
      toast({ title: "Erro ao carregar assinantes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return users.filter((u) =>
      [u.nome, u.email, u.cpf].join(" ").toLowerCase().includes(term),
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateSubscriber(editingUser.id, {
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf,
          ...(formData.senhaPlana ? { senha: formData.senhaPlana } : {}),
        });
        toast({ title: "Assinante atualizado!" });
      } else {
        await createSubscriber({ ...formData, senha: formData.senhaPlana });
        toast({ title: "Assinante criado com sucesso!" });
      }
      loadSubscribers();
      closeSheet();
    } catch (error: any) {
      toast({
        title: "Erro na operação",
        description: error.response?.data?.message || "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (user: Subscriber) => {
    const newStatus = user.status === "ATIVO" ? "BLOQUEADO" : "ATIVO";
    try {
      await updateSubscriber(user.id, { status: newStatus });
      toast({ 
        title: newStatus === "BLOQUEADO" ? "Assinatura Pausada" : "Assinatura Reativada",
        description: `O usuário ${user.nome} foi ${newStatus.toLowerCase()}.`
      });
      loadSubscribers();
    } catch (error) {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await renewSubscriber(id, 30);
      toast({ title: "Assinatura renovada por +30 dias!" });
      loadSubscribers();
    } catch (error) {
      toast({ title: "Erro ao renovar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover assinante permanentemente? Isso apagará todos os dados vinculados.")) {
      try {
        await deleteSubscriber(id);
        toast({ title: "Assinante removido com sucesso" });
        loadSubscribers();
      } catch (error) {
        toast({ title: "Erro ao remover", variant: "destructive" });
      }
    }
  };

  const openEditSheet = (user: Subscriber) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      senha: "",
      senhaPlana: "",
    });
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setEditingUser(null);
    setFormData({ nome: "", email: "", cpf: "", senha: "", senhaPlana: "" });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 text-white bg-gradient-dark">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Assinantes</h1>
            <p className="text-muted-foreground mt-1">Controle total sobre acessos, status e renovações</p>
          </div>
          <Button onClick={() => setIsSheetOpen(true)} className="bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold">
            <UserPlus className="w-4 h-4 mr-2" /> Novo Assinante
          </Button>
        </div>

        <Card className="p-0 bg-card/50 border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold" /> Assinantes do Sistema
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cpf..."
                  className="pl-10 bg-white/5 border-white/10 w-full md:w-[300px] text-white focus:ring-gold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="bg-white/5 border-white/10" onClick={loadSubscribers} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="border-t border-white/5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-gold hover:bg-gradient-gold border-none">
                  <TableHead className="text-white font-bold h-12">Assinante</TableHead>
                  <TableHead className="text-white font-bold h-12">CPF / Status</TableHead>
                  <TableHead className="text-white font-bold h-12">Vencimento</TableHead>
                  <TableHead className="text-right text-white font-bold h-12 px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                      {loading ? "Carregando..." : "Nenhum assinante encontrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => {
                    const expiryDate = user.vencimento ? parseISO(user.vencimento) : null;
                    const isExpired = expiryDate ? isBefore(expiryDate, new Date()) : false;
                    const isBlocked = user.status === "BLOQUEADO";

                    return (
                      <TableRow key={user.id} className={cn("border-white/5 hover:bg-white/5 transition-colors", isBlocked && "opacity-60")}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{user.nome}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground font-mono text-xs">{user.cpf}</span>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase", isBlocked ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400")}>
                              {user.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center gap-2 text-xs font-medium", isExpired ? "text-red-400" : "text-emerald-400")}>
                            <CalendarClock className="w-3.5 h-3.5" />
                            {expiryDate ? format(expiryDate, "dd/MM/yyyy", { locale: ptBR }) : "Sem vencimento"}
                            {isExpired && <Ban className="w-3 h-3 ml-1" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Editar Dados" className="text-blue-400 hover:bg-blue-400/10" onClick={() => openEditSheet(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title={isBlocked ? "Reativar" : "Pausar Assinatura"} className={cn(isBlocked ? "text-emerald-500 hover:bg-emerald-500/10" : "text-orange-500 hover:bg-orange-500/10")} onClick={() => handleToggleStatus(user)}>
                              {isBlocked ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" title="Renovar +30 dias" className="text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleRenew(user.id)}>
                              <History className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Excluir" className="text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(user.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between p-6 border-t border-white/5">
              <div className="text-sm text-muted-foreground">Total: <span className="text-white font-medium">{filteredUsers.length}</span></div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-card border-primary/20 text-white">
          <SheetHeader className="pb-6 border-b border-white/5">
            <SheetTitle className="text-2xl flex items-center gap-2 text-white">
              {editingUser ? <Edit className="w-6 h-6 text-gold" /> : <UserPlus className="w-6 h-6 text-gold" />}
              {editingUser ? "Editar Assinante" : "Novo Assinante"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input placeholder="Ex: João Silva" className="bg-white/5 border-white/10" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input placeholder="000.000.000-00" className="bg-white/5 border-white/10" maxLength={14} value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input type="email" placeholder="cliente@email.com" className="bg-white/5 border-white/10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha Inicial"}</Label>
              <div className="relative">
                <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 pr-10" value={formData.senhaPlana} onChange={(e) => setFormData({ ...formData, senhaPlana: e.target.value })} required={!editingUser} />
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-bold h-12">
                {editingUser ? "Salvar Alterações" : "Criar Assinante"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={closeSheet}>Cancelar</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Subscriptions;