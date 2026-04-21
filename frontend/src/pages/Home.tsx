import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Building2 } from "lucide-react";
import { api, type Listing } from "../api/client";
import { PropertyCard } from "../components/PropertyCard";

export function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.listings.list()
      .then(({ listings }) => setListings(listings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.property.city.toLowerCase().includes(q) ||
      l.property.state.toLowerCase().includes(q) ||
      l.property.propertyType.toLowerCase().includes(q) ||
      l.property.addressLine1.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Marketplace Imobiliário Inteligente
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Encontre seu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">
                imóvel ideal
              </span>
            </h1>
            <p className="text-brand-200 text-lg mb-8">
              Análise financeira automática com cap rate, IRR e desconto vs. teto regional.
            </p>

            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cidade, tipo ou bairro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 text-sm font-medium shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Imóveis disponíveis</h2>
            <p className="text-slate-500 text-sm mt-1">
              {loading ? "Carregando..." : `${filtered.length} imóvel${filtered.length !== 1 ? "is" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-slate-400">
              {search ? "Tente outro termo de busca." : "Nenhum imóvel publicado ainda."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((l) => <PropertyCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
