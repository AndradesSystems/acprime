"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Handshake,
  Calendar,
  Calculator,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getContractById } from "@/services/contracts";
import { createNegotiation, type CreateNegotiationInput } from "@/services/negotiation";
import type { Contract } from "@/services/contracts";

type Props = {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateNegotiationModal({
  open,
  contract: initialData,
  onClose,
  onCreated,
}: Props) {
  const queryClient = useQueryClient();

  /* ===== ESTADOS DO FORMULÁRIO ACORDO ===== */
  const [valorCobrado, setValorCobrado] = useState<string>("0.00");
  const [qtdParcelas, setQtdParcelas] = useState<string>("1");
  const [primeiroVencimento, setPrimeiroVencimento] = useState<string>("");

  const { data: fullContract, isLoading } = useQuery({
    queryKey: ["contract-detail", initialData?.id],
    queryFn: () => getContractById(initialData!.id),
    enabled: open && !!initialData?.id,
    staleTime: 0,
  });

  const activeContract = fullContract || initialData;

  useEffect(() => {
    if (open && activeContract) {
      const totalOriginal = Number(activeContract.valorEmAberto || 0) + Number(activeContract.taxa || 0);
      setValorCobrado(totalOriginal.toFixed(2));
      setQtdParcelas("1");

      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      setPrimeiroVencimento(amanha.toISOString().split("T")[0]);
    }
  }, [open, activeContract]);

  const dividaOriginal = useMemo(() => {
    if (!activeContract) return 0;
    const emAberto = Number(activeContract.valorEmAberto || 0);
    const taxasAcumuladas = Number(activeContract.taxa || 0);
    return emAberto + taxasAcumuladas;
  }, [activeContract]);

  const calculoAcordo = useMemo(() => {
    const finalCobrado = Number(valorCobrado) || 0;
    const diferenca = dividaOriginal - finalCobrado;
    const parcelasCount = Math.max(1, Number(qtdParcelas) || 1);
    const valorDaParcela = finalCobrado / parcelasCount;

    return {
      finalCobrado,
      diferenca: Math.abs(diferenca),
      isDesconto: diferenca > 0,
      isAcrescimo: diferenca < 0,
      valorDaParcela,
    };
  }, [dividaOriginal, valorCobrado, qtdParcelas]);

  const negotiationMutation = useMutation({
    mutationFn: (payload: CreateNegotiationInput) => createNegotiation(payload),
    onSuccess: () => {
      toast.success("Acordo renegociado e firmado com sucesso! 🤝");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["all-negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      onCreated?.();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Erro ao gerar proposta de acordo"),
  });

  const handleFirmarAcordo = () => {
    if (!activeContract) return;
    if (!valorCobrado || Number(valorCobrado) <= 0) {
      return toast.warning("Defina um valor final válido para o acordo.");
    }
    if (!primeiroVencimento) {
      return toast.warning("Selecione a data do primeiro vencimento.");
    }

    const finalCobrado = Number(valorCobrado);
    const valorDescontoReal = dividaOriginal - finalCobrado;
    const numeroParcelas = Number(qtdParcelas);

    const payload: CreateNegotiationInput = {
      contractId: activeContract.id,
      valorDesconto: valorDescontoReal,
      tipo: numeroParcelas === 1 ? "A_VISTA" : "PARCELADO",
      qtdParcelas: numeroParcelas,
      primeiroVencimento,
    };

    negotiationMutation.mutate(payload);
  };

  if (!activeContract) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-4xl bg-[#0f172a] border-white/10 text-white p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">

        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Handshake className="text-emerald-400 w-6 h-6" /> Proposta de Re-negociação
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-400">
                Cliente Inadimplente:{" "}
                <span className="text-white font-medium">
                  {activeContract.client?.nome}
                </span>
              </p>
              <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="border-white/20 text-gray-300 uppercase">
                  Contrato Original: {activeContract.periodicity}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Dívida Bruta Original
            </p>
            <p className="text-2xl font-bold text-red-400 font-mono">
              R$ {dividaOriginal.toFixed(2)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-400" />
            <p>Calculando parâmetros financeiros...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

            {/* ESQUERDA: CONFIGURADOR DO NOVO ACORDO */}
            <div className="flex-1 bg-black/20 p-6 relative flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" /> Ajuste de Valores e Parcelas
                </h3>

                {/* INPUT: QUANTO VAI COBRAR */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300 uppercase">
                    Valor Final Acordado (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white/5 border-white/10 text-white pl-10 focus-visible:ring-emerald-500 h-12 text-lg font-mono font-bold"
                      value={valorCobrado}
                      onChange={(e) => setValorCobrado(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Insira o valor consolidado. O sistema calculará o abatimento ou a multa automaticamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SELECT: QUANTIDADE PARCELAS */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-300 uppercase">
                      Dividir em quantas Vezes?
                    </label>
                    <Select value={qtdParcelas} onValueChange={setQtdParcelas}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f172a] border-white/10 text-white">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n === 1 ? "À Vista" : `${n}x fixas`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* INPUT: DATA PRIMEIRO VENCIMENTO */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-300 uppercase">
                      Primeiro Vencimento
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        className="bg-white/5 border-white/10 text-white h-11 focus-visible:ring-emerald-500"
                        value={primeiroVencimento}
                        onChange={(e) => setPrimeiroVencimento(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DETALHAMENTO DA DÍVIDA QUE SERÁ SUBSTITUÍDA */}
              <div className="mt-6 bg-white/5 p-4 rounded-lg border border-white/5 space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Composição do saldo quebrado:</p>
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="bg-transparent text-gray-400">Principal em Aberto:</span>
                  <span>R$ {Number(activeContract.valorEmAberto || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="bg-transparent text-gray-400">Multas/Taxas Acumuladas:</span>
                  <span className="text-red-400">R$ {Number(activeContract.taxa || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* DIREITA: DETALHAMENTO DINÂMICO E IMPACTO */}
            <div className="w-full md:w-[350px] bg-[#020617] border-l border-white/10 flex flex-col p-6 shadow-2xl justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Projeção do Acordo
                </h4>

                <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
                  {calculoAcordo.isDesconto && calculoAcordo.diferenca > 0 && (
                    <div className="flex flex-col gap-1 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 bg-transparent">
                        <TrendingDown className="w-3 h-3" /> Desconto Concedido
                      </span>
                      <span className="text-lg font-bold text-emerald-400 font-mono bg-transparent">
                        - R$ {calculoAcordo.diferenca.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {calculoAcordo.isAcrescimo && calculoAcordo.diferenca > 0 && (
                    <div className="flex flex-col gap-1 bg-amber-500/10 border border-amber-500/20 p-3 rounded">
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 bg-transparent">
                        <TrendingUp className="w-3 h-3" /> Juros / Acréscimo Cobrado
                      </span>
                      <span className="text-lg font-bold text-amber-400 font-mono bg-transparent">
                        + R$ {calculoAcordo.diferenca.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-400">Total a Pagar:</span>
                    <span className="text-lg font-bold text-white font-mono">
                      R$ {calculoAcordo.finalCobrado.toFixed(2)}
                    </span>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Plano de Parcelas:</span>
                    <span className="text-sm text-gray-300 font-medium">
                      {qtdParcelas}x de
                    </span>
                  </div>

                  <p className="text-2xl font-bold text-emerald-400 font-mono text-right mt-1">
                    R$ {calculoAcordo.valorDaParcela.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14"
                  onClick={handleFirmarAcordo}
                  disabled={negotiationMutation.isPending}
                >
                  {negotiationMutation.isPending ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    "Firmar Contrato de Acordo 🤝"
                  )}
                </Button>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}