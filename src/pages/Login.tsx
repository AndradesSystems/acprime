import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react"; // Adicionei ArrowRight e Loader2
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await authService.login(email, password);

      toast({
        title: "Acesso concedido",
        description: `Bem-vindo de volta, ${user.nome}!`,
        className: "border-primary/50 text-primary",
      });

      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Falha na autenticação",
        description:
          err?.response?.data?.message ?? "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-zinc-950 text-white overflow-hidden">
      
      {/* --- PAINEL ESQUERDO (VISUAL & MARCA) --- */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-zinc-900 border-r border-white/5">
        {/* Efeitos de Fundo (Glows) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]" />
        </div>

        {/* Logo Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-700 p-0.5 shadow-lg shadow-amber-500/20">
            <img src="/logo.png" className="w-full h-full rounded-full object-cover" alt="Logo" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Gestão Andrade</span>
        </div>

        {/* Conteúdo Central/Inferior */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Gerencie seus ativos com <br />
            <span className="bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
              Excelência e Segurança.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Plataforma completa para controle de empréstimos, gestão de contratos e análise financeira em tempo real.
          </p>
        </div>

        {/* Footer do Painel */}
        <div className="relative z-10">
          <p className="text-xs text-zinc-500">© 2024 Andrade Financeira. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* --- PAINEL DIREITO (FORMULÁRIO) --- */}
      <div className="flex items-center justify-center p-8 bg-zinc-950 relative">
        {/* Glow Mobile (só aparece em telas pequenas) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] lg:hidden" />

        <div className="w-full max-w-[400px] space-y-8 relative z-10">
          
          {/* Cabeçalho do Form */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-700 p-0.5 shadow-xl shadow-amber-500/20">
                    <img src="/logo.png" className="w-full h-full rounded-full object-cover" alt="Logo" />
                </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Acesse sua conta</h1>
            <p className="text-zinc-400">Entre com suas credenciais para continuar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Campo E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">E-mail Corporativo</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@andrade.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600 text-zinc-100"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                <a href="#" className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600 text-zinc-100"
                  required
                />
              </div>
            </div>

            {/* Botão de Ação */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer Mobile/Extra */}
          <div className="text-center">
            <p className="text-xs text-zinc-600">
              Protegido por criptografia de ponta a ponta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;