import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Building, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Sparkles, 
  SlidersHorizontal,
  Search,
  Check,
  AlertCircle,
  ArrowLeft,
  Crown
} from 'lucide-react';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';

const ROLES_DISPONIBLES = [
  { key: 'ROLE_SUPER_ADMIN', label: 'Super Administrador', icon: Crown, color: 'text-purple-400' },
  { key: 'ROLE_ADMIN', label: 'Administrador PH', icon: ShieldCheck, color: 'text-indigo-400' },
  { key: 'ROLE_GESTOR', label: 'Gestor de Registro', icon: UserCheck, color: 'text-emerald-400' },
  { key: 'ROLE_COPROPIETARIO', label: 'Copropietario / Votante', icon: Users, color: 'text-cyan-400' },
  { key: 'ROLE_APODERADO', label: 'Apoderado', icon: Building, color: 'text-amber-400' },
];

export default function GestionModulosModulo({ user, onBack }) {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notif, setNotif] = useState(null);

  const toast = useToast();
  const showNotif = (type, text) => {
    if (type === 'success') toast.success(text);
    else if (type === 'error') toast.error(text);
    else if (type === 'warning') toast.warning(text);
    else toast.info(text);
  };

  const fetchModulosAdmin = async () => {
    try {
      setLoading(true);
      const activeCopId = user?.copropiedadId || user?.copropietarioInfo?.copropiedadId || sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id');
      const url = activeCopId ? `/modulos/admin?copropiedadId=${activeCopId}` : '/modulos/admin';
      const res = await api.get(url);
      setModulos(res.data);
    } catch (err) {
      console.error("Error al cargar administración de módulos:", err);
      showNotif('error', 'No se pudo cargar la lista de módulos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModulosAdmin();
  }, []);

  const handleToggleEstado = async (modulo) => {
    const nuevoEstado = !modulo.activo;
    try {
      setSavingId(modulo.id);
      await api.patch(`/modulos/${modulo.id}/estado?activo=${nuevoEstado}`);
      setModulos(prev => prev.map(m => m.id === modulo.id ? { ...m, activo: nuevoEstado } : m));
      showNotif('success', `Módulo "${modulo.titulo}" ${nuevoEstado ? 'activado' : 'inactivado'} exitosamente.`);
    } catch (err) {
      showNotif('error', 'Error al cambiar estado del módulo.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleRol = (moduloId, rolKey) => {
    setModulos(prev => prev.map(m => {
      if (m.id !== moduloId) return m;
      const rolesActuales = new Set(m.rolesPermitidos || []);
      if (rolesActuales.has(rolKey)) {
        rolesActuales.delete(rolKey);
      } else {
        rolesActuales.add(rolKey);
      }
      return { ...m, rolesPermitidos: Array.from(rolesActuales) };
    }));
  };

  const handleGuardarModulo = async (modulo) => {
    try {
      setSavingId(modulo.id);
      const payload = {
        ...modulo,
        rolesPermitidos: modulo.rolesPermitidos || []
      };
      await api.put(`/modulos/${modulo.id}`, payload);
      showNotif('success', `Permisos del módulo "${modulo.titulo}" actualizados correctamente.`);
    } catch (err) {
      showNotif('error', 'Error al guardar los permisos del módulo.');
    } finally {
      setSavingId(null);
    }
  };

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');

  const modulosVisibles = modulos.filter(m => {
    if (!isSuperAdmin && (m.codigo === 'MONITOREO' || m.codigo === 'ADMIN_PH')) {
      return false;
    }
    return true;
  });

  const modulosFiltrados = modulosVisibles.filter(m => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return m.titulo?.toLowerCase().includes(t) || m.codigo?.toLowerCase().includes(t) || m.descripcion?.toLowerCase().includes(t);
  });

  const totalModulos = modulosVisibles.length;
  const modulosActivos = modulosVisibles.filter(m => m.activo).length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Volver a Módulos</span>
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            Administración de Módulos y Permisos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configuración de visibilidad, activación y asignación de roles autorizados por módulo en la copropiedad.
          </p>
        </div>

        {/* Métrica de Módulos */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Módulos</span>
            <span className="text-base font-extrabold text-white">{totalModulos}</span>
          </div>
          <div className="px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Habilitados</span>
            <span className="text-base font-extrabold text-indigo-300">{modulosActivos}</span>
          </div>
        </div>
      </div>

      {/* Buscador de Módulos */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nombre o código de módulo..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all"
          />
        </div>

        <button
          type="button"
          onClick={fetchModulosAdmin}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl transition-all cursor-pointer"
          title="Recargar Módulos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
        </button>
      </div>

      {/* Notificaciones */}
      {notif && (
        <div className={`p-4 rounded-2xl border text-xs font-bold animate-fadeIn flex items-center gap-2.5 ${
          notif.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{notif.text}</span>
        </div>
      )}

      {/* Lista de Módulos Parametrizables */}
      {loading ? (
        <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">Cargando módulos parametrizables desde la base de datos...</p>
        </div>
      ) : modulosFiltrados.length === 0 ? (
        <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-3xl text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No se encontraron módulos con el criterio "{searchTerm}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modulosFiltrados.map((mod) => {
            const isSaving = savingId === mod.id;
            const rolesSet = new Set(mod.rolesPermitidos || []);

            return (
              <div
                key={mod.id}
                className={`glass-panel p-6 rounded-3xl border transition-all space-y-5 bg-slate-900/80 ${
                  mod.activo ? 'border-slate-800' : 'border-slate-800/60 opacity-80'
                }`}
              >
                {/* Header de la tarjeta del módulo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                        {mod.codigo}
                      </span>
                      <h3 className="text-base font-extrabold text-white">{mod.titulo}</h3>
                    </div>
                    <p className="text-xs text-slate-400">{mod.descripcion}</p>
                  </div>

                  {/* Toggle Activo / Inactivo */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold ${mod.activo ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {mod.activo ? 'Habilitado' : 'Inhabilitado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(mod)}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        mod.activo ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mod.activo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Selección de Roles Autorizados */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    Roles Autorizados para Acceder:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {ROLES_DISPONIBLES.map((r) => {
                      const Icono = r.icon;
                      const hasRol = rolesSet.has(r.key);

                      return (
                        <div
                          key={r.key}
                          onClick={() => handleToggleRol(mod.id, r.key)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            hasRol 
                              ? 'bg-purple-600/15 border-purple-500/40 text-white' 
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icono className={`w-4 h-4 ${r.color}`} />
                            <span className="text-xs font-semibold">{r.label}</span>
                          </div>

                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            hasRol ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {hasRol && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botón Guardar Cambios por Módulo */}
                <div className="flex justify-end pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleGuardarModulo(mod)}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Permisos'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
