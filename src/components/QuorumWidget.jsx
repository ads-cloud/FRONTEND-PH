import React from 'react';
import { Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function QuorumWidget({ quorum, onRefresh, loading, totalUnidadesRegistradas = 0 }) {
  if (!quorum) return null;

  const pct = quorum.porcentajeQuorum || 0;
  const isQuorumReached = quorum.alcanzoQuorum;
  const totalCopropiedad = quorum.totalUnidadesCopropiedad || totalUnidadesRegistradas;

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Quórum en Tiempo Real
              <button
                onClick={onRefresh}
                disabled={loading}
                className="text-slate-400 hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-slate-800"
                title="Actualizar quórum"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </h2>
            <p className="text-xs text-slate-400">{quorum.tituloAsamblea || 'Asamblea General Ordinaria'}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
          isQuorumReached
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          {isQuorumReached ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {isQuorumReached ? 'Quórum Deliberatorio Alcanzado (>50%)' : 'Sin Quórum Suficiente (≤50%)'}
        </div>
      </div>

      {/* Main Quorum Percentage Display */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center my-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Coeficiente Presente</span>
          <div className="text-3xl font-extrabold text-white flex items-baseline gap-2 mt-1">
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {pct.toFixed(4)}%
            </span>
            <span className="text-xs font-normal text-slate-400">/ 100.0000%</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Unidades Presentes</span>
          <div className="text-2xl font-bold text-slate-200 mt-1 flex items-baseline gap-1.5">
            <span>{quorum.totalUnidadesAsistentes || 0}</span>
            {totalCopropiedad > 0 ? (
              <span className="text-base font-bold text-indigo-400">de {totalCopropiedad}</span>
            ) : null}
            <span className="text-xs font-normal text-slate-400">inmuebles</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Suma Coeficientes</span>
          <div className="text-2xl font-bold text-slate-200 mt-1">
            {(quorum.coeficienteAcumulado || 0).toFixed(4)}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="relative pt-2">
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isQuorumReached
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-500 to-indigo-500'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        {/* Threshold Markers */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
          <span>0%</span>
          <span className="flex items-center gap-1 font-semibold text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"></span>
            50% (Mayoría Simple)
          </span>
          <span className="flex items-center gap-1 font-semibold text-violet-300">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"></span>
            70% (Mayoría Calificada Ley 675)
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
