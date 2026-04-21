import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, AlertCircle } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user, token } = await api.auth.login({ email, password });
      login(token, user);
      navigate(user.role === "SELLER" ? "/seller" : "/buyer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
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
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-sm mt-1">Entre na sua conta para continuar</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input type="email" className="input" placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <input type="password" className="input" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-2">Contas de demo:</p>
            <p>vendedor@demo.com / senha1234</p>
            <p>comprador@demo.com / senha1234</p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem conta?{" "}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
