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
import { User, Upload, Eye, ImageIcon } from "lucide-react";
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
  // Remove tudo o que não for número
  const digits = value.replace(/\D/g, "");

  // --- REGRA PARA PORTUGAL (DDI 351 + 9 dígitos = 12 dígitos) ---
  // Exemplo: 351912345678 -> +351 912 345 678
  if (digits.startsWith("351") && digits.length === 12) {
    return digits
      .replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
  }
  
  // Se o usuário digitou um número de Portugal sem o DDI (apenas os 9 dígitos começando com 9)
  // Exemplo: 912345678 -> 912 345 678
  if (digits.length === 9 && (digits.startsWith("91") || digits.startsWith("92") || digits.startsWith("93") || digits.startsWith("96"))) {
    return digits
      .replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  }

  // --- REGRA PARA O BRASIL (DDD 71, etc.) ---
  // Fixo ou celular antigo (8 dígitos): (71) 3333-3333
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 14);
  }

  // Celular com 9 dígitos: (71) 99999-9999
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
  
  // Estado para gerenciar os arquivos locais selecionados
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // 🟢 Estado para armazenar os previews criados a partir dos arquivos locais
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  
  // 🟢 Estado para rastrear imagens antigas já salvas no banco
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);

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
      setSelectedFiles([]);
      setLocalPreviews([]);
      setSavedPhotos(client.images ?? []); // 🟢 Alimenta com as fotos já salvas no banco de dados
      setIsOpen(true);
    }
  }, [client]);

  // 🟢 Cria URLs de efeito colateral para preview dos arquivos locais selecionados pelo navegador
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setLocalPreviews([]);
      return;
    }

    const objectUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setLocalPreviews(objectUrls);

    // Evita vazamento de memória revogando as URLs antigas se o input mudar
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

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
    setSelectedFiles([]);
    setLocalPreviews([]);
    setSavedPhotos([]);
    setIsOpen(false);
  };

  // Captura a alteração do input de arquivos do navegador
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
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
        cpf: formData.cpf.replace(/\D/g, ""),
        telefone: formData.telefone.replace(/\D/g, ""),
        email: formData.email?.trim() ? formData.email.trim() : null,
        dataNascimento: formData.dataNascimento || null,
        endereco: formData.endereco?.trim() ? formData.endereco.trim() : null,
        documentos: selectedFiles.length > 0 ? selectedFiles : undefined,
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

          {/* Seleção de Fotos e Documentos (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="documentos" className="flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4 text-muted-foreground" />
              Documentos e Fotos do Cliente
            </Label>
            <Input
              id="documentos"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer file:text-primary file:font-medium"
            />
            
            {/* 🟢 SEÇÃO DE PREVIEW INTEGRADA */}
            {(savedPhotos.length > 0 || localPreviews.length > 0) && (
              <div className="border border-white/5 bg-black/20 rounded-lg p-3 mt-2 space-y-3">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-gold" /> Preview dos anexos:
                </p>
                
                <div className="grid grid-cols-4 gap-2">
                  {/* Renderiza fotos vindas do Servidor (Antigas) */}
                  {savedPhotos.map((url, idx) => (
                    <div 
                      key={`saved-${idx}`} 
                      className="group relative aspect-square border border-white/10 rounded overflow-hidden bg-zinc-900 cursor-pointer"
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      title="Ver imagem original"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Salva" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[8px] text-center text-white py-0.5 font-bold uppercase tracking-wider">
                        Salva
                      </span>
                    </div>
                  ))}

                  {/* Renderiza fotos Carregadas Localmente (Novas) */}
                  {localPreviews.map((url, idx) => (
                    <div 
                      key={`local-${idx}`} 
                      className="group relative aspect-square border border-gold/30 rounded overflow-hidden bg-zinc-900 cursor-pointer"
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      title="Ver preview ampliado"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-[8px] text-zinc-950 text-center py-0.5 font-bold uppercase tracking-wider">
                        Nova
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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