import { Link } from "react-router-dom";
import { BedDouble, Car, Maximize2, MapPin, TrendingUp } from "lucide-react";
import type { Listing } from "../api/client";

const typeGradient: Record<string, string> = {
  Apartamento: "from-blue-500 to-indigo-600",
  Casa: "from-emerald-500 to-teal-600",
  Studio: "from-violet-500 to-purple-600",
  Comercial: "from-amber-500 to-orange-600",
};

const typeEmoji: Record<string, string> = {
  Apartamento: "🏢",
  Casa: "🏡",
  Studio: "🛋️",
  Comercial: "🏪",
};

function fmt(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function PropertyCard({ listing }: { listing: Listing }) {
  const { property, valuation } = listing;
  const gradient = typeGradient[property.propertyType] ?? "from-slate-500 to-slate-700";
  const emoji = typeEmoji[property.propertyType] ?? "🏠";
  const capRate = valuation ? Number(valuation.capRatePct).toFixed(2) : null;

  return (
    <Link to={`/listings/${listing.id}`} className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group block">
      <div className={`h-44 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        <span className="text-6xl">{emoji}</span>
        <div className="absolute top-3 left-3">
          <span className="badge bg-white/20 text-white backdrop-blur-sm">{property.propertyType}</span>
        </div>
        {capRate && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-emerald-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {capRate}% cap rate
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-1.5 text-slate-500 text-sm mb-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{property.addressLine1}</span>
        </div>
        <p className="font-semibold text-slate-800 text-sm mb-3">{property.city} — {property.state}</p>

        <div className="flex items-center gap-3 text-slate-500 text-xs mb-4">
          {property.areaM2 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" /> {property.areaM2} m²
            </span>
          )}
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" /> {property.bedrooms} qts
            </span>
          )}
          {property.parkingSpots != null && (
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> {property.parkingSpots} vagas
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Preço pedido</p>
            <p className="text-xl font-bold text-slate-900">{fmt(listing.askingPrice)}</p>
          </div>
          <span className="btn-primary text-sm !py-2 !px-4 group-hover:bg-brand-700">
            Ver mais
          </span>
        </div>
      </div>
    </Link>
  );
}
