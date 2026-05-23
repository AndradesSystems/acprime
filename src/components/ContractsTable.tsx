"use client";

import React, { useState, memo } from "react";
import {
  Search,
  FileText,
  Loader2,
  CalendarClock,
  MessageSquareShare,
  History,
  CreditCard,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Contract } from "@/services/contracts";

interface ContractsTableProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  isLoading: boolean;
  contracts: Contract[];
  // 🟢 Ajustado: Agora onNotify recebe o contrato inteiro para extrairmos os novos parâmetros
  onNotify: (contract: Contract) => void; 
  isNotifying: boolean;
  onDelete: (id: string) => void;
  onSelectContract: (c: Contract) => void;
  onHistoryContract: (c: Contract) => void;
  onDueDateContract: (c: Contract) => void;
  formatCurrency: (v: number | string) => string;
  formatDate: (d: string) => string;
  getBadge: (type: string) => { label: string; className: string };
}

const ContractsTable = memo(
  ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isLoading,
    contracts,
    onNotify,
    isNotifying,
    onDelete,
    onSelectContract,
    onHistoryContract,
    onDueDateContract,
    formatCurrency,
    formatDate,
    getBadge,
  }: ContractsTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(contracts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = contracts.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
    };

    React.useEffect(() => {
      setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    return (
      <Card className="p-4 md:p-6 bg-card/50 border-white/10 backdrop-blur-md">
        {/* HEADER & FILTROS */}
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2 font-premium">
            <FileText className="w-5 h-5 text-gold" /> Contratos no Período
          </h2>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-10 bg-white/5 border-white/10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ABERTO">Aberto</SelectItem>
                <SelectItem value="ATRASADO">Atrasado</SelectItem>
                <SelectItem value="COBRANCA_PESSOAL">Cobrança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* VIEW DESKTOP: TABELA PADRÃO */}
        <div className="hidden md:block rounded-md border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Cliente / Tipo</TableHead>
                <TableHead>Principal / Aberto</TableHead>
                <TableHead>Juros %</TableHead>
                <TableHead>Taxa (Atraso)</TableHead>
                <TableHead>Próx. Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : currentItems.map((c) => (
                <DesktopRow
                  key={c.id}
                  c={c}
                  {...{ getBadge, formatCurrency, formatDate, onDueDateContract, onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* VIEW MOBILE: LISTA DE CARDS */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : currentItems.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">Nenhum contrato encontrado.</p>
          ) : (
            currentItems.map((c) => (
              <MobileCard
                key={c.id}
                c={c}
                {...{ getBadge, formatCurrency, formatDate, onDueDateContract, onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }}
              />
            ))
          )}
        </div>

        {/* PAGINAÇÃO RESPONSIVA */}
        {!isLoading && contracts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 px-2">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Mostrando <span className="text-white font-medium">{startIndex + 1}</span>-
              <span className="text-white font-medium">
                {Math.min(startIndex + itemsPerPage, contracts.length)}
              </span> de <span className="text-white font-medium">{contracts.length}</span>
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white disabled:opacity-30 flex-1 sm:flex-none"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Anterior</span>
              </Button>

              <span className="text-xs text-white/70 px-2">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white disabled:opacity-30 flex-1 sm:flex-none"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="hidden sm:inline">Próximo</span> <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  },
);

/* COMPONENTS AUXILIARES PARA LIMPEZA DE CÓDIGO */

const DesktopRow = ({ c, getBadge, formatCurrency, formatDate, onDueDateContract, onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }: any) => {
  const badge = getBadge(c.periodicity);
  return (
    <TableRow className="border-white/5 hover:bg-white/5 transition-colors">
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium text-white italic">{c.client?.nome}</span>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit border ${badge.className}`}>{badge.label}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-gray-300">Orig: {formatCurrency(c.valorPrincipal)}</span>
          {Number(c.valorEmAberto) !== Number(c.valorPrincipal) && (
            <span className="text-xs text-yellow-500 font-mono">Restam: {formatCurrency(c.valorEmAberto)}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-gray-300">{Number(c.jurosPercent)}%</TableCell>
      <TableCell className="text-blue-400 font-medium">
        {Number(c.taxa) > 0 ? <span className="text-red-400">{formatCurrency(c.taxa)}</span> : <span className="text-gray-600">—</span>}
      </TableCell>
      <TableCell>
        <button onClick={() => onDueDateContract(c)} className="flex items-center gap-1 hover:bg-white/10 p-1.5 rounded transition text-sm">
          <CalendarClock className="w-3 h-3 text-muted-foreground" />
          {formatDate(c.vencimentoEm)}
        </button>
      </TableCell>
      <TableCell className="text-right">
        <ActionButtons c={c} {...{ onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }} />
      </TableCell>
    </TableRow>
  );
};

const MobileCard = ({ c, getBadge, formatCurrency, formatDate, onDueDateContract, onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }: any) => {
  const badge = getBadge(c.periodicity);
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-bold italic">{c.client?.nome}</h3>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>{badge.label}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase">Em Aberto</p>
          <p className="text-yellow-500 font-mono font-bold">{formatCurrency(c.valorEmAberto)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm border-y border-white/5 py-2">
        <div>
          <p className="text-gray-400 text-[10px]">PRINCIPAL</p>
          <p className="text-gray-200">{formatCurrency(c.valorPrincipal)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px]">VENCIMENTO</p>
          <button onClick={() => onDueDateContract(c)} className="text-blue-400 flex items-center gap-1">
            <CalendarClock className="w-3 h-3" /> {formatDate(c.vencimentoEm)}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <div className="flex gap-2 text-xs">
          <span className="text-gray-400">Juros: {c.jurosPercent}%</span>
          {Number(c.taxa) > 0 && <span className="text-red-400">Taxa: {formatCurrency(c.taxa)}</span>}
        </div>
        <ActionButtons c={c} {...{ onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }} />
      </div>
    </div>
  );
};

const ActionButtons = ({ c, onNotify, isNotifying, onHistoryContract, onSelectContract, onDelete }: any) => (
  <div className="flex items-center justify-end gap-1">
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" disabled={isNotifying}>
          {isNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquareShare className="w-4 h-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#071e30] border-white/10 text-white w-[95vw] max-w-md rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Notificar Cliente?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Enviar mensagem para <strong>{c.client?.nome}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 mt-4">
          <AlertDialogCancel className="flex-1 bg-white/5 border-none mt-0">Voltar</AlertDialogCancel>
          {/* 🟢 Ajustado: Agora passamos o objeto "c" inteiro na execução do onClick */}
          <AlertDialogAction className="flex-1 bg-green-600" onClick={() => onNotify(c)}>Enviar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Button variant="ghost" size="icon" className="h-8 w-8 text-gold" disabled={c.status === "QUITADO"} onClick={() => onSelectContract(c)}>
      <CreditCard className="w-4 h-4" />
    </Button>

    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="w-4 h-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#071e30] border-white/10 text-white w-[95vw] max-w-md rounded-lg">
        <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel className="flex-1 bg-white/5 border-none mt-0">Não</AlertDialogCancel>
          <AlertDialogAction className="flex-1 bg-red-600" onClick={() => onDelete(c.id)}>Sim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);

ContractsTable.displayName = "ContractsTable";
export default ContractsTable;