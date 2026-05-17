import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ArrowRight, User, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estado para alternar entre Login e Cadastro
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos campos do formulário
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estado para força da senha (0 a 4)
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Máscara de CPF em tempo real
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é dígito
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

    // Aplica a máscara de CPF (000.000.000-00)
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setCpf(value);
  };

  // Validador de força de senha reativo
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let points = 0;
    if (password.length >= 6) points++; // Tamanho mínimo básico
    if (password.length >= 8) points++; // Tamanho ideal
    if (/[A-Z]/.test(password)) points++; // Letra maiúscula
    if (/[0-9]/.test(password)) points++; // Número
    
    setPasswordStrength(points);
  }, [password]);

  // Retorna a cor e o texto baseado na força da senha
  const getStrengthMeta = () => {
    switch (passwordStrength) {
      case 1:
        return { color: "bg-red-500", text: "Fraca", textColor: "text-red-400" };
      case 2:
        return { color: "bg-orange-500", text: "Média", textColor: "text-orange-400" };
      case 3:
        return { color: "bg-yellow-500", text: "Boa", textColor: "text-yellow-400" };
      case 4:
        return { color: "bg-emerald-500", text: "Forte", textColor: "text-emerald-400" };
      default:
        return { color: "bg-zinc-800", text: "", textColor: "text-zinc-500" };
    }
  };

  const strengthMeta = getStrengthMeta();

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (isLogin) {
      // Fluxo de Login Existente
      const user = await authService.login(email, password);
      toast({
        title: "Acesso concedido",
        description: `Bem-vindo de volta, ${user.nome}!`,
        className: "border-primary/50 text-primary",
      });
      navigate("/dashboard");
    } else {
      // Fluxo de Cadastro real conectado à rota de subcription
      await authService.register({
        nome,
        cpf,
        email,
        senha: password, // Mapeado para o campo esperado no back-end
      });
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Seu registro de assinante foi realizado. Faça login para continuar.",
        className: "border-amber-500/50 text-amber-500",
      });
      
      // Limpa os campos e move o usuário reativamente para a aba de Login
      setNome("");
      setCpf("");
      setPassword("");
      setIsLogin(true);
    }
  } catch (err: any) {
    toast({
      title: isLogin ? "Falha na autenticação" : "Falha no cadastro",
      description: 
        err?.response?.data?.message ?? 
        "Verifique os dados informados. O e-mail ou CPF já podem estar em uso.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-zinc-950 text-white overflow-hidden transition-all duration-500">
      
      {/* --- PAINEL ESQUERDO (VISUAL & MARCA) --- */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-zinc-900 border-r border-white/5">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-700 p-0.5 shadow-lg shadow-amber-500/20">
            <img src="/logo.png" className="w-full h-full rounded-full object-cover" alt="Logo" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Alto Capital Prime</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight transition-all">
            {isLogin ? (
              <>
                Gerencie seus ativos com <br />
                <span className="bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                  Excelência e Segurança.
                </span>
              </>
            ) : (
              <>
                Abra sua conta e mude o seu <br />
                <span className="bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                  Futuro Financeiro.
                </span>
              </>
            )}
          </h2>
          <p className="text-zinc-400 text-lg transition-all">
            {isLogin 
              ? "Plataforma completa para controle de empréstimos, gestão de contratos e análise financeira em tempo real."
              : "Faça parte da elite financeira. Tenha acesso a painéis exclusivos, investimentos estratégicos e relatórios sob demanda."}
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-zinc-500">© 2026 Andrade Financeira. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* --- PAINEL DIREITO (FORMULÁRIO MUTÁVEL) --- */}
      <div className="flex items-center justify-center p-8 bg-zinc-950 relative min-h-screen lg:min-h-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] lg:hidden" />

        <div className="w-full max-w-[400px] space-y-6 relative z-10 my-auto">
          
          {/* Cabeçalho do Form */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-700 p-0.5 shadow-xl shadow-amber-500/20">
                <img src="/logo.png" className="w-full h-full rounded-full object-cover" alt="Logo" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-white transition-all">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h1>
            <p className="text-yellow-600 font-medium text-sm">Onde o dinheiro encontra estratégia.</p>
            <p className="text-zinc-400 text-sm">
              {isLogin ? "Entre com suas credenciais para continuar." : "Preencha os dados abaixo para se registrar corporativamente."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPOS EXCLUSIVOS DE CADASTRO */}
            {!isLogin && (
              <>
                {/* Campo Nome Completo */}
                <div className="space-y-1.5 animate-fadeIn">
                  <Label htmlFor="nome" className="text-zinc-300 text-xs">Nome Completo</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Ex: Andrade Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all text-zinc-100 placeholder:text-zinc-600"
                      required={!isLogin}
                    />
                  </div>
                </div>

                {/* Campo CPF com Máscara */}
                <div className="space-y-1.5 animate-fadeIn">
                  <Label htmlFor="cpf" className="text-zinc-300 text-xs">CPF</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={handleCpfChange}
                      className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all text-zinc-100 placeholder:text-zinc-600"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Campo E-mail (Comum a ambos) */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 text-xs">E-mail Corporativo</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@andrade.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all text-zinc-100 placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            {/* Campo Senha (Comum a ambos) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300 text-xs">Senha</Label>
                {isLogin && (
                  <a href="#" className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                    Esqueceu a senha?
                  </a>
                )}
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all text-zinc-100 placeholder:text-zinc-600"
                  required
                />
              </div>

              {/* MEDIDOR DE FORÇA DA SENHA REATIVO (Apenas na tela de Registro) */}
              {!isLogin && password && (
                <div className="pt-1 space-y-1 animate-fadeIn">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-400">Força da senha:</span>
                    <span className={`font-semibold ${strengthMeta.textColor}`}>{strengthMeta.text}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength >= 1 ? strengthMeta.color : "bg-transparent"} transition-all duration-300`} />
                    <div className={`h-full ${passwordStrength >= 2 ? strengthMeta.color : "bg-transparent"} transition-all duration-300`} />
                    <div className={`h-full ${passwordStrength >= 3 ? strengthMeta.color : "bg-transparent"} transition-all duration-300`} />
                    <div className={`h-full ${passwordStrength >= 4 ? strengthMeta.color : "bg-transparent"} transition-all duration-300`} />
                  </div>
                </div>
              )}
            </div>

            {/* Botão Principal de Ação */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:scale-[1.01] mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isLogin ? "Autenticando..." : "Processando..."}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isLogin ? "Entrar no Sistema" : "Cadastrar Conta"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Alternador de Contexto (Login <=> Cadastro) */}
          <div className="text-center pt-2 border-t border-zinc-900">
            <p className="text-sm text-zinc-400">
              {isLogin ? "Ainda não tem acesso corporativo?" : "Já possui um registro?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword(""); // Reseta a validação de força de senha ao alternar
                }}
                className="text-amber-500 hover:text-amber-400 font-semibold transition-colors underline-offset-4 hover:underline focus:outline-none"
              >
                {isLogin ? "Cadastre-se aqui" : "Faça login"}
              </button>
            </p>
          </div>

          {/* Footer Mobile/Extra */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-zinc-600 tracking-wider uppercase">
              Protegido por criptografia de ponta a ponta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;