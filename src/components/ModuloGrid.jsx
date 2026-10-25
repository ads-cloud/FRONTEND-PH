import React, { useState, useEffect } from 'react';
import {
  Vote,
  User,
  Building,
  Building2,
  Home,
  Megaphone,
  CreditCard,
  MessageSquare,
  Activity,
  Settings,
  ArrowRight,
  Crown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import api from '../api/axiosClient';

const ICON_MAP = {
  Vote: Vote,
  User: User,
  Building: Building,
  Building2: Building2,
  Home: Home,
  Megaphone: Megaphone,
  CreditCard: CreditCard,
  MessageSquare: MessageSquare,
  Activity: Activity,
  Settings: Settings,
};

export default function ModuloGrid({ user, onSelectModule, searchTerm }) {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isGestor = user?.roles?.includes('ROLE_GESTOR');

  useEffect(() => {
    const fetchModulosAutorizados = async () => {
      try {
        setLoading(true);
        setError(null);
        const activeCopId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id');
        const url = activeCopId ? `/modulos?copropiedadId=${activeCopId}` : '/modulos';
        const res = await api.get(url);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setModulos(res.data);
        } else {
          setModulos([]);
        }
      } catch (err) {
        setError("Error al conectar con la base de datos de módulos.");
      } finally {
        setLoading(false);
      }
    };

    fetchModulosAutorizados();
  }, [user?.documento]);

  const modulosFiltrados = modulos.filter((m) => {
    // Excluir Perfil de la parrilla de módulos (solo accesible desde el botón "Mi Perfil" en Navbar)
    if (m.codigo === 'PERFIL') return false;
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (m.titulo && m.titulo.toLowerCase().includes(term)) ||
      (m.descripcion && m.descripcion.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Título de la Parrilla de Módulos */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Módulos del Sistema
          </h2>
          <p className="text-xs text-slate-400">
            {searchTerm ? `Resultados de búsqueda para "${searchTerm}"` : 'Parrilla principal de aplicaciones y servicios autorizados'}
          </p>
        </div>
      </div>

      {/* Loader de carga desde la BD */}
      {loading ? (
        <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">Cargando catálogo de módulos parametrizados...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-950/40 border border-rose-500/30 rounded-3xl text-center space-y-2 text-rose-300 text-xs font-bold">
          <p>{error}</p>
        </div>
      ) : modulosFiltrados.length === 0 ? (
        <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-3xl text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No se encontraron módulos autorizados que coincidan con "{searchTerm}"</p>
          <p className="text-xs text-slate-500">Intenta buscando términos como "Asambleas", "Perfil", "Pagos", etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {modulosFiltrados.map((mod) => {
            const IconoComp = ICON_MAP[mod.icono] || Building;
            const targetRoute = mod.ruta || mod.codigo?.toLowerCase() || 'asambleas';

            return (
              <div
                key={mod.id || mod.codigo}
                onClick={() => mod.activo && onSelectModule(targetRoute)}
                className={`glass-panel p-6 rounded-3xl border ${mod.borderColor || 'border-slate-800'} ${mod.shadowColor || 'shadow-xl'} shadow-xl relative group transition-all duration-300 flex flex-col justify-between h-full ${mod.activo
                    ? 'cursor-pointer hover:-translate-y-1 hover:bg-slate-900/90'
                    : 'opacity-70 cursor-not-allowed bg-slate-950/30'
                  }`}
              >
                <div className="space-y-4">
                  {/* Header de la Tarjeta */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${mod.colorGradient || 'from-indigo-600 to-cyan-500'} text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300`}>
                      <IconoComp className="w-6 h-6" />
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      mod.activo 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {mod.activo ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                      {mod.activo ? (mod.badge && mod.badge !== 'Próximamente' ? mod.badge : 'Disponible') : (mod.badge || 'Próximamente')}
                    </span>
                  </div>

                  {/* Título y Descripción */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {mod.titulo}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mod.descripcion}
                    </p>
                  </div>
                </div>

                {/* Botón Acción al Pie */}
                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {mod.activo ? 'Acceder al módulo' : 'En desarrollo'}
                  </span>

                  {mod.activo && (
                    <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-1 text-xs font-bold">
                      <span>Ingresar</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
