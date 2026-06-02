// src/lib/auth.ts
import { api } from "@/services/api";
import { createSubscriber, SubscriberInput } from "@/services/subscriber";

// 🟢 Tipagem atualizada com as novas regras de negócio
type User = {
  id: string;
  nome: string;
  email: string;
  tipo: "ADMIN" | "OPERADOR" | "ASSINANTE"; // 💡 Adicionado ASSINANTE
  vencimento: string | Date | null;          // 💡 Pode começar nulo (VAZIO)
  plan: "VAZIO" | "STARTER" | "PRO";         // 💡 Adicionado campo de planos
};

export const authService = {
  async login(email: string, senha: string): Promise<User> {
    const { data } = await api.post("/auth/login", { email, senha });
    console.log(data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data.user;
  },

  async register(input: SubscriberInput): Promise<void> {
    await createSubscriber(input);
  },

  logout() {
    localStorage.clear();
  },

  getUser(): User | null {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  // 🟢 Método auxiliar limpo para o Layout ler os dados atuais de plano/vencimento
  getUserData(): User | null {
    return this.getUser();
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.tipo === "ADMIN";
  },
};