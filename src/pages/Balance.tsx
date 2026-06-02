"use client";

import { useEffect, useState, useCallback } from "react";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   Wallet,
   ArrowUpRight,
   ArrowDownLeft,
   History,
   TrendingUp,
   Eye,
   EyeOff,
   Loader2,
   Plus,
   Minus,
   Search,
   MessageSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importando os serviços
import {
   getBalance,
   getBalanceHistory,
   addBalance,
   removeBalance,
   BalanceLog,
} from "@/services/balance";
import WhatsAppConnectModal from "@/components/WhatsappConectModal";

export default function Balance() {
   // Estados
   const [balance, setBalance] = useState<number>(0);
   const [logs, setLogs] = useState<BalanceLog[]>([]);
   const [loading, setLoading] = useState(true);
   const [showBalance, setShowBalance] = useState(true);
   
   // 🟢 NOVO ESTADO: Armazena se o usuário atual possui o plano PRO habilitado
   const [isProUser, setIsProUser] = useState<boolean>(false);

   // Estado para Modais
   const [isDepositOpen, setIsDepositOpen] = useState(false);
   const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
   const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
   const [operationLoading, setOperationLoading] = useState(false);

   // Estados de Formulário
   const [amount, setAmount] = useState("");
   const [description, setDescription] = useState("");
   const [searchTerm, setSearchTerm] = useState("");

   // 🟢 VALIDAÇÃO DE PLANO: Executada no carregamento do cliente (Next.js/React SSR-safe)
   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         try {
            const userObj = JSON.parse(storedUser);
            // Altere para a string exata do seu banco de dados, assumindo que seja "PRO"
            if (userObj && userObj.plan === "PRO") {
               setIsProUser(true);
            }
         } catch (e) {
            console.error("Erro ao converter objeto de usuário do localStorage", e);
         }
      }
   }, []);

   // Carregamento de Dados
   const loadData = useCallback(async () => {
      setLoading(true);
      try {
         const [balanceData, historyData] = await Promise.all([
            getBalance(),
            getBalanceHistory(),
         ]);
         setBalance(balanceData.saldo);
         setLogs(historyData);
      } catch (error) {
         toast({
            title: "Erro de conexão",
            description: "Não foi possível carregar os dados da carteira.",
            variant: "destructive",
         });
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      loadData();
   }, [loadData]);

   // Formatador de Moeda
   const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
         style: "currency",
         currency: "BRL",
      }).format(value);
   };

   // MÁSCARA DE MOEDA
   const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      value = value.replace(/\D/g, "");

      if (value === "") {
         setAmount("");
         return;
      }

      const numberValue = Number(value) / 100;

      setAmount(
         numberValue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
         })
      );
   };

   // Handlers de Operação
   const handleTransaction = async (type: "DEPOSIT" | "WITHDRAW") => {
      const rawValue = Number(amount.replace(/\D/g, "")) / 100;

      if (!amount || rawValue <= 0) {
         toast({ title: "Valor inválido", description: "Insira um valor maior que zero.", variant: "destructive" });
         return;
      }

      setOperationLoading(true);
      try {
         const payload = {
            valor: rawValue,
            descricao: description || (type === "DEPOSIT" ? "Aporte Manual" : "Retirada Manual"),
         };

         if (type === "DEPOSIT") {
            await addBalance(payload);
            toast({ title: "Sucesso!", description: "Aporte realizado e saldo atualizado.", className: "bg-emerald-600 text-white border-none" });
         } else {
            await removeBalance(payload);
            toast({ title: "Sucesso!", description: "Retirada realizada com sucesso." });
         }

         setAmount("");
         setDescription("");
         setIsDepositOpen(false);
         setIsWithdrawOpen(false);
         loadData();
      } catch (error: any) {
         toast({
            title: "Falha na operação",
            description: error.response?.data?.error || "Erro desconhecido.",
            variant: "destructive",
         });
      } finally {
         setOperationLoading(false);
      }
   };

   // Filtro de Logs
   const filteredLogs = logs.filter((log) =>
      log.descricao.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="min-h-screen p-6 text-white bg-[#0a0e17]">

         {/* HEADER */}
         <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-foreground font-premium">Caixa Operacional</h1>
               <p className="text-muted-foreground mt-1">Gerencie aportes, retiradas e visualize o extrato completo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
               
               {/* 🟢 VALIDAÇÃO CONDICIONAL: O botão só renderiza se 'isProUser' for verdadeiro */}
               {isProUser && (
                  <Button
                     variant="outline"
                     className="border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] font-medium"
                     onClick={() => setIsWhatsAppOpen(true)}
                  >
                     <MessageSquare className="w-4 h-4 mr-2" /> Conectar WhatsApp
                  </Button>
               )}

               <Button variant="outline" className="border-white/10 text-muted-foreground hover:text-white" onClick={loadData}>
                  <History className="w-4 h-4 mr-2" /> Atualizar
               </Button>
            </div>
         </div>

         <div className="max-w-7xl pt-6 mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* COLUNA ESQUERDA: CARD PRINCIPAL */}
            <div className="lg:col-span-1 space-y-6">
               <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-950 to-black shadow-2xl">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

                  <CardHeader className="relative z-10 pb-2">
                     <div className="flex justify-between items-center">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 w-fit text-emerald-400">
                           <Wallet className="w-5 h-5" />
                        </div>
                        <Button size="icon" variant="ghost" className="text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setShowBalance(!showBalance)}>
                           {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                     </div>
                     <CardTitle className="text-muted-foreground font-medium text-sm pt-4">Saldo Disponível</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                     {loading ? (
                        <div className="h-12 w-48 bg-white/10 animate-pulse rounded-md" />
                     ) : (
                        <div className="space-y-1">
                           <span className="text-4xl font-extrabold tracking-tighter text-white">
                              {showBalance ? formatCurrency(balance) : "R$ ••••••••"}
                           </span>
                           <p className="text-xs text-emerald-500/80 flex items-center gap-1 font-medium">
                              <TrendingUp className="w-3 h-3" /> Pronto para operações
                           </p>
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-3 mt-8">
                        <Button
                           onClick={() => setIsDepositOpen(true)}
                           className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-400/20 shadow-lg shadow-emerald-900/20"
                        >
                           <Plus className="w-4 h-4 mr-2" /> Aporte
                        </Button>
                        <Button
                           onClick={() => setIsWithdrawOpen(true)}
                           variant="outline"
                           className="border-white/10 hover:bg-white/5 hover:text-red-400 text-muted-foreground font-semibold"
                        >
                           <Minus className="w-4 h-4 mr-2" /> Retirada
                        </Button>
                     </div>
                  </CardContent>
               </Card>

               <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-card/40 border-white/5 p-4 flex flex-col justify-center items-center text-center">
                     <span className="text-xs text-muted-foreground">Total Entradas</span>
                     <span className="text-lg font-bold text-emerald-400">
                        {logs.filter(l => l.tipo === "ENTRADA").length} ops
                     </span>
                  </Card>
                  <Card className="bg-card/40 border-white/5 p-4 flex flex-col justify-center items-center text-center">
                     <span className="text-xs text-muted-foreground">Total Saídas</span>
                     <span className="text-lg font-bold text-rose-400">
                        {logs.filter(l => l.tipo === "SAIDA").length} ops
                     </span>
                  </Card>
               </div>
            </div>

            {/* COLUNA DIREITA: TABELA DE EXTRATO */}
            <Card className="lg:col-span-2 bg-card/40 border-white/5 backdrop-blur-sm shadow-xl flex flex-col h-[600px]">
               <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                     <h2 className="text-xl font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-gold" /> Extrato de Movimentações
                     </h2>
                     <p className="text-xs text-muted-foreground">Histórico completo de alterações no saldo.</p>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                        placeholder="Filtrar descrição..."
                        className="pl-9 bg-white/5 border-white/10 min-w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-auto">
                  <Table>
                     <TableHeader className="bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
                        <TableRow className="border-white/5 hover:bg-transparent">
                           <TableHead className="text-white w-[180px]">Data/Hora</TableHead>
                           <TableHead className="text-white">Descrição</TableHead>
                           <TableHead className="text-white text-right">Valor</TableHead>
                           <TableHead className="text-white text-right pr-6">Saldo Resultante</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {loading ? (
                           <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                 <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                              </TableCell>
                           </TableRow>
                        ) : filteredLogs.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                 Nenhuma movimentação encontrada.
                              </TableCell>
                           </TableRow>
                        ) : (
                           filteredLogs.map((log) => {
                              const isEntrada = log.tipo === "ENTRADA";
                              return (
                                 <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                       {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                       <div className="flex items-center gap-2">
                                          <div className={cn("p-1 rounded-md", isEntrada ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                                             {isEntrada ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownLeft className="w-3 h-3 text-rose-500" />}
                                          </div>
                                          {log.descricao}
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                       <span className={isEntrada ? "text-emerald-400" : "text-rose-400"}>
                                          {isEntrada ? "+" : "-"} {formatCurrency(Number(log.valor))}
                                       </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 text-muted-foreground text-xs">
                                       {formatCurrency(Number(log.saldoNovo))}
                                    </TableCell>
                                 </TableRow>
                              )
                           })
                        )}
                     </TableBody>
                  </Table>
               </div>
            </Card>
         </div>

         {/* --- MODAL DE APORTE --- */}
         <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogContent className="bg-card border-white/10 text-white sm:max-w-md">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-emerald-400">
                     <Wallet className="w-5 h-5" /> Novo Aporte
                  </DialogTitle>
                  <DialogDescription>
                     Adicionar dinheiro ao caixa operacional da empresa.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                     <Label>Valor do Aporte</Label>
                     <Input
                        type="text"
                        placeholder="R$ 0,00"
                        className="bg-white/5 border-white/10 text-xl font-bold text-emerald-400 placeholder:text-emerald-400/30"
                        value={amount}
                        onChange={handleAmountChange}
                        autoFocus
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Descrição (Opcional)</Label>
                     <Input
                        placeholder="Ex: Investimento Sócio A"
                        className="bg-white/5 border-white/10"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDepositOpen(false)}>Cancelar</Button>
                  <Button
                     onClick={() => handleTransaction("DEPOSIT")}
                     disabled={operationLoading}
                     className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                     {operationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     Confirmar Aporte
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* --- MODAL DE RETIRADA --- */}
         <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogContent className="bg-card border-white/10 text-white sm:max-w-md">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-rose-400">
                     <ArrowDownLeft className="w-5 h-5" /> Realizar Sangria
                  </DialogTitle>
                  <DialogDescription>
                     Retirar dinheiro do caixa (Lucros, despesas externas, etc).
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                     <Label>Valor da Retirada</Label>
                     <Input
                        type="text"
                        placeholder="R$ 0,00"
                        className="bg-white/5 border-white/10 text-xl font-bold text-rose-400 placeholder:text-rose-400/30"
                        value={amount}
                        onChange={handleAmountChange}
                        autoFocus
                     />
                  </div>
                  <div className="space-y-2">
                     <Label>Motivo da Retirada</Label>
                     <Input
                        placeholder="Ex: Pagamento de Pró-labore"
                        className="bg-white/5 border-white/10"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsWithdrawOpen(false)}>Cancelar</Button>
                  <Button
                     onClick={() => handleTransaction("WITHDRAW")}
                     disabled={operationLoading}
                     variant="destructive"
                     className="bg-rose-600 hover:bg-rose-500"
                  >
                     {operationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     Confirmar Retirada
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* --- MODAL DO WHATSAPP --- */}
         <WhatsAppConnectModal
            open={isWhatsAppOpen}
            onClose={() => setIsWhatsAppOpen(false)}
         />
      </div>
   );
}