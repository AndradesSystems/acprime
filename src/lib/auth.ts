// src/lib/auth.ts
import { api } from "@/services/api";

type User = {
  id: string;
  nome: string;
  email: string;
  tipo: "ADMIN" | "OPERADOR";
};

export const authService = {
  async login(email: string, senha: string): Promise<User> {
    const { data } = await api.post("/auth/login", { email, senha });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data.user;
  },

  logout() {
    localStorage.clear();
  },

  getUser(): User | null {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.tipo === "ADMIN";
  },
};
