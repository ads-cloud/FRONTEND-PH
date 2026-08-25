import React, { useState, useEffect, useRef } from 'react';
import { Building2, ShieldCheck, UserCheck, LayoutDashboard, LogOut, Building, Crown, Lock, Settings, Activity, Database, Radio, User, ChevronDown, Search } from 'lucide-react';
import api from '../api/axiosClient';

export default function Navbar({ activeView, setActiveView, user, onLogout, health, onUserUpdate, selectedModule, onSelectModule, searchTerm, setSearchTerm }) {
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [copropiedades, setCopropiedades] = useState([]);
  const [activeCopropiedadId, setActiveCopropiedadId] = useState(
    sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1'
  );

  useEffect(() => {
    if (!isSuperAdmin) {
      const fetchCopropiedades = async () => {
        try {
          const res = await api.get('/copropiedades');
          setCopropiedades(res.data);
        } catch (err) {
          console.warn("Error al cargar copropiedades en el Navbar:", err);
        }
      };
      fetchCopropiedades();
    }
  }, [isSuperAdmin]);

  const handleCambiarCopropiedad = (newId) => {
    setActiveCopropiedadId(newId);
    sessionStorage.setItem('active_copropiedad_id', newId);
    localStorage.setItem('active_copropiedad_id', newId);
    window.location.reload();
  };

  const misCopropiedades = (user?.copropiedadesAsignadas && user.copropiedadesAsignadas.length > 0)
    ? user.copropiedadesAsignadas
    : copropiedades;

  const currentCopropiedadObj = misCopropiedades.find(c => String(c.id) === String(activeCopropiedadId))
    || misCopropiedades[0];

  const phNombre = currentCopropiedadObj?.nombre
    || user?.copropiedadNombre
    || user?.nombreCopropiedad
    || (user?.copropiedadesAsignadas && user.copropiedadesAsignadas[0]?.nombre)
    || 'proyectoPH';

  const getRolBadge = () => {
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'SuperAdmin Global';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrador PH';
    if (user?.roles?.includes('ROLE_GESTOR')) return 'Gestor de Registro';
    return 'Copropietario / Residente';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-t-0 border-slate-800 px-3 sm:px-5 py-2.5 sm:py-3 shadow-2xl backdrop-blur-xl">
      <div className="w-full px-1 sm:px-2 flex items-center justify-between gap-3">

        {/* Left: Brand Logo & Name */}
        <div className="flex-1 flex items-center justify-start gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSelectModule && onSelectModule(null)}
            className="flex items-center gap-2 font-black text-sm tracking-tight text-white hover:opacity-80 transition-opacity focus:outline-none text-left"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent font-extrabold text-sm max-w-[170px] lg:max-w-[240px] truncate">
                {phNombre}
              </span>
              <span className="text-[10px] text-indigo-300/90 font-medium tracking-wide">
                Gestión de Propiedad Horizontal
              </span>
            </div>
          </button>
        </div>

        {/* Center: Botón Módulos + Buscador Centrado en el Medio de la Barra */}
        {user && (
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
            {/* Botón Ir a Módulos (Parrilla Principal) */}
            <button
              type="button"
              onClick={() => onSelectModule && onSelectModule(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 ${!selectedModule
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                }`}
              title="Menú de Módulos Principal"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xs:inline">Módulos</span>
            </button>

            {/* Buscador de Módulos por Nombre (Solo visible en la Parrilla Principal) */}
            {!selectedModule && (
              <div className="relative w-full max-w-[240px] sm:max-w-[300px] flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm || ''}
                  onChange={(e) => {
                    if (setSearchTerm) setSearchTerm(e.target.value);
                  }}
                  placeholder="Buscar módulo por nombre..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 focus:border-indigo-500 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            )}
          </div>
        )}

        {/* Right: Tenant Control & User Icon (Alineado a la derecha) */}
        {user && (
          <div key={user?.documento || 'user-nav'} className="flex-1 flex items-center justify-end gap-2 sm:gap-3 shrink-0">

            {/* Multi-Tenant Copropiedad Switcher (solo si administra múltiples conjuntos) */}
            {isAdmin && misCopropiedades.length > 1 && (
              <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 rounded-xl">
                <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <select
                  value={activeCopropiedadId}
                  onChange={(e) => handleCambiarCopropiedad(e.target.value)}
                  className="bg-transparent text-white text-[11px] font-semibold focus:outline-none cursor-pointer max-w-[110px] sm:max-w-none truncate"
                >
                  {misCopropiedades.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      🏢 {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ícono de Usuario con Tooltip desplegable al pasar el mouse */}
            <div className="relative group pl-2 sm:pl-3 border-l border-slate-800">
              <button
                type="button"
                onClick={() => onSelectModule && onSelectModule('perfil')}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
                title="Ver Perfil de Usuario"
              >
                <User className="w-4 h-4 text-indigo-400" />
              </button>

              {/* Tooltip Card Desplegable en Hover */}
              <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl bg-slate-950/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 space-y-3 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-sm shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-white text-xs truncate">
                      {user?.nombreCompleto || user?.username || 'Usuario'}
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {getRolBadge()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600/30 border border-rose-500/30 hover:border-rose-500/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
