import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { api, type Listing, type Offer } from "../api/client";
import { useAuth } from "../context/AuthContext";

function fmt(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

type ListingWithOffers = Listing & { offers?: Offer[]; loadingOffers?: boolean; expanded?: boolean };

export function SellerDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithOffers[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    api.listings.list()
      .then(({ listings: all }) => {
        const mine = all.filter((l) => true);
        setListings(mine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleOffers = async (listingId: string) => {
    setListings((prev) =>
      prev.map((l) => {
        if (l.id !== listingId) return l;
        if (l.offers !== undefined) return { ...l, expanded: !l.expanded };
        return { ...l, loadingOffers: true };
      }),
    );

    try {
      const { offers } = await api.listings.offers(listingId);
      setListings((prev) =>
        prev.map((l) => l.id === listingId ? { ...l, offers, expanded: true, loadingOffers: false } : l),
      );
    } catch {
      setListings((prev) =>
        prev.map((l) => l.id === listingId ? { ...l, loadingOffers: false } : l),
      );
    }
  };

  const handleAccept = async (offerId: string, listingId: string) => {
    setActing(offerId);
    try {
      await api.offers.accept(offerId);
      const { offers } = await api.listings.offers(listingId);
      setListings((prev) =>
        prev.map((l) => l.id === listingId ? { ...l, offers } : l),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao aceitar");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (offerId: string, listingId: string) => {
    setActing(offerId);
    try {
      await api.offers.reject(offerId);
      const { offers } = await api.listings.offers(listingId);
      setListings((prev) =>
        prev.map((l) => l.id === listingId ? { ...l, offers } : l),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao rejeitar");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Olá, {user?.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-slate-500 mt-1">Gerencie seus anúncios e propostas recebidas.</p>
          </div>
          <Link to="/" className="btn-secondary text-sm">Ver vitrine</Link>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <Home className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-slate-900">Meus anúncios</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando...</div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <Home className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-500 mb-1">Nenhum anúncio ainda</p>
              <p className="text-sm text-slate-400">Os anúncios publicados aparecerão aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {listings.map((listing) => (
                <div key={listing.id}>
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleOffers(listing.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge bg-brand-100 text-brand-700">{listing.property.propertyType}</span>
                        <span className="badge bg-emerald-100 text-emerald-700">{listing.status}</span>
                      </div>
                      <p className="font-semibold text-slate-800 truncate">{listing.property.addressLine1}</p>
                      <p className="text-sm text-slate-500">{listing.property.city} · {fmt(listing.askingPrice)}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {listing.loadingOffers && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
                      {listing.expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {listing.expanded && listing.offers && (
                    <div className="bg-slate-50 border-t border-slate-100 px-6 py-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        {listing.offers.length} proposta{listing.offers.length !== 1 ? "s" : ""}
                      </p>
                      {listing.offers.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">Nenhuma proposta recebida ainda.</p>
                      ) : (
                        <div className="space-y-3">
                          {listing.offers.map((offer) => (
                            <div key={offer.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-800">{fmt(offer.offerPrice)}</p>
                                <p className="text-sm text-slate-500">
                                  {offer.buyerName ?? "Comprador"} · sinal {fmt(offer.earnestMoney)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(offer.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {offer.status === "SUBMITTED" ? (
                                  <>
                                    <button
                                      onClick={() => handleAccept(offer.id, listing.id)}
                                      disabled={acting === offer.id}
                                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {acting === offer.id ? "..." : "Aceitar"}
                                    </button>
                                    <button
                                      onClick={() => handleReject(offer.id, listing.id)}
                                      disabled={acting === offer.id}
                                      className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Rejeitar
                                    </button>
                                  </>
                                ) : (
                                  <span className={`badge text-xs ${offer.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                    {offer.status === "ACCEPTED" ? "Aceita" : "Rejeitada"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
