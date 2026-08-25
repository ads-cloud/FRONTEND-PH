import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function PaginationControls({
  currentPage = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 12,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48, 96],
  itemName = 'registros'
}) {
  if (totalElements === 0) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-panel border border-slate-800/80 rounded-2xl bg-slate-950/60 backdrop-blur-md shadow-xl animate-fadeIn">
      {/* Información del rango mostrado */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>
          Mostrando <strong className="text-white font-bold">{startItem} - {endItem}</strong> de <strong className="text-emerald-400 font-bold">{totalElements}</strong> {itemName}
        </span>

        {/* Selector de tamaño de página */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <span className="text-[11px] text-slate-500">Por pág:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-white font-bold text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Botones de navegación de página */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          title="Primera Página"
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          title="Página Anterior"
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200">
          Pág <span className="text-emerald-400">{currentPage + 1}</span> de <span className="text-slate-400">{Math.max(totalPages, 1)}</span>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          title="Página Siguiente"
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          title="Última Página"
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
