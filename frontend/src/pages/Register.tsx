import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, AlertCircle } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", cpfCnpj: "", role: "BUYER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user, token } = await api.auth.register(form);
      login(token, user);
      navigate(user.role === "SELLER" ? "/seller" : "/buyer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <Building2 className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar sua conta</h1>
          <p className="text-slate-500 text-sm mt-1">Comece a comprar ou vender imóveis</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
              <input className="input" placeholder="João Silva" value={form.fullName} onChange={set("fullName")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CPF ou CNPJ</label>
              <input className="input" placeholder="000.000.000-00" value={form.cpfCnpj} onChange={set("cpfCnpj")} required minLength={11} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input type="email" className="input" placeholder="seu@email.com" value={form.email} onChange={set("email")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <input type="password" className="input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set("password")} required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Perfil</label>
              <select className="input" value={form.role} onChange={set("role")}>
                <option value="BUYER">Comprador</option>
                <option value="SELLER">Vendedor</option>
                <option value="BROKER">Corretor</option>
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full !mt-5" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
