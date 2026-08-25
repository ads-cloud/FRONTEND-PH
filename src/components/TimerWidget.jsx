import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Flame } from 'lucide-react';

export default function TimerWidget({ fechaHoraCierre, duracionMinutos = 5, onExpire, compact = false }) {
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(0);
  const [diffSecs, setDiffSecs] = useState(0);
  const [totalSecs, setTotalSecs] = useState(duracionMinutos * 60);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!fechaHoraCierre) {
      setDiffSecs(0);
      setIsExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      let targetTime;
      if (Array.isArray(fechaHoraCierre)) {
        const [y, m, d, hh, mm, ss] = fechaHoraCierre;
        targetTime = new Date(y, m - 1, d, hh, mm, ss || 0).getTime();
      } else {
        targetTime = new Date(fechaHoraCierre).getTime();
      }

      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      const durSecs = (duracionMinutos || 5) * 60;
      setTotalSecs(durSecs);
      setDiffSecs(diff);

      if (diff <= 0) {
        setIsExpired(true);
        setMins(0);
        setSecs(0);
        if (onExpire) onExpire();
      } else {
        setIsExpired(false);
        setMins(Math.floor(diff / 60));
        setSecs(diff % 60);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [fechaHoraCierre, duracionMinutos]);

  // Si aún no se ha abierto la votación, no mostrar temporizador
  if (!fechaHoraCierre) return null;

  const percent = totalSecs > 0 ? Math.max(0, Math.min(100, (diffSecs / totalSecs) * 100)) : 0;
  const isUrgent = diffSecs > 0 && diffSecs <= 60;
  const isWarning = diffSecs > 60 && percent <= 40;

  // Paleta de colores dinámica
  let barGradient = 'from-emerald-500 via-teal-500 to-indigo-500';
  let badgeBg = 'bg-slate-950/90 border-emerald-500/40 text-emerald-300';
  let glowColor = 'shadow-emerald-500/20';

  if (isExpired) {
    barGradient = 'from-slate-700 to-slate-800';
    badgeBg = 'bg-slate-950/80 border-slate-800 text-slate-400';
    glowColor = 'shadow-none';
  } else if (isUrgent) {
    barGradient = 'from-rose-600 via-red-500 to-amber-500';
    badgeBg = 'bg-rose-950/90 border-rose-500/60 text-rose-200 animate-pulse';
    glowColor = 'shadow-rose-500/30';
  } else if (isWarning) {
    barGradient = 'from-amber-500 to-yellow-400';
    badgeBg = 'bg-amber-950/80 border-amber-500/50 text-amber-200';
    glowColor = 'shadow-amber-500/20';
  }

  const strMins = String(mins).padStart(2, '0');
  const strSecs = String(secs).padStart(2, '0');

  return (
    <div className={`flex flex-col gap-2.5 p-3.5 rounded-2xl border shadow-xl transition-all w-full ${badgeBg} ${glowColor}`}>
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          {isExpired ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <span>Tiempo Agotado</span>
            </>
          ) : isUrgent ? (
            <>
              <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
              <span className="text-rose-300 font-extrabold">¡Último Minuto!</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Votación en Curso</span>
            </>
          )}
        </div>

        {/* Digital Clock Display */}
        <div className="flex items-center gap-1 font-mono font-black text-sm tracking-wider">
          <div className="flex flex-col items-center justify-center px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner text-white min-w-[36px]">
            <span>{strMins}</span>
            <span className="text-[8px] font-sans font-semibold text-slate-400 tracking-normal -mt-0.5">MIN</span>
          </div>
          <span className="text-slate-400 font-bold text-base -mt-1 animate-pulse">:</span>
          <div className="flex flex-col items-center justify-center px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner text-white min-w-[36px]">
            <span>{strSecs}</span>
            <span className="text-[8px] font-sans font-semibold text-slate-400 tracking-normal -mt-0.5">SEG</span>
          </div>
        </div>
      </div>

      {/* Visual Animated Progress Bar */}
      <div className="relative h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-linear shadow-sm`}
          style={{ width: `${isExpired ? 0 : percent}%` }}
        />
      </div>
    </div>
  );
}
