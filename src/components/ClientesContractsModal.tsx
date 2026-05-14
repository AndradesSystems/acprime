import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  DollarSign,
  Calendar,
  Percent,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  getContractsByClient,
  getContractById,
  type Contract,
} from "@/services/contracts";

type Props = {
  open: boolean;
  clientId: string | null;
  clientName?: string;
  onClose: () => void;
};


const formatMoney = (v?: string | number) =>
  v ? `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-";

const calcTotalReceber = (principal: string, juros: string) => {
  const p = Number(principal);
  const j = Number(juros);
  return p + p * (j / 100);
};

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`text-2xl font-semibold mt-2 ${color}`}>
        {value}
      </div>
    </Card>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-1 rounded-md bg-zinc-800 text-xs">
      <span className="text-zinc-400">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}


function ContractDetailsView({ contract }: { contract: Contract }) {
  const totalReceber = calcTotalReceber(
    contract.valorPrincipal,
    contract.jurosPercent
  );

  return (
    <div className="space-y-6">
      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat
          icon={<DollarSign />}
          label="Valor Emprestado"
          value={formatMoney(contract.valorPrincipal)}
          color="text-emerald-400"
        />
        <Stat
          icon={<Percent />}
          label="Taxa de Juros"
          value={`${contract.jurosPercent}%`}
          color="text-yellow-400"
        />
        <Stat
          icon={<DollarSign />}
          label="Total a Receber"
          value={formatMoney(totalReceber)}
          color="text-sky-400"
        />
        <Stat
          icon={<Calendar />}
          label="Vencimento"
          value={new Date(contract.vencimentoEm!).toLocaleDateString("pt-BR")}
          color="text-purple-400"
        />
      </div>

      {/* INFO */}
      <Card className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="grid md:grid-cols-2 gap-3">
          <InfoRow label="Status" value={contract.status} />
          <InfoRow label="Periodicidade" value={contract.periodicity} />
          <InfoRow label="Criado em" value={new Date(contract.createdAt!).toLocaleString("pt-BR")} />
          <InfoRow label="Atualizado em" value={new Date(contract.updatedAt!).toLocaleString("pt-BR")} />
        </div>
      </Card>
    </div>
  );
}


export default function ClientContractsModal({
  open,
  clientId,
  clientName,
  onClose,
}: Props) {
  const [selectedContractId, setSelectedContractId] =
    useState<string | null>(null);

  const handleClose = () => {
    setSelectedContractId(null);
    onClose();
  };

  const contractsQuery = useQuery({
    queryKey: ["client-contracts", clientId],
    queryFn: () => getContractsByClient(clientId!),
    enabled: open && !!clientId,
  });

  const contracts = useMemo(
    () => contractsQuery.data ?? [],
    [contractsQuery.data]
  );

  const contractDetailsQuery = useQuery({
    queryKey: ["contract-details", selectedContractId],
    queryFn: () => getContractById(selectedContractId!),
    enabled: open && !!selectedContractId,
  });

  const isListView = !selectedContractId;

  useEffect(() => {
    if (contractsQuery.isError) {
      toast({
        title: "Erro ao carregar contratos",
        variant: "destructive",
      });
    }
  }, [contractsQuery.isError]);

  useEffect(() => {
    if (contractDetailsQuery.isError) {
      toast({
        title: "Erro ao carregar detalhes do contrato",
        variant: "destructive",
      });
    }
  }, [contractDetailsQuery.isError]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="max-w-5xl bg-zinc-950 border border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">
              {isListView ? "Contratos do Cliente" : "Detalhes do Contrato"}
            </DialogTitle>

            
          </div>

          <p className="text-sm text-muted-foreground">
            {clientName
              ? `Cliente: ${clientName}`
              : clientId
              ? `Cliente ID: ${clientId}`
              : ""}
          </p>
        </DialogHeader>

        {/* ================= LISTA ================= */}
        {isListView && (
          <div className="space-y-4 mt-4">
            {contractsQuery.isLoading ? (
              <div className="text-muted-foreground">
                Carregando contratos...
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-muted-foreground">
                Nenhum contrato encontrado.
              </div>
            ) : (
              contracts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContractId(c.id)}
                  className="w-full text-left"
                >
                  <Card className="p-5 bg-zinc-900 border border-zinc-800 hover:border-primary/60 transition rounded-xl">
                    <div className="flex justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            Contrato #{c.id.slice(-6)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge label="Vencimento" value={new Date(c.vencimentoEm).toLocaleDateString("pt-BR")} />
                          <Badge label="Juros" value={`${c.jurosPercent}%`} />
                          <Badge label="Status" value={c.status} />
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-emerald-400 font-semibold">
                          {formatMoney(c.valorPrincipal)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Valor emprestado
                        </div>
                        <div className="text-sm text-red-400">
                          Em aberto: {formatMoney(calcTotalReceber(c.valorEmAberto, c.jurosPercent))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </button>
              ))
            )}
          </div>
        )}

        {/* ================= DETALHES ================= */}
        {!isListView && (
          <div className="space-y-5 mt-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedContractId(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <Button
                variant="outline"
                onClick={() => contractDetailsQuery.refetch()}
                disabled={contractDetailsQuery.isFetching}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {contractDetailsQuery.isLoading ? (
              <div className="text-muted-foreground">
                Carregando detalhes...
              </div>
            ) : (
              contractDetailsQuery.data && (
                <ContractDetailsView
                  contract={contractDetailsQuery.data}
                />
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
