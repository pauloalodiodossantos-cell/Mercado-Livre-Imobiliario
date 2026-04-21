import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BedDouble, Car, Maximize2, MapPin, ArrowLeft, SendHorizonal, AlertCircle } from "lucide-react";
import { api, type Listing } from "../api/client";
import { ValuationPanel } from "../components/ValuationPanel";
import { useAuth } from "../context/AuthContext";

function fmt(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.listings.get(id)
      .then(({ listing }) => setListing(listing))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !offerPrice) return;
    setSubmitting(true);
    setError("");
    try {
      await api.offers.createOffer(id, { offerPrice: Number(offerPrice.replace(/\D/g, "")) });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar proposta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!listing) return null;
  const { property, valuation } = listing;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para listagem
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="badge bg-brand-100 text-brand-700 mb-2">{property.propertyType}</span>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">{property.addressLine1}</h1>
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {property.city} — {property.state} · CEP {property.zipCode}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Preço pedido</p>
                  <p className="text-2xl font-extrabold text-slate-900">{fmt(listing.askingPrice)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 py-4 border-t border-slate-100">
                {property.areaM2 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Maximize2 className="w-4 h-4 text-brand-500" />
                    <span className="font-semibold">{property.areaM2} m²</span>
                    <span className="text-sm text-slate-400">de área</span>
                  </div>
                )}
                {property.bedrooms != null && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <BedDouble className="w-4 h-4 text-brand-500" />
                    <span className="font-semibold">{property.bedrooms}</span>
                    <span className="text-sm text-slate-400">quartos</span>
                  </div>
                )}
                {property.parkingSpots != null && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Car className="w-4 h-4 text-brand-500" />
                    <span className="font-semibold">{property.parkingSpots}</span>
                    <span className="text-sm text-slate-400">vaga{property.parkingSpots !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>

            {valuation && <ValuationPanel valuation={valuation} />}
          </div>

          {/* Offer sidebar */}
          <div className="space-y-4">
            {user?.role === "BUYER" || user?.role === "BROKER" ? (
              <div className="card p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <SendHorizonal className="w-5 h-5 text-brand-600" />
                  Fazer proposta
                </h3>

                {success ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="font-semibold text-slate-800 mb-1">Proposta enviada!</p>
                    <p className="text-sm text-slate-500 mb-4">O vendedor será notificado.</p>
                    <Link to="/buyer" className="btn-primary block text-center text-sm">
                      Ver minhas propostas
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleOffer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Valor da proposta (R$)
                      </label>
                      <input
                        type="number"
                        className="input"
                        placeholder="Ex: 620000"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        required
                        min={1}
                      />
                      <p className="text-xs text-slate-400 mt-1">Sinal (5%) calculado automaticamente</p>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}

                    <button type="submit" className="btn-primary w-full" disabled={submitting}>
                      {submitting ? "Enviando..." : "Enviar proposta"}
                    </button>
                  </form>
                )}
              </div>
            ) : !user ? (
              <div className="card p-6 text-center">
                <p className="text-slate-600 text-sm mb-4">Entre na sua conta para fazer uma proposta.</p>
                <Link to="/login" className="btn-primary block">Entrar</Link>
              </div>
            ) : null}

            <div className="card p-5 bg-brand-50 border-brand-100">
              <p className="text-xs font-semibold text-brand-700 mb-2">Processo seguro</p>
              <ul className="text-xs text-brand-600 space-y-1.5">
                <li>✓ Due diligence automática</li>
                <li>✓ Contrato gerado digitalmente</li>
                <li>✓ Conta garantia integrada</li>
                <li>✓ Histórico completo da transação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
