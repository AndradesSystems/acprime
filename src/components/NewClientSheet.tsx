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
   TYPES
======================= */

type ClientSheetProps = {
  triggerLabel?: string;
  classButton?: string;
  client?: Client | null;
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
    endereco: "", // ✅ NOVO
  });

  /* =======================
     EFFECT
  ======================= */

  useEffect(() => {
    if (client) {
      setFormData({
        nome: client.nome ?? "",
        cpf: client.cpf ?? "",
        telefone: client.telefone ?? "",
        email: client.email ?? "",
        dataNascimento: client.dataNascimento ?? "",
        endereco: client.endereco ?? "", // ✅ NOVO
      });
      setIsOpen(true);
    }
  }, [client]);

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      dataNascimento: "",
      endereco: "", // ✅ NOVO
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
        cpf: formData.cpf.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email?.trim() ? formData.email.trim() : null,
        dataNascimento: formData.dataNascimento || null,
        endereco: formData.endereco?.trim() ? formData.endereco.trim() : null, // ✅ NOVO
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
              onChange={(e) =>
                setFormData({ ...formData, cpf: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              required
            />
          </div>

          {/* ✅ NOVO CAMPO ENDEREÇO */}
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
              onClick={resetForm}
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
