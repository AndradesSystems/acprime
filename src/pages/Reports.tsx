import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";

const Reports = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("contracts");

  // Mock data
  const summaryData = {
    totalContracts: 45,
    totalReceivable: 125000,
    totalReceived: 87500,
    activeClients: 38,
    overdueContracts: 7,
  };

  const contractsData = [
    { id: "1", client: "João Silva", value: 5000, interest: 250, status: "Ativo", dueDate: "2024-03-15" },
    { id: "2", client: "Maria Santos", value: 3000, interest: 150, status: "Ativo", dueDate: "2024-03-20" },
    { id: "3", client: "Pedro Costa", value: 8000, interest: 400, status: "Quitado", dueDate: "2024-03-10" },
  ];

  const expensesData = [
    { id: "1", description: "Aluguel", category: "Fixo", value: 2000, date: "2024-03-01" },
    { id: "2", description: "Energia", category: "Variável", value: 350, date: "2024-03-05" },
    { id: "3", description: "Internet", category: "Fixo", value: 150, date: "2024-03-01" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "text-emerald-400";
      case "Quitado":
        return "text-blue-400";
      case "Atrasado":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-card-dark border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">Contratos</SelectItem>
                <SelectItem value="expenses">Gastos</SelectItem>
                <SelectItem value="clients">Clientes</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-premium hover:bg-premium/90">
              <FileText className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 bg-card-dark border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-premium/20 rounded-lg">
              <FileText className="h-5 w-5 text-premium" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Contratos</p>
              <p className="text-2xl font-bold text-foreground">{summaryData.totalContracts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card-dark border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Receber</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summaryData.totalReceivable)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card-dark border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summaryData.totalReceived)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card-dark border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              <p className="text-2xl font-bold text-foreground">{summaryData.activeClients}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card-dark border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contratos Atrasados</p>
              <p className="text-2xl font-bold text-foreground">{summaryData.overdueContracts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="p-6 bg-card-dark border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {reportType === "contracts" && "Detalhamento de Contratos"}
          {reportType === "expenses" && "Detalhamento de Gastos"}
          {reportType === "clients" && "Detalhamento de Clientes"}
          {reportType === "financial" && "Análise Financeira"}
        </h2>

        {reportType === "contracts" && (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="border-border hover:bg-secondary">
                  <TableHead className="text-premium font-semibold">Cliente</TableHead>
                  <TableHead className="text-premium font-semibold">Valor Principal</TableHead>
                  <TableHead className="text-premium font-semibold">Juros</TableHead>
                  <TableHead className="text-premium font-semibold">Status</TableHead>
                  <TableHead className="text-premium font-semibold">Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractsData.map((contract) => (
                  <TableRow key={contract.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{contract.client}</TableCell>
                    <TableCell className="text-foreground">{formatCurrency(contract.value)}</TableCell>
                    <TableCell className="text-premium">{formatCurrency(contract.interest)}</TableCell>
                    <TableCell className={getStatusColor(contract.status)}>{contract.status}</TableCell>
                    <TableCell className="text-foreground">{contract.dueDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {reportType === "expenses" && (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="border-border hover:bg-secondary">
                  <TableHead className="text-premium font-semibold">Descrição</TableHead>
                  <TableHead className="text-premium font-semibold">Categoria</TableHead>
                  <TableHead className="text-premium font-semibold">Valor</TableHead>
                  <TableHead className="text-premium font-semibold">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesData.map((expense) => (
                  <TableRow key={expense.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{expense.description}</TableCell>
                    <TableCell className="text-foreground">{expense.category}</TableCell>
                    <TableCell className="text-red-400">{formatCurrency(expense.value)}</TableCell>
                    <TableCell className="text-foreground">{expense.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {(reportType === "clients" || reportType === "financial") && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione o período e clique em "Gerar Relatório" para visualizar os dados</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Reports;
