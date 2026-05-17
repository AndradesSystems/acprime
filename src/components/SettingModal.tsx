"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings2, Loader2 } from "lucide-react";
import { getTaxas, updateTaxa, ContractPeriodicity, Taxa } from "@/services/taxa";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// O estado local agora permite string para dar liberdade total ao input nativo
type FormRates = {
  DAILY: string | number;
  WEEKLY: string | number;
  MONTHLY: string | number;
};

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const queryClient = useQueryClient();
  
  const [rates, setRates] = useState<FormRates>({
    DAILY: 0,
    WEEKLY: 0,
    MONTHLY: 0,
  });

  const { data: serverTaxas, isLoading: isLoadingTaxas } = useQuery<Taxa[]>({
    queryKey: ["taxas-globais"],
    queryFn: getTaxas,
    enabled: open,
  });

  useEffect(() => {
    if (serverTaxas && Array.isArray(serverTaxas)) {
      const mapped: FormRates = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
      serverTaxas.forEach((t) => {
        if (t.type in mapped) {
          mapped[t.type as keyof FormRates] = Number(t.value);
        }
      });
      setRates(mapped);
    }
  }, [serverTaxas]);

  const mutation = useMutation({
    mutationFn: async (newRates: FormRates) => {
      const promises = Object.entries(newRates).map(([type, value]) =>
        updateTaxa({ 
          type: type as ContractPeriodicity, 
          // 💡 Se o campo estiver vazio (""), envia como 0 para o backend
          value: value === "" ? 0 : Number(value) 
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Taxas do sistema atualizadas!");
      queryClient.invalidateQueries({ queryKey: ["taxas-globais"] });
      onClose();
    },
    onError: () => {
      toast.error("Erro ao atualizar taxas.");
    },
  });

  const handleSave = () => {
    mutation.mutate(rates);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#071e30] border-white/10 text-white sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-premium">
            <Settings2 className="w-5 h-5 text-gold" /> Configurar Taxas Gerais
          </DialogTitle>
        </DialogHeader>

        {isLoadingTaxas ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {/* 💡 Removido o (%) */}
              <Label htmlFor="daily">Taxa Diária</Label> 
              <Input
                id="daily"
                type="number"
                step="0.01"
                className="bg-white/5 border-white/10"
                value={rates.DAILY}
                // 💡 Passa o e.target.value direto (string), permitindo apagar o zero sem travar
                onChange={(e) => setRates({ ...rates, DAILY: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              {/* 💡 Removido o (%) */}
              <Label htmlFor="weekly">Taxa Semanal</Label>
              <Input
                id="weekly"
                type="number"
                step="0.01"
                className="bg-white/5 border-white/10"
                value={rates.WEEKLY}
                onChange={(e) => setRates({ ...rates, WEEKLY: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              {/* 💡 Removido o (%) */}
              <Label htmlFor="monthly">Taxa Mensal</Label>
              <Input
                id="monthly"
                type="number"
                step="0.01"
                className="bg-white/5 border-white/10"
                value={rates.MONTHLY}
                onChange={(e) => setRates({ ...rates, MONTHLY: e.target.value })}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="hover:bg-white/5 text-white/70">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={mutation.isPending || isLoadingTaxas}
            className="bg-gradient-gold text-black font-bold hover:opacity-90"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}