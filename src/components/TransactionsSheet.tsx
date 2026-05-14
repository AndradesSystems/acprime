import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NumericFormat } from "react-number-format";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceExpense, TransactionStatus } from "@/services/finance";

/* =======================
    SCHEMA DE VALIDAÇÃO (ZOD)
======================= */
const transactionSchema = z.object({
  tipo_fluxo: z.enum(["ENTRADA", "SAIDA"]),
  descricao: z.string().min(3, "Descrição muito curta"),
  valor: z.number({ required_error: "Informe o valor", invalid_type_error: "Valor inválido" }).min(0.01, "O valor deve ser maior que zero"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  dataInicio: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["VARIAVEL", "FIXO", "PARCELADO"]),
  status: z.enum(["PENDENTE", "CONCLUIDO", "CANCELADO"]),
  parcelasTotal: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(1, "Mínimo 1 parcela").optional()
  ),
  pago: z.boolean().default(false),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const CATEGORIES = {
  ENTRADA: ["Salário", "Transferência", "PIX", "Investimento", "Venda", "Outros"],
  SAIDA: ["Comida", "Contas Fixas", "Compras", "Saúde", "Lazer", "Transporte", "Impostos", "Outros"],
};

interface TransactionSheetProps {
  onSave: (data: any) => void;
  initialData?: FinanceExpense | null;
}

const TransactionSheet = ({ onSave, initialData }: TransactionSheetProps) => {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      tipo_fluxo: "SAIDA",
      tipo: "VARIAVEL",
      status: "PENDENTE",
      pago: false,
      descricao: "",
      valor: undefined as any,
      dataInicio: new Date().toISOString().split("T")[0],
    },
  });

  // Sincroniza o campo 'pago' (boolean) com o 'status' (enum)
  const watchStatus = form.watch("status");
  useEffect(() => {
    form.setValue("pago", watchStatus === "CONCLUIDO");
  }, [watchStatus, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        tipo_fluxo: initialData.tipo_fluxo,
        descricao: initialData.descricao,
        valor: Number(initialData.valor),
        categoria: initialData.categoria || "",
        dataInicio: new Date(initialData.dataInicio).toISOString().split("T")[0],
        tipo: initialData.tipo,
        status: initialData.status,
        parcelasTotal: initialData.parcelasTotal || undefined,
        pago: initialData.pago,
      });
    }
  }, [initialData, form]);

  const watchTipoFluxo = form.watch("tipo_fluxo");
  const watchFrequencia = form.watch("tipo");

  const onSubmit = (values: TransactionFormValues) => {
    const payload = {
      ...values,
      dataInicio: new Date(values.dataInicio).toISOString(),
    };
    onSave(payload);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 text-white">
      {/* SELETOR ENTRADA/SAIDA */}
      <Controller
        name="tipo_fluxo"
        control={form.control}
        render={({ field }) => (
          <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="ENTRADA" className="data-[state=active]:bg-green-600">Entrada</TabsTrigger>
              <TabsTrigger value="SAIDA" className="data-[state=active]:bg-red-600">Saída</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título / Descrição</Label>
          <Input 
            {...form.register("descricao")}
            placeholder="Ex: Netflix, Salário..." 
            className={`bg-white/5 border-white/10 ${form.formState.errors.descricao ? 'border-red-500' : ''}`} 
          />
        </div>

        <div className="space-y-2">
          <Label>Valor</Label>
          <Controller
            name="valor"
            control={form.control}
            render={({ field }) => (
              <NumericFormat
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                placeholder="R$ 0,00"
                className={`bg-white/5 border-white/10 text-xl font-bold text-primary ${form.formState.errors.valor ? 'border-red-500' : ''}`}
                value={field.value}
                onValueChange={(values) => field.onChange(values.floatValue)}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              name="categoria"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[watchTipoFluxo].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Situação Inicial</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data de Início</Label>
            <Input type="date" {...form.register("dataInicio")} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Controller
              name="tipo"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VARIAVEL">Única</SelectItem>
                    <SelectItem value="FIXO">Recorrente (Fixo)</SelectItem>
                    <SelectItem value="PARCELADO">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {watchFrequencia === "PARCELADO" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <Label>Total de Parcelas</Label>
            <Input type="number" {...form.register("parcelasTotal")} className="bg-white/5 border-white/10" />
          </div>
        )}

        <Button 
          type="submit"
          className="w-full bg-gradient-gold text-black font-bold h-12 mt-4 shadow-gold hover:opacity-90 active:scale-95 transition-all"
        >
          {form.formState.isSubmitting ? "Processando..." : "Salvar Transação"}
        </Button>
      </div>
    </form>
  );
};

export default TransactionSheet;