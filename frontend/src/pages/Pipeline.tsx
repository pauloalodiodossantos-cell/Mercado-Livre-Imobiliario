import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Clock, DollarSign, FileText, Shield, Wallet } from "lucide-react";
import { api, type Pipeline as PipelineData } from "../api/client";

function fmt(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const ddStatusColor: Record<string, string> = {
  APPROVED: "text-emerald-600",
  PENDING: "text-amber-600",
  RUNNING: "text-blue-600",
  FLAGGED: "text-red-600",
  FAILED: "text-red-600",
};

const escrowStatusColor: Record<string, string> = {
  FUNDED: "text-emerald-600",
  PENDING_FUNDING: "text-amber-600",
  RELEASED: "text-brand-600",
  REFUNDED: "text-slate-600",
};

export function Pipeline() {
  const { offerId } = useParams<{ offerId: string }>();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);

  const reload = () => {
    if (!offerId) return;
    api.offers.pipeline(offerId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [offerId]);

  const simulateFunding = async () => {
    if (!offerId) return;
    setFunding(true);
    try {
      await api.offers.simulateFunding(offerId);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const steps = [
    { done: true, label: "Proposta enviada", icon: <Circle className="w-5 h-5" /> },
    { done: true, label: "Proposta aceita", icon: <CheckCircle2 className="w-5 h-5" /> },
    { done: !!data.dueDiligence, label: "Due Diligence", icon: <Shield className="w-5 h-5" /> },
    { done: !!data.contract, label: "Contrato gerado", icon: <FileText className="w-5 h-5" /> },
    { done: data.escrow?.status === "FUNDED" || data.escrow?.status === "RELEASED", label: "Escrow financiado", icon: <Wallet className="w-5 h-5" /> },
    { done: data.escrow?.status === "RELEASED", label: "Finalizado", icon: <CheckCircle2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/buyer" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Esteira da transação</h1>
        <p className="text-slate-500 text-sm mb-8">
          {data.listing.property.addressLine1}, {data.listing.property.city}
        </p>

        {/* Steps */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-5">Progresso</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 ${step.done ? "text-emerald-600" : "text-slate-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-100" : "bg-slate-100"}`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <span className={`font-medium text-sm ${step.done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</span>
                {step.done && <span className="text-xs text-emerald-500 font-semibold">✓ Concluído</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Offer summary */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-600" /> Resumo financeiro
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Valor da proposta</p>
              <p className="text-xl font-bold text-slate-900">{fmt(data.offer.offerPrice)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Sinal (earnest money)</p>
              <p className="text-xl font-bold text-slate-900">{fmt(data.offer.earnestMoney)}</p>
            </div>
          </div>
        </div>

        {/* Due Diligence */}
        {data.dueDiligence && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600" /> Due Diligence
              <span className={`badge ml-auto ${ddStatusColor[data.dueDiligence.status] ?? ""} bg-emerald-50`}>
                {data.dueDiligence.status} · risco {data.dueDiligence.riskScore}
              </span>
            </h2>
            <p className="text-sm text-slate-500 mb-4">{data.dueDiligence.summary}</p>
            <div className="space-y-2">
              {data.dueDiligence.checks.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-slate-700 font-medium">{c.checkType}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{c.resultSummary}</span>
                    <span className={`badge text-xs ${c.status === "CLEAR" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract */}
        {data.contract && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" /> Contrato
              <span className="badge bg-amber-100 text-amber-700 ml-auto text-xs">{data.contract.status}</span>
            </h2>
            <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-auto whitespace-pre-wrap font-mono leading-relaxed border border-slate-200">
              {data.contract.bodyMarkdown}
            </pre>
          </div>
        )}

        {/* Escrow */}
        {data.escrow && (
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-600" /> Conta Garantia (Escrow)
              <span className={`badge ml-auto text-xs ${escrowStatusColor[data.escrow.status] ?? ""} bg-amber-50`}>
                {data.escrow.status}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Meta</p>
                <p className="font-bold text-slate-900">{fmt(data.escrow.targetAmount)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Depositado</p>
                <p className="font-bold text-slate-900">{fmt(data.escrow.fundedAmount)}</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {data.escrow.milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-slate-700 font-medium">{m.milestoneType}</span>
                  <span className={`badge text-xs ${m.status === "DONE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
            {data.escrow.status === "PENDING_FUNDING" && (
              <button onClick={simulateFunding} disabled={funding} className="btn-primary w-full text-sm">
                {funding ? "Simulando..." : "🚀 Simular depósito (demo)"}
              </button>
            )}
            {data.escrow.status === "FUNDED" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm text-center font-semibold">
                ✓ Escrow financiado! Transação em andamento.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
