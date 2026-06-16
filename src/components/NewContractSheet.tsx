"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Check, ChevronsUpDown, Calculator, Wallet, AlertCircle } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { createContract } from "@/services/contracts";
import { getClients, type Client } from "@/services/clients";
// 👇 Importamos o serviço de saldo
import { getBalance } from "@/services/balance";

import { parseCurrencyToNumber, formatCurrencyInput } from "@/lib/utils";

/* =======================
    HELPERS
======================= */

// 🛠️ AJUSTADO: Adicionado suporte ao tipo "PARCELADO" no retorno do Enum
const mapPeriodicityToEnum = (
  periodicidade: string
): "DAILY" | "WEEKLY" | "MONTHLY" | "PARCELADO" => {
  switch (periodicidade) {
    case "DIARIO":
      return "DAILY";
    case "SEMANAL":
      return "WEEKLY";
    case "PARCELADO":
      return "PARCELADO";
    default:
      return "MONTHLY";
  }
};

const calcularVencimento = (dataInicioStr?: string) => {
  const dataBase = dataInicioStr ? new Date(dataInicioStr + "T12:00:00") : new Date();
  const vencimento = new Date(dataBase);
  
  vencimento.setDate(dataBase.getDate() + 1);

  return vencimento.toISOString();
};

const parseDateInputToISO = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return utcDate.toISOString();
};

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/* =======================
    COMPONENT
======================= */

type NewContractSheetProps = {
  triggerLabel?: string;
  classButton?: string;
};

const DEFAULT_BUTTON_CLASS =
  "bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold";

const NewContractSheet = ({
  triggerLabel = "Novo Contrato",
  classButton,
}: NewContractSheetProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 🛠 ??USTADO: Adicionado 'qtdParcelas' no estado inicial do formulário
  const [formData, setFormData] = useState({
    clientId: "",
    valorPrincipal: "",
    jurosPercent: "40",
    periodicidade: "MENSAL",
    dataInicio: "",
    qtdParcelas: "5", // Valor padrão seguro inicial
    historico: "",
  });

  // 1. Busca Clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  // 2. Busca Saldo Disponível (NOVO)
  const { data: balanceData } = useQuery({
    queryKey: ["balance"],
    queryFn: getBalance,
    refetchOnWindowFocus: true, // Garante que o saldo esteja sempre fresco
  });

  const selectedClient = clients.find((c: Client) => c.id === formData.clientId);
  const saldoDisponivel = balanceData?.saldo || 0;

  // Lógica do Preview de Juros e Validação
  const valorNumerico = parseCurrencyToNumber(formData.valorPrincipal) || 0;
  const jurosCalculado = (valorNumerico * (Number(formData.jurosPercent) / 100));
  
  // Verifica se tem saldo suficiente
  const isSaldoInsuficiente = valorNumerico > saldoDisponivel;

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }

    if (valorNumerico <= 0) {
        toast({ title: "Valor inválido", description: "O valor deve ser maior que zero.", variant: "destructive" });
        return;
    }

    // 🛠️ AJUSTADO: Validação para impedir o envio se o número de parcelas for inválido no modo parcelado
    if (formData.periodicidade === "PARCELADO" && (!formData.qtdParcelas || Number(formData.qtdParcelas) <= 0)) {
      toast({ title: "Quantidade inválida", description: "Informe o número de parcelas da operação.", variant: "destructive" });
      return;
    }

    // 🔒 VALIDAÇÃO DE SALDO (NOVO)
    if (isSaldoInsuficiente) {
      toast({ 
        title: "Saldo Operacional Insuficiente", 
        description: `Você possui apenas R$ ${saldoDisponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} disponíveis. Realize um aporte.`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      const dataInicioString = formData.dataInicio || getTodayString();
      const dataInicioISO = parseDateInputToISO(dataInicioString);

      // 🛠️ AJUSTADO: Mapeia e injeta o `qtdParcelas` dinamicamente no payload enviado para o serviço
      await createContract({
        clientId: formData.clientId,
        valorPrincipal: valorNumerico,
        jurosPercent: Number(formData.jurosPercent),
        vencimentoEm: calcularVencimento(dataInicioString),
        periodicity: mapPeriodicityToEnum(formData.periodicidade),
        dataInicio: dataInicioISO,
        historico: formData.historico || undefined,
        qtdParcelas: formData.periodicidade === "PARCELADO" ? Number(formData.qtdParcelas) : undefined,
      });

      toast({ title: "Contrato criado com sucesso" });

      setIsOpen(false);
      setFormData({
        clientId: "",
        valorPrincipal: "",
        jurosPercent: "40",
        periodicidade: "MENSAL",
        dataInicio: "",
        qtdParcelas: "5",
        historico: "",
      });

      // Atualiza todas as queries relevantes, incluindo o saldo
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["payments-period"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] }); // Força atualização do saldo
    } catch {
      toast({ title: "Erro ao criar contrato", variant: "destructive" });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className={classButton ?? DEFAULT_BUTTON_CLASS}>
          <Plus className="w-3 h-3" />
          {triggerLabel}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Contrato</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleCreateContract} className="mt-6 space-y-6">
          {/* CLIENTE COM PESQUISA */}
          <div className="space-y-2 flex flex-col">
            <Label>Cliente *</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-background border-input"
                >
                  {formData.clientId ? selectedClient?.nome : "Pesquisar cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Digite o nome do cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client: Client) => (
                        <CommandItem
                          key={client.id}
                          value={client.nome}
                          onSelect={() => {
                            setFormData({ ...formData, clientId: client.id });
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.clientId === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{client.nome}</span>
                            <span className="text-[10px] text-muted-foreground">{client.cpf}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
            
            {/* 🆕 MOSTRADOR DE SALDO DISPONÍVEL */}
            <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Saldo Disponível:</span>
                </div>
                <span className={cn(
                    "font-mono font-bold", 
                    isSaldoInsuficiente ? "text-red-400" : "text-emerald-400"
                )}>
                    {saldoDisponivel.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

            {/* VALOR COM MÁSCARA + JUROS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor principal *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formData.valorPrincipal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valorPrincipal: formatCurrencyInput(e.target.value),
                    })
                  }
                  placeholder="R$ 0,00"
                  required
                  className={cn(
                    "font-mono",
                    isSaldoInsuficiente && "border-red-500/50 text-red-400 focus-visible:ring-red-500"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>{formData.periodicidade === "PARCELADO" ? "Juros Total (%) *" : "Juros (%) *"}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.jurosPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, jurosPercent: e.target.value })
                    }
                    required
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>
            
            {/* AVISO DE SALDO INSUFICIENTE */}
            {isSaldoInsuficiente && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-red-400 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Valor excede o saldo operacional.
                </div>
            )}

            {/* PREVIEW DO JUROS EM REAIS */}
            <div className="flex items-center justify-between px-1 py-2 border-t border-white/5 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <Calculator className="w-3.5 h-3.5 text-gold" />
                <span>{formData.periodicidade === "PARCELADO" ? "Total de Juros:" : "Rendimento do período:"}</span>
              </div>
              <div className="text-lg font-bold text-gold font-mono">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(jurosCalculado)}
              </div>
            </div>

            {/* 🛠️ AJUSTADO: Seção de Preview dinâmico do valor de cada parcela (Apenas se for Parcelado) */}
            {formData.periodicidade === "PARCELADO" && valorNumerico > 0 && Number(formData.qtdParcelas) > 0 && (
              <div className="flex items-center justify-between px-1 py-2 border-t border-dashed border-white/10">
                <div className="text-sm text-muted-foreground italic">Valor estimado da parcela:</div>
                <div className="text-sm font-semibold font-mono text-white/90">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((valorNumerico + jurosCalculado) / Number(formData.qtdParcelas))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* PERIODICIDADE */}
            <div className="space-y-2">
              <Label>Periodicidade *</Label>
              <Select
                value={formData.periodicidade}
                onValueChange={(value) => setFormData({ ...formData, periodicidade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIARIO">Diário</SelectItem>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  {/* 🛠️ AJUSTADO: Nova opção adicionada ao Select */}
                  <SelectItem value="PARCELADO">Parcelado (Fixo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DATA INÍCIO */}
            <div className="space-y-2">
              <Label>{formData.periodicidade === "PARCELADO" ? "Primeiro Vencimento *" : "Data de início"}</Label>
              <Input
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                required={formData.periodicidade === "PARCELADO"}
              />
            </div>
          </div>

          {/* 🛠️ AJUSTADO: CAMPO TOTALMENTE CONDICIONAL. Só aparece se 'PARCELADO' estiver selecionado */}
          {formData.periodicidade === "PARCELADO" && (
            <div className="space-y-2 p-3 rounded-lg border border-white/10 bg-white/5 animate-in fade-in duration-200">
              <Label>Quantidade de parcelas *</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={formData.qtdParcelas}
                onChange={(e) => setFormData({ ...formData, qtdParcelas: e.target.value })}
                placeholder="Ex: 5"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Informe o número exato de parcelas para a divisão do saldo total.
              </p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground -mt-2">
            * Deixe a data em branco para usar hoje (exceto na modalidade parcelada).
          </p>

          {/* HISTÓRICO */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.historico}
              onChange={(e) => setFormData({ ...formData, historico: e.target.value })}
              placeholder="Opcional"
              className="resize-none h-20"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <Button 
                type="submit" 
                className={cn(
                    "flex-1 bg-gradient-gold transition-all",
                    isSaldoInsuficiente && "opacity-50 grayscale cursor-not-allowed"
                )}
                disabled={isSaldoInsuficiente}
            >
              Criar contrato
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default NewContractSheet;