import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Building, 
  Users, 
  Car, 
  Dog, 
  ShieldCheck, 
  Mail, 
  Phone, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  Star,
  Info,
  ChevronDown,
  Lock,
  Sparkles,
  Tag,
  ShieldAlert,
  FileText
} from 'lucide-react';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';

export default function MiInmuebleModulo({ user }) {
  const [unidades, setUnidades] = useState([]);
  const [selectedUnidadId, setSelectedUnidadId] = useState(null);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [activeTab, setActiveTab] = useState('residentes'); // 'residentes' | 'vehiculos' | 'mascotas'

  // Datos del inmueble seleccionado
  const [habitantes, setHabitantes] = useState([]);
  const [loadingHabitantes, setLoadingHabitantes] = useState(false);

  const [vehiculos, setVehiculos] = useState([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  const [mascotas, setMascotas] = useState([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);

  const [notif, setNotif] = useState(null);

  const toast = useToast();
  const showNotif = (type, text) => {
    if (type === 'success') toast.success(text);
    else if (type === 'error') toast.error(text);
    else if (type === 'warning') toast.warning(text);
    else toast.info(text);
  };

  // 1. Cargar las unidades del usuario actual
  const fetchMisInmuebles = async () => {
    try {
      setLoadingUnidades(true);
      const res = await api.get('/unidades/mis-inmuebles');
      const misUnidades = Array.isArray(res.data) ? res.data : [];
      setUnidades(misUnidades);

      if (misUnidades.length > 0) {
        setSelectedUnidadId(misUnidades[0].id);
      }
    } catch (err) {
      console.error("Error al obtener mis inmuebles:", err);
      showNotif('error', 'No se pudieron cargar los datos de tus inmuebles asociados.');
    } finally {
      setLoadingUnidades(false);
    }
  };

  useEffect(() => {
    fetchMisInmuebles();
  }, [user?.documento]);

  // Unidad activa seleccionada
  const selectedUnidad = unidades.find(u => u.id === Number(selectedUnidadId)) || unidades[0];

  // 2. Cargar habitantes, vehículos y mascotas cuando cambia la unidad seleccionada
  useEffect(() => {
    if (!selectedUnidad?.id) return;

    const fetchDetallesUnidad = async () => {
      // Cargar habitantes
      try {
        setLoadingHabitantes(true);
        const resH = await api.get(`/unidades/${selectedUnidad.id}/habitantes`);
        setHabitantes(Array.isArray(resH.data) ? resH.data : []);
      } catch (err) {
        console.error("Error al cargar habitantes:", err);
      } finally {
        setLoadingHabitantes(false);
      }

      // Cargar vehículos
      try {
        setLoadingVehiculos(true);
        const resV = await api.get(`/unidades/${selectedUnidad.id}/vehiculos`);
        setVehiculos(Array.isArray(resV.data) ? resV.data : []);
      } catch (err) {
        console.error("Error al cargar vehículos:", err);
      } finally {
        setLoadingVehiculos(false);
      }

      // Cargar mascotas
      try {
        setLoadingMascotas(true);
        const resM = await api.get(`/unidades/${selectedUnidad.id}/mascotas`);
        setMascotas(Array.isArray(resM.data) ? resM.data : []);
      } catch (err) {
        console.error("Error al cargar mascotas:", err);
      } finally {
        setLoadingMascotas(false);
      }
    };

    fetchDetallesUnidad();
  }, [selectedUnidad?.id]);

  return (
    <div className="space-y-6 animate-fadeIn w-full pb-12">
      
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

      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-2xl border border-teal-500/30 shadow-lg shadow-teal-500/20">
              <Home className="w-6 h-6" />
            </div>
            Gestión de Inmueble
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consulta de información registrada sobre tus unidades privadas, censo de residentes, vehículos y mascotas.
          </p>
        </div>

        {/* Banner Informativo Solo Lectura */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 shrink-0">
          <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium">Modo Solo Lectura (Copropietario)</span>
        </div>
      </div>

      {/* Cargando Unidades Iniciales */}
      {loadingUnidades ? (
        <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">Cargando tus inmuebles registrados...</p>
        </div>
      ) : unidades.length === 0 ? (
        <div className="p-10 glass-panel border border-slate-800 rounded-3xl text-center space-y-4">
          <div className="p-4 bg-slate-900 text-slate-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-slate-800">
            <Building className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No se encontraron inmuebles asociados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Actualmente tu documento (<strong className="text-white">{user?.documento}</strong>) no figura como propietario titular, apoderado o habitante en ninguna unidad privada registrada.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Si crees que esto es un error, por favor contacta a la administración de tu conjunto residencial.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Tarjeta Resumen del Inmueble Seleccionado + Selector si posee más de uno */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-teal-400">
                  <Building className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                      Unidad Privada Active
                    </span>
                    {unidades.length > 1 && (
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                        {unidades.length} Inmuebles registrados
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    Torre {selectedUnidad.torre} — Apartamento {selectedUnidad.numeroUnidad}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>Coeficiente: <strong className="text-white">{selectedUnidad.coeficiente}%</strong></span>
                    <span>•</span>
                    <span>Propietario: <strong className="text-white">{selectedUnidad.propietario?.nombreCompleto || 'No asignado'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Selector si el usuario tiene múltiples inmuebles */}
              {unidades.length > 1 && (
                <div className="shrink-0 space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Seleccionar Inmueble:</label>
                  <div className="relative">
                    <select
                      value={selectedUnidadId}
                      onChange={(e) => setSelectedUnidadId(Number(e.target.value))}
                      className="w-full md:w-64 px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-2xl text-white text-xs font-bold appearance-none cursor-pointer pr-10"
                    >
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>
                          Torre {u.torre} - Apt {u.numeroUnidad} ({u.coeficiente}%)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banner de Aviso de Actualización de Datos */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Información sincronizada con la Administración:</strong> Los datos presentados a continuación corresponden al registro oficial de la copropiedad. Para solicitar la actualización o adición de residentes, parqueaderos o mascotas, por favor ponte en contacto con la administración.
            </div>
          </div>

          {/* Pestañas de Navegación del Módulo */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('residentes')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'residentes'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>Residentes ({habitantes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vehiculos')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'vehiculos'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Car className="w-4 h-4 text-indigo-400" />
              <span>Vehículos & Celdas ({vehiculos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mascotas')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'mascotas'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Dog className="w-4 h-4 text-amber-400" />
              <span>Mascotas Registradas ({mascotas.length})</span>
            </button>
          </div>

          {/* CONTENIDO PESTAÑA 1: RESIDENTES */}
          {activeTab === 'residentes' && (
            <div className="space-y-4 animate-fadeIn">
              {loadingHabitantes ? (
                <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Cargando habitantes de la unidad...</p>
                </div>
              ) : habitantes.length === 0 ? (
                <div className="p-8 bg-slate-950/40 border border-slate-800 rounded-3xl text-center space-y-2">
                  <p className="text-xs text-slate-400">No hay residentes registrados formalmente en este inmueble.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habitantes.map((h) => {
                    const p = h.persona;
                    return (
                      <div key={h.id} className="glass-panel p-5 rounded-3xl border border-slate-800/80 bg-slate-950/70 space-y-3 hover:border-slate-700 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-2xl">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-white text-sm">{p?.nombreCompleto || 'Residente'}</h4>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">Cédula / Doc: {p?.cedula || 'N/A'}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                            {h.parentesco || 'INTEGRANTE'}
                          </span>
                        </div>

                        {(p?.email || p?.telefono) && (
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5">
                            {p.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" />{p.email}</span>}
                            {p.telefono && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" />{p.telefono}</span>}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                          {h.esPropietarioPrincipal && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-emerald-400" /> Propietario Titular
                            </span>
                          )}

                          {h.esArrendatario && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              Arrendatario / Inquilino
                            </span>
                          )}

                          {h.esApoderadoDesignado && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Apoderado en Asamblea
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO PESTAÑA 2: VEHÍCULOS */}
          {activeTab === 'vehiculos' && (
            <div className="space-y-4 animate-fadeIn">
              {loadingVehiculos ? (
                <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Cargando vehículos registrados...</p>
                </div>
              ) : vehiculos.length === 0 ? (
                <div className="p-8 bg-slate-950/40 border border-slate-800 rounded-3xl text-center space-y-2">
                  <Car className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No hay vehículos registrados para este inmueble.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehiculos.map((v) => (
                    <div key={v.id} className="glass-panel p-5 rounded-3xl border border-slate-800/80 bg-slate-950/70 space-y-3 hover:border-indigo-500/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-2xl">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest font-mono">
                              {v.placa}
                            </span>
                            <h4 className="font-extrabold text-white text-sm mt-1">{v.marcaModelo || 'Vehículo'}</h4>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-indigo-300 border border-slate-800">
                          {v.tipo}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
                        {v.color && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Color:</span>
                            <span className="font-semibold text-slate-200">{v.color}</span>
                          </div>
                        )}

                        {v.parqueadero && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Celda / Parqueadero:</span>
                            <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                              {v.parqueadero}
                            </span>
                          </div>
                        )}

                        {v.observaciones && (
                          <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/40">
                            "{v.observaciones}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO PESTAÑA 3: MASCOTAS */}
          {activeTab === 'mascotas' && (
            <div className="space-y-4 animate-fadeIn">
              {loadingMascotas ? (
                <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Cargando censo de mascotas...</p>
                </div>
              ) : mascotas.length === 0 ? (
                <div className="p-8 bg-slate-950/40 border border-slate-800 rounded-3xl text-center space-y-2">
                  <Dog className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No hay mascotas registradas en el censo de este inmueble.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mascotas.map((m) => (
                    <div key={m.id} className="glass-panel p-5 rounded-3xl border border-slate-800/80 bg-slate-950/70 space-y-3 hover:border-amber-500/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl">
                            <Dog className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-sm">{m.nombre}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{m.tipo} {m.raza ? `• ${m.raza}` : ''}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          m.vacunasAlDia 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}>
                          {m.vacunasAlDia ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-rose-400" />}
                          {m.vacunasAlDia ? 'Vacunas al Día' : 'Pendiente'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
                        {m.color && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Color:</span>
                            <span className="font-semibold text-slate-200">{m.color}</span>
                          </div>
                        )}

                        {m.observaciones && (
                          <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/40">
                            "{m.observaciones}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
