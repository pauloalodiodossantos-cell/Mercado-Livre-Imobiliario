import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ExternalLink, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { api, type Offer } from "../api/client";
import { useAuth } from "../context/AuthContext";

function fmt(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const statusInfo: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUBMITTED: { label: "Aguardando", color: "bg-amber-50 text-amber-700", icon: <Clock className="w-3.5 h-3.5" /> },
  ACCEPTED: { label: "Aceita", color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: "Rejeitada", color: "bg-red-50 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  EXPIRED: { label: "Expirada", color: "bg-slate-100 text-slate-500", icon: <XCircle className="w-3.5 h-3.5" /> },
  WITHDRAWN: { label: "Retirada", color: "bg-slate-100 text-slate-500", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export function BuyerDashboard() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.offers.mine()
      .then(({ offers }) => setOffers(offers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {user?.fullName.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe suas propostas e negociações.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total de propostas" value={offers.length} color="blue" />
          <StatCard label="Aceitas" value={offers.filter((o) => o.status === "ACCEPTED").length} color="emerald" />
          <StatCard label="Aguardando" value={offers.filter((o) => o.status === "SUBMITTED").length} color="amber" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" /> Minhas propostas
            </h2>
            <Link to="/" className="text-sm text-brand-600 hover:underline font-medium">
              Ver imóveis
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando...</div>
          ) : offers.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-500 mb-1">Nenhuma proposta ainda</p>
              <p className="text-sm text-slate-400 mb-5">Explore os imóveis e faça sua primeira proposta.</p>
              <Link to="/" className="btn-primary text-sm">Ver imóveis</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {offers.map((offer) => {
                const st = statusInfo[offer.status] ?? statusInfo.SUBMITTED;
                return (
                  <div key={offer.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${st.color} flex items-center gap-1`}>
                          {st.icon} {st.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(offer.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">{fmt(offer.offerPrice)}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {offer.listing?.city ?? "—"} · pedido {fmt(offer.listing?.askingPrice ?? "0")}
                      </p>
                    </div>
                    {offer.status === "ACCEPTED" && (
                      <Link
                        to={`/offers/${offer.id}/pipeline`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800 ml-4 shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" /> Ver esteira
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "emerald" | "amber" }) {
  const colors = {
    blue: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="card p-4 text-center">
      <p className={`text-3xl font-extrabold ${colors[color].split(" ")[1]} mb-1`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
