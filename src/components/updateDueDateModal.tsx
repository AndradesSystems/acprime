"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Contract } from "@/services/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateContractDueDate } from "@/services/contracts";

interface Props {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function UpdateDueDateModal({ open, contract, onClose, onUpdated }: Props) {
  const queryClient = useQueryClient();
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (contract && contract.vencimentoEm) {
      // Extrai apenas YYYY-MM-DD ignorando qualquer conversão de fuso
      const datePart = contract.vencimentoEm.split("T")[0];
      setDueDate(datePart);
    }
  }, [contract]);

  const mutation = useMutation({
    mutationFn: () => {
      // Enviamos com 12:00 para garantir que o dia não mude com o fuso horário
      const dateWithNoon = `${dueDate}T12:00:00.000Z`;
      return updateContractDueDate(contract!.id, dateWithNoon);
    },
    onSuccess: () => {
      toast.success("Vencimento atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      if (onUpdated) onUpdated();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao atualizar vencimento.");
    },
  });

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#071e30] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Atualizar vencimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded bg-white/5 border border-white/5">
            <p className="text-sm text-gray-400">
              Cliente: <span className="text-white font-semibold">{contract.client?.nome}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-bold">Nova Data</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <Button
            className="bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold w-full"
            disabled={mutation.isPending || !dueDate}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar Data"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}