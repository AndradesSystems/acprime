import { ReactNode, useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  Wallet,
  AlertTriangle,
  ShieldAlert,
  Database,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const [isAdmin, setIsAdmin] = useState(false);

  // Estados de controle de plano e modal
  const [userPlan, setUserPlan] = useState<"VAZIO" | "STARTER" | "PRO">("VAZIO");
  const [tempoRestanteMsg, setTempoRestanteMsg] = useState("");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
      return;
    }
    setIsAdmin(authService.isAdmin());

    const user = authService.getUserData();

    if (user) {
      setUserPlan(user.plan || "VAZIO");

      if (user.vencimento) {
        const calcularTempo = () => {
          const agora = new Date().getTime();
          const fim = new Date(user.vencimento!).getTime();
          const diferenca = fim - agora;

          if (diferenca <= 0) {
            setTempoRestanteMsg("Seu período de testes expirou!");
            setIsExpired(true);
            setIsPlanModalOpen(true);
            return true;
          }

          const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
          const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
          const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

          if (dias > 0) {
            setTempoRestanteMsg(`Resta(m) ${dias}d ${horas}h ${minutos}m ${segundos}s de teste.`);
          } else {
            setTempoRestanteMsg(`Restam ${horas}h ${minutos}m ${segundos}s de teste.`);
          }
          return false;
        };

        const jaVenceu = calcularTempo();
        if (!jaVenceu) {
          const interval = setInterval(() => {
            const mudouParaVencido = calcularTempo();
            if (mudouParaVencido) {
              clearInterval(interval);
            }
          }, 1000);
          return () => clearInterval(interval);
        }
      } else {
        setTempoRestanteMsg("Período de teste active.");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");
    const to = params.get("to");
    return from && to ? `?from=${from}&to=${to}` : "";
  }, [location.search]);

  const menuItems = useMemo(() => {
    const items = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", adminOnly: false, requiresPlan: false },
      { icon: Receipt, label: "Gastos", path: "/expenses", adminOnly: false, requiresPlan: false },
      { icon: CreditCard, label: "Assinantes", path: "/subscriptions", adminOnly: true, requiresPlan: false },
      { icon: FileText, label: "Contratos", path: "/contracts", adminOnly: false, requiresPlan: false },
      { icon: Users, label: "Clientes", path: "/clients", adminOnly: false, requiresPlan: false },
      { icon: AlertTriangle, label: "Inadimplentes", path: "/inadimplentes", adminOnly: false, requiresPlan: true },
      { icon: ShieldAlert, label: "Score de Crédito", path: "/score", adminOnly: false, requiresPlan: true },
      // { icon: ShieldAlert, label: "Negociação", path: "/negociacoes", adminOnly: false, requiresPlan: true },
      { icon: Wallet, label: "Caixa", path: "/balance", adminOnly: false, requiresPlan: false },
      
      { icon: Database, label: "Backup", path: "/backup", adminOnly: true, requiresPlan: true },
    ];

    return items.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  const navigateWithRange = (path: string) => {
    const targetItem = menuItems.find(item => item.path === path);
    if (targetItem?.requiresPlan && userPlan === "VAZIO") {
      setIsPlanModalOpen(true);
      return;
    }
    navigate(`${path}${currentQuery}`);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const handleWhatsAppRedirect = (planoSelecionado: "Starter" | "PRO Premium") => {
    const user = authService.getUserData();
    const telefoneSuporte = "5571992445546";

    const nomeUsuario = user?.nome || "Não informado";
    const emailUsuario = user?.email || "Não informado";
    const idUsuario = user?.id || "Não informado";

    const mensagem = `Olá! Gostaria de assinar um plano no Gestão Premium.
  
*Plano Escolhido:* ${planoSelecionado}
*Nome:* ${nomeUsuario}
*E-mail:* ${emailUsuario}
*ID do Usuário:* ${idUsuario}`;

    const mensagemCodificada = encodeURIComponent(mensagem);
    window.open(`https://api.whatsapp.com/send?phone=${telefoneSuporte}&text=${mensagemCodificada}`, "_blank");
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden relative">

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-white/5 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-10 rounded-full" alt="Logo" />
          <span className="font-bold text-white text-sm">Gestão Premium</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
          <Menu className="w-6 h-6 text-white" />
        </Button>
      </header>

      {/* BACKDROP DO MENU */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={cn(
          "bg-[#0f172a] border-r border-white/5 transition-all duration-300 flex flex-col h-full",
          "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:w-20 w-72"
        )}
      >
        {/* LOGO AREA */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          {(isSidebarOpen || window.innerWidth < 768) && (
            <h2 className="flex gap-3 items-center text-xl font-bold bg-gradient-gold bg-clip-text text-transparent truncate">
              <img src="/logo.png" className="w-14 rounded-lg" alt="" />
              <span className="text-white">Premium</span>
            </h2>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <span className="md:hidden"><X className="w-5 h-5" /></span>
            <span className="hidden md:block"><Menu className="w-5 h-5" /></span>
          </Button>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isInadimplentes = item.path === "/inadimplentes";
            
            const isBlocked = isExpired || (item.requiresPlan && userPlan === "VAZIO");

            return (
              <button
                key={item.path}
                disabled={isBlocked}
                onClick={() => navigateWithRange(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                  isActive && !isBlocked
                    ? isInadimplentes
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : isInadimplentes
                      ? "text-zinc-400 hover:text-red-400 hover:bg-red-500/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/5",
                  isBlocked && "opacity-35 cursor-not-allowed hover:bg-transparent text-zinc-600"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive && !isBlocked
                      ? "text-white"
                      : isInadimplentes
                        ? "group-hover:text-red-400"
                        : "group-hover:text-white",
                    isBlocked && "text-zinc-600 group-hover:text-zinc-600"
                  )}
                />
                <span className={cn(
                  "whitespace-nowrap transition-opacity duration-300 font-medium",
                  !isSidebarOpen && "md:opacity-0 md:hidden"
                )}>
                  {item.label}
                </span>

                {item.requiresPlan && userPlan === "VAZIO" && isSidebarOpen && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                    Plano
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-white/5 mt-auto bg-[#0f172a]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors",
              !isSidebarOpen && "md:justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn("whitespace-nowrap font-medium", !isSidebarOpen && "md:hidden")}>
              Sair da conta
            </span>
          </Button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0">

        {/* 🔴 TOP-BAR CONDICIONAL: SÓ COMPILA E EXIBE SE NÃO FOR PLANO PRO */}
        {userPlan !== "PRO" && (
          <div className={cn(
            "w-full px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-b text-sm font-medium shrink-0 transition-all",
            isExpired ? "bg-red-500/10 border-red-500/20 text-red-400" :
            userPlan === "VAZIO" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
            "bg-blue-500/10 border-blue-500/20 text-blue-400"
          )}>
            <div className="flex items-center gap-2 text-center sm:text-left">
              {isExpired ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                  <span>
                    {isAdmin ? "🔧 [VISÃO ADMIN] - " : ""}Seu período de avaliação <strong>expirou</strong>! Escolha um plano abaixo para liberar sua infraestrutura.
                  </span>
                </>
              ) : userPlan === "VAZIO" ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>
                    {isAdmin ? "🔧 [VISÃO ADMIN] - " : ""}Sua assinatura começa agora! Você tem <strong>2 dias gratuitos</strong> de teste. <span className="font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 ml-1">{tempoRestanteMsg}</span>
                  </span>
                </>
              ) : (
                /* PLANO STARTER ATIVO */
                <>
                  <AlertTriangle className="w-4 h-4 text-blue-400" />
                  <span>
                    {isAdmin ? "🔧 [VISÃO ADMIN] - " : ""}Sua assinatura começou! Você está no <strong>Plano Starter</strong>. <span className="font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 ml-1">{tempoRestanteMsg}</span>
                  </span>
                </>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setIsPlanModalOpen(true)}
              className={cn(
                "shrink-0 font-semibold shadow-sm transition-all duration-200 active:scale-95",
                isExpired 
                  ? "bg-red-600 text-white hover:bg-red-500 shadow-red-600/10"
                  : userPlan === "VAZIO"
                    ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-500/10"
                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/10"
              )}
            >
              {isExpired ? "Regularizar Conta" : userPlan === "VAZIO" ? "Escolher um Plano" : "Fazer Upgrade para o PRO"}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-zinc-950">
          {children}
        </div>
      </main>

      {/* MODAL BLOQUEIO TELA CHEIA */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-xl flex flex-col justify-center items-center p-6 overflow-y-auto animate-in fade-in duration-300">

          {!isExpired ? (
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="absolute top-6 right-6 text-red-400 hover:text-red-300 flex items-center gap-2 bg-red-500/5 hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" /> Alternar de Conta
            </button>
          )}

          <div className="text-center max-w-xl mb-10">
            {isExpired && (
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-widest inline-block mb-4 animate-pulse">
                Acesso Suspenso
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              {isExpired ? "Sua avaliação chegou ao fim" : "Escolha o plano ideal para o seu negócio"}
            </h2>
            <p className="text-zinc-400 text-sm md:text-base">
              {isExpired 
                ? "Para continuar utilizando o painel e reativar seus contratos cadastrados, escolha uma das opções de licenciamento abaixo."
                : "Desbloqueie o potencial máximo da plataforma Gestão Premium e tenha o controle absoluto das suas cobranças."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full items-stretch">
            {/* CARD PLANO STARTER */}
            <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Plano Starter</h3>
                    <p className="text-zinc-400 text-sm mt-1">Sua infraestrutura essencial</p>
                  </div>
                  {userPlan === "STARTER" && !isExpired && (
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-medium">
                      Seu plano atual
                    </span>
                  )}
                </div>
                <div className="my-6">
                  <span className="text-4xl font-black text-white">R$ 49</span>
                  <span className="text-zinc-400 text-sm"> /mês</span>
                </div>
                <hr className="border-white/5 my-6" />
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Contratos <strong>ILIMITADOS</strong></span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Painel de Controle e Dashboard</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Controle de Gastos e Caixa</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Painel de Clientes Inadimplentes</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Rotinas e Cópias de <strong>Backup</strong></span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => handleWhatsAppRedirect("Starter")}
                className="w-full mt-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold py-6"
              >
                Assinar Plano Starter
              </Button>
            </div>

            {/* CARD PLANO PRO PREMIUM */}
            <div className="bg-[#0f172a] border-2 border-primary/40 shadow-2xl shadow-primary/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group hover:border-primary transition-all">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" /> INTELIGÊNCIA TOTAL
              </div>
              <div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Plano Pro Premium
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1">Automatizado e inteligente</p>
                </div>
                <div className="my-6">
                  <span className="text-4xl font-black text-white">R$ 99</span>
                  <span className="text-zinc-400 text-sm"> /mês</span>
                </div>
                <hr className="border-white/5 my-6" />
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-zinc-100 text-sm font-semibold">
                    <Sparkles className="w-5 h-5 text-primary shrink-0" />
                    <span>Tudo do Starter + Recursos Avançados:</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span><strong>Dashboard Inteligente</strong> de alta performance</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <MessageSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Integração e Alertas via <strong>WhatsApp</strong></span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                    <span><strong>Relatórios todo dia 1</strong> direto no WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Módulo de Exportação de Dados Avançado</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Consulta de <strong>Score de Crédito por CPF</strong></span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-300 text-sm">
                    <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Notificação automatizada de inadimplência</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => handleWhatsAppRedirect("PRO Premium")}
                className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-bold py-6"
              >
                Garantir Acesso Completo
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Layout;