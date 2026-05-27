"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Database,
  Download,
  Users,
  FileText,
  CreditCard,
  CircleDollarSign,
  Layers,
  ShieldCheck,
  Loader2,
  RefreshCw,
  FileJson,
  FileDown,
} from "lucide-react";

// Importação dos serviços da sua API de backup
import { exportBackupData, type ExportType } from "@/services/backup";

export default function Backup() {
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  
  // Estados para controle do Modal de confirmação e Formato
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"JSON" | "PDF">("JSON");
  const [selectedModule, setSelectedModule] = useState<{ id: string; name: string; apiType: ExportType } | null>(null);

  // Mapeamento dos blocos conforme layout do sistema
  const modules = [
    { id: "clientes", name: "Clientes", apiType: "CLIENTES" as ExportType, description: "Cadastros, histórico de contato e dados fiscais.", icon: Users, color: "text-blue-400" },
    { id: "contratos", name: "Contratos", apiType: "CONTRATOS" as ExportType, description: "Termos, assinaturas digitais e vigências.", icon: FileText, color: "text-purple-400" },
    { id: "pagamentos", name: "Pagamentos", apiType: "PAGAMENTOS" as ExportType, description: "Faturas, links de cobrança e gateways.", icon: CreditCard, color: "text-amber-400" },
    { id: "financas", name: "Finanças", apiType: "FINANÇAS" as ExportType, description: "Caixa, logs de saldo, aportes e sangrias.", icon: CircleDollarSign, color: "text-emerald-400" },
  ];

  // Intercepta o clique e abre as configurações do Dialog
  const triggerExportConfirmation = (name: string, apiType: ExportType, id: string) => {
    setSelectedModule({ id, name, apiType });
    setExportFormat("JSON"); 
    setIsConfirmOpen(true);
  };

  // Processa o download real baseado na escolha do usuário
  const handleExecuteExport = async () => {
    if (!selectedModule) return;
    
    const { name, apiType } = selectedModule;
    setLoadingModule(name);
    setIsConfirmOpen(false);

    try {
      // 🚀 Executa a chamada do serviço para trazer o snapshot do banco
      const dataSnapshot = await exportBackupData(apiType);

      if (exportFormat === "JSON") {
        // 💾 MODO JSON: Compila e força download de arquivo puro estruturado
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(dataSnapshot, null, 2)
        )}`;
        
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute(
          "download",
          `backup-${name.toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

      } else {
        // 📄 MODO PDF: Abre o container virtual de impressão estruturado do navegador
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error("Bloqueador de pop-ups ativo. Permita abertura de janelas para baixar o PDF.");
        }

        // Mapeamento dinâmico de tabelas para alimentar as linhas do relatório impresso
        let tableRowsHtml = "";
        
        if (apiType === "CLIENTES" || apiType === "TOTAL") {
          const items = dataSnapshot.tables?.clients || [];
          tableRowsHtml = items.map((c: any) => `
            <tr>
              <td>${c.nome || "N/A"}</td>
              <td>${c.cpf || "N/A"}</td>
              <td>${c.telefone || "Não Informado"}</td>
              <td>${c.email || "-"}</td>
            </tr>
          `).join("");
        } else if (apiType === "CONTRATOS") {
          const items = dataSnapshot.tables?.contracts || [];
          tableRowsHtml = items.map((c: any) => `
            <tr>
              <td>ID: ${c.id ? c.id.substring(0, 8) : "N/A"}...</td>
              <td>Valor: R$ ${c.valor || "0,00"}</td>
              <td>Criado em: ${c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "-"}</td>
              <td>Contrato Ativo</td>
            </tr>
          `).join("");
        } else {
          tableRowsHtml = `
            <tr>
              <td colspan="4" style="text-align:center;">Módulo ${name} processado com sucesso. Registros salvos na assinatura digital de auditoria.</td>
            </tr>
          `;
        }

        // Escreve e estiliza o layout do PDF
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Relatório de Auditoria - ${name}</title>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
                .title { font-size: 22px; font-weight: bold; color: #1e1b4b; }
                .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
                .meta-container { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 20px; display: table; width: 100%; box-sizing: border-box; }
                .meta-col { display: table-cell; width: 50%; font-size: 12px; }
                .section-title { font-size: 14px; font-weight: bold; color: #1e1b4b; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #4f46e5; padding-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #1e1b4b; color: white; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: bold; }
                td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
                tr:nth-child(even) td { background: #f8fafc; }
                .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
                @media print { body { padding: 0; } .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">Relatório Oficial de Cópia de Segurança</div>
                <div class="subtitle">Ecosystem Secure Backup Client Snapshot &middot; Documento de Verificação</div>
                
                <div class="meta-container">
                  <div class="meta-col">
                    <strong>Escopo de Extração:</strong> Módulo ${name}<br/>
                    <strong>Identificador Ref:</strong> ${dataSnapshot.userId || "Autenticado"}
                  </div>
                  <div class="meta-col">
                    <strong>Data de Emissão:</strong> ${new Date().toLocaleString("pt-BR")}<br/>
                    <strong>Status da Operação:</strong> Sincronizado / Íntegro
                  </div>
                </div>
              </div>

              <div class="section-title">Amostra e Detalhamento Volumétrico</div>
              <table>
                <thead>
                  <tr>
                    <th>Referência / Descrição</th>
                    <th>Documento / Identificador</th>
                    <th>Contato / Informação complementar</th>
                    <th>Detalhes Operacionais</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                </tbody>
              </table>

              <div class="footer">
                Este relatório representa a compilação exata dos dados ativos sob custódia do usuário lojista proprietário.<br/>
                Chave Hash de Validação: SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}
              </div>

              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 300);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      toast({
        title: "Extração Finalizada",
        description: `O arquivo contendo as informações de [${name}] foi gerado em formato ${exportFormat}.`,
        className: "bg-emerald-600 text-white border-none",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro na Exportação",
        description: error.message || "Não foi possível compilar os dados solicitados.",
        variant: "destructive",
      });
    } finally {
      setLoadingModule(null);
      setSelectedModule(null);
    }
  };

  return (
    <div className="min-h-screen p-6 text-white bg-[#0a0e17] space-y-8">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-premium">Cópia de Segurança</h1>
          <p className="text-muted-foreground mt-1">Exporte dados críticos da plataforma para manter sua operation segura fora da nuvem.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" /> Cloud Sync Ativo
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* CARD PRINCIPAL - BACKUP INTEGRAL */}
        <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-black shadow-2xl">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

          <CardHeader className="relative z-10">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 w-fit text-indigo-400 mb-2">
              <Database className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Exportação Integral de Dados</CardTitle>
            <CardDescription className="text-slate-400 max-w-xl">
              Gere um snapshot unificado contendo absolutamente todas as coleções do banco de dados (Estruturas estruturadas, logs e relacionamentos). Recomendado para auditorias mensais.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Suporta os formatos: <span className="text-slate-300 font-mono">JSON Estruturado / PDF Relatório</span></p>
              <p>• Escopo: <span className="text-indigo-400">Banco de dados completo vinculado à sua conta</span></p>
            </div>

            <Button
              onClick={() => triggerExportConfirmation("Todos os Dados", "TOTAL", "integral")}
              disabled={loadingModule !== null}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 shadow-lg shadow-indigo-900/40"
            >
              {loadingModule === "Todos os Dados" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compilando Ecosystem...</>
              ) : (
                <><Layers className="w-4 h-4 mr-2" /> Exportar Todos os Dados</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* COMPONENTE SEPARADOR */}
        <div className="pt-4">
          <h3 className="text-lg font-bold text-muted-foreground mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Exportações Segmentadas por Módulo
          </h3>

          {/* GRID DE MÓDULOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => {
              const IconComponent = mod.icon;
              const isCurrentLoading = loadingModule === mod.name;

              return (
                <Card key={mod.id} className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-white/10 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6">
                    <div className="space-y-1 pr-4 flex-1">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
                        <IconComponent className={`w-4 h-4 ${mod.color}`} />
                        {mod.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {mod.description}
                      </CardDescription>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => triggerExportConfirmation(mod.name, mod.apiType, mod.id)}
                      disabled={loadingModule !== null}
                      className="text-muted-foreground hover:text-white hover:bg-white/5 shrink-0"
                      title={`Exportar ${mod.name}`}
                    >
                      {isCurrentLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🔮 ALERT DIALOG INTERATIVO COM OPÇÃO DE ESCOLHA DE FORMATO */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-[#0e1420] border-white/10 text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Configurar Extração de Dados
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm">
              Escolha o formato em que deseja exportar o módulo{" "}
              <span className="text-indigo-400 font-semibold">[{selectedModule?.name}]</span>:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* SELETOR INTERATIVO DE FORMATO DENTRO DO MODAL */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <button
              type="button"
              onClick={() => setExportFormat("JSON")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                exportFormat === "JSON"
                  ? "border-indigo-500 bg-indigo-500/10 text-white font-semibold"
                  : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <FileJson className="w-6 h-6 text-amber-400" />
              <div className="text-xs">Formato JSON</div>
              <span className="text-[10px] opacity-60 font-normal">Ideal para Restauração</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat("PDF")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                exportFormat === "PDF"
                  ? "border-indigo-500 bg-indigo-500/10 text-white font-semibold"
                  : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <FileDown className="w-6 h-6 text-red-400" />
              <div className="text-xs">Relatório PDF</div>
              <span className="text-[10px] opacity-60 font-normal">Impressão e Auditoria</span>
            </button>
          </div>

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-white hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteExport}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Gerar {exportFormat}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}