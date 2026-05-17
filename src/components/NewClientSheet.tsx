"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  createClient,
  updateClient,
  type Client,
  type ClientInput,
} from "@/services/clients";

/* =======================
   MÁSCARAS (HELPERS)
======================= */

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

/* =======================
   TYPES
======================= */

type ClientSheetProps = {
  triggerLabel?: string;
  classButton?: string;
  client?: Client | null;
  onClose?: () => void;
  onSuccess?: (client: Client) => void;
};

/* =======================
   CONSTANTS
======================= */

const DEFAULT_BUTTON_CLASS =
  "bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-gold";

/* =======================
   COMPONENT
======================= */

const ClientSheet = ({
  triggerLabel = "Novo Cliente",
  classButton,
  client,
  onClose,
  onSuccess,
}: ClientSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ClientInput>({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    dataNascimento: "",
    endereco: "",
  });

  /* =======================
     EFFECTS
  ======================= */

  // Monitora se um cliente foi selecionado para edição externamente
  useEffect(() => {
    if (client) {
      setFormData({
        nome: client.nome ?? "",
        cpf: formatCPF(client.cpf ?? ""),
        telefone: formatTelefone(client.telefone ?? ""),
        email: client.email ?? "",
        dataNascimento: client.dataNascimento ?? "",
        endereco: client.endereco ?? "",
      });
      setIsOpen(true);
    }
  }, [client]);

  // Controla o fechamento e limpa os estados correspondentes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
      onClose?.();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      dataNascimento: "",
      endereco: "",
    });
    setIsOpen(false);
  };

  /* =======================
     SUBMIT
  ======================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: ClientInput = {
        nome: formData.nome.trim(),
        // Enviamos apenas os números limpos para a API
        cpf: formData.cpf.replace(/\D/g, ""),
        telefone: formData.telefone.replace(/\D/g, ""),
        email: formData.email?.trim() ? formData.email.trim() : null,
        dataNascimento: formData.dataNascimento || null,
        endereco: formData.endereco?.trim() ? formData.endereco.trim() : null,
      };

      const saved = client
        ? await updateClient(client.id, payload)
        : await createClient(payload);

      toast({
        title: client
          ? "Cliente atualizado com sucesso"
          : "Cliente cadastrado com sucesso",
      });

      onSuccess?.(saved);
      resetForm();
      onClose?.();
    } catch (err: any) {
      toast({
        title:
          err?.response?.data?.message ||
          err?.message ||
          "Erro ao salvar cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className={classButton ?? DEFAULT_BUTTON_CLASS}>
          <User className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg bg-card border-primary/20 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {client ? "Editar Cliente" : "Novo Cliente"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>CPF *</Label>
            <Input
              value={formData.cpf}
              placeholder="000.000.000-00"
              onChange={(e) =>
                setFormData({ ...formData, cpf: formatCPF(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              value={formData.telefone}
              placeholder="(00) 00000-0000"
              onChange={(e) =>
                setFormData({ ...formData, telefone: formatTelefone(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              value={formData.endereco ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, endereco: e.target.value })
              }
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Data de nascimento</Label>
            <Input
              type="date"
              value={(formData.dataNascimento ?? "").slice(0, 10)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dataNascimento: e.target.value,
                })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-gold"
            >
              {client ? "Atualizar" : "Cadastrar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ClientSheet;