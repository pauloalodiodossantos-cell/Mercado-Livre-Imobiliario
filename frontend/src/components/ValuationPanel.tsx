import { TrendingUp, Percent, BarChart3, Target, Info } from "lucide-react";
import type { Valuation } from "../api/client";

function fmt(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function pct(value: string, decimals = 2) {
  return `${Number(value).toFixed(decimals)}%`;
}

function confidenceLabel(v: string) {
  const n = Number(v);
  if (n >= 0.7) return { label: "Alta", color: "text-emerald-600 bg-emerald-50" };
  if (n >= 0.5) return { label: "Média", color: "text-amber-600 bg-amber-50" };
  return { label: "Baixa", color: "text-red-600 bg-red-50" };
}

export function ValuationPanel({ valuation }: { valuation: Valuation }) {
  const conf = confidenceLabel(valuation.confidence);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          Análise de Investimento
        </h3>
        <span className={`badge ${conf.color} font-semibold`}>
          Confiança: {conf.label} ({pct(valuation.confidence, 0)})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={<Percent className="w-4 h-4" />}
          label="Cap Rate"
          value={pct(valuation.capRatePct)}
          sub="retorno bruto anual"
          color="blue"
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="IRR Estimado"
          value={pct(valuation.irrEstimatePct)}
          sub="retorno total estimado"
          color="emerald"
        />
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Desconto vs Teto"
          value={pct(valuation.discountVsCeilingPct)}
          sub="abaixo do teto regional"
          color="violet"
        />
        <MetricCard
          icon={<Info className="w-4 h-4" />}
          label="Aluguel Estimado"
          value={fmt(valuation.estimatedRentMonthly)}
          sub="por mês"
          color="amber"
        />
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold">Teto regional:</span>{" "}
          {fmt(valuation.regionalPriceCeiling)} — Renda anual estimada:{" "}
          {fmt(valuation.annualRentEstimate)}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "blue" | "emerald" | "violet" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}
