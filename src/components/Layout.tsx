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
  AlertTriangle, // 🔴 Importado para o ícone do Quadro de Caloteiros
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

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
      return;
    }
    setIsAdmin(authService.isAdmin());
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

  const navigateWithRange = (path: string) => {
    navigate(`${path}${currentQuery}`);
  };

  /* =========================================================
      MENU ITEMS FILTRADOS (COM CALOTEIROS INCLUÍDO)
  ========================================================= */
  const menuItems = useMemo(() => {
    const items = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", adminOnly: false },
      { icon: Receipt, label: "Gastos", path: "/expenses", adminOnly: false },
      { icon: CreditCard, label: "Assinantes", path: "/subscriptions", adminOnly: true }, // 🔒 Apenas Admin
      { icon: FileText, label: "Contratos", path: "/contracts", adminOnly: false },
      { icon: Users, label: "Clientes", path: "/clients", adminOnly: false },
      { icon: AlertTriangle, label: "Inadimplêntes", path: "/inadimplentes", adminOnly: false }, // 🔴 Nova Rota incluída aqui
      { icon: Wallet, label: "Caixa", path: "/balance", adminOnly: false },
    ];

    // Se não for admin, remove os itens que são "adminOnly"
    return items.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden relative">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0f172a] border-b border-white/5 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
           <img src="/logo.png" className="w-10 rounded-full" alt="Logo" />
           <span className="font-bold text-white text-sm">Gestão Premium</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6 text-white" />
        </Button>
      </header>

      {/* BACKDROP */}
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
            <span className="md:hidden">
              <X className="w-5 h-5" />
            </span>
            <span className="hidden md:block">
              <Menu className="w-5 h-5" />
            </span>
          </Button>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            // Destaque visual vermelho discreto se o item ativo for o de Caloteiros
            const isCaloteiros = item.path === "/caloteiros";

            return (
              <button
                key={item.path}
                onClick={() => navigateWithRange(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  isActive
                    ? isCaloteiros
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : isCaloteiros 
                      ? "text-zinc-400 hover:text-red-400 hover:bg-red-500/5" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-5 h-5 flex-shrink-0", 
                    isActive 
                      ? "text-white" 
                      : isCaloteiros 
                        ? "group-hover:text-red-400" 
                        : "group-hover:text-white"
                  )} 
                />
                <span className={cn(
                    "whitespace-nowrap transition-opacity duration-300 font-medium",
                    !isSidebarOpen && "md:opacity-0 md:hidden"
                )}>
                    {item.label}
                </span>
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
            <span className={cn(
                "whitespace-nowrap font-medium",
                !isSidebarOpen && "md:hidden"
            )}>
                Sair da conta
            </span>
          </Button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0">
          <div className="flex-1 overflow-auto bg-zinc-950">
            {children}
          </div>
      </main>
    </div>
  );
};

export default Layout;