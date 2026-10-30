import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Mail, 
  Users, 
  Building, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  UserPlus, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Pencil,
  Phone
} from 'lucide-react';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';
import GestorPlantillasEmail from './GestorPlantillasEmail';

export default function ConfiguracionPhModulo({ user }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'gestores' | 'copropiedad'

  // Datos de la copropiedad actual
  const [copropiedad, setCopropiedad] = useState(null);
  const [loadingCop, setLoadingCop] = useState(false);
  const [savingCop, setSavingCop] = useState(false);

  // Formulario Copropiedad
  const [nombreCop, setNombreCop] = useState('');
  const [direccionCop, setDireccionCop] = useState('');

  // Datos de Gestores
  const [gestores, setGestores] = useState([]);
  const [loadingGestores, setLoadingGestores] = useState(false);
  const [showCrearGestor, setShowCrearGestor] = useState(false);
  const [docGestor, setDocGestor] = useState('');
  const [nombreGestor, setNombreGestor] = useState('');
  const [emailGestor, setEmailGestor] = useState('');
  const [telGestor, setTelGestor] = useState('');
  const [savingGestor, setSavingGestor] = useState(false);

  const activeCopId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id');

  useEffect(() => {
    fetchCopropiedad();
    fetchGestores();
  }, [activeCopId]);

  const fetchCopropiedad = async () => {
    try {
      setLoadingCop(true);
      const res = await api.get('/copropiedades');
      const lista = res.data || [];
      if (lista.length > 0) {
        const actual = activeCopId ? lista.find(c => c.id === parseInt(activeCopId)) || lista[0] : lista[0];
        setCopropiedad(actual);
        setNombreCop(actual.nombre || '');
        setDireccionCop(actual.direccion || '');
      }
    } catch (err) {
      console.error("Error cargando copropiedad:", err);
    } finally {
      setLoadingCop(false);
    }
  };

  const fetchGestores = async () => {
    try {
      setLoadingGestores(true);
      const url = activeCopId ? `/gestores?copropiedadId=${activeCopId}` : '/gestores';
      const res = await api.get(url);
      setGestores(res.data || []);
    } catch (err) {
      console.error("Error cargando gestores:", err);
    } finally {
      setLoadingGestores(false);
    }
  };

  const handleGuardarCopropiedad = async (e) => {
    e.preventDefault();
    if (!copropiedad) return;
    try {
      setSavingCop(true);
      await api.put(`/copropiedades/${copropiedad.id}`, {
        nombre: nombreCop.trim(),
        direccion: direccionCop.trim(),
        nit: copropiedad.nit,
        coeficienteTotal: copropiedad.coeficienteTotal
      });
      toast.success("Información del conjunto actualizada correctamente.", "Copropiedad Guardada");
      fetchCopropiedad();
    } catch (err) {
      console.error("Error al guardar copropiedad:", err);
      toast.error(err.response?.data?.message || "No se pudo actualizar la copropiedad.", "Error");
    } finally {
      setSavingCop(false);
    }
  };

  const handleCrearGestor = async (e) => {
    e.preventDefault();
    if (!docGestor.trim() || !nombreGestor.trim() || !emailGestor.trim()) {
      toast.error("Documento, Nombre y Correo son obligatorios.", "Faltan Campos");
      return;
    }

    try {
      setSavingGestor(true);
      await api.post('/gestores', {
        copropiedadId: activeCopId ? parseInt(activeCopId) : null,
        cedula: docGestor.trim(),
        nombreCompleto: nombreGestor.trim(),
        email: emailGestor.trim(),
        telefono: telGestor.trim() || null
      });

      toast.success(`Gestor "${nombreGestor}" creado exitosamente.`, "Gestor Creado");
      setDocGestor('');
      setNombreGestor('');
      setEmailGestor('');
      setTelGestor('');
      setShowCrearGestor(false);
      fetchGestores();
    } catch (err) {
      console.error("Error creando gestor:", err);
      toast.error(err.response?.data?.message || "No se pudo registrar el gestor.", "Error");
    } finally {
      setSavingGestor(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header del Módulo */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-inner">
              <Settings className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Configuración de la Copropiedad
                <span className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-mono font-semibold">
                  Admin PH
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalización de plantillas de correo, gestores de registro y parámetros del conjunto residencial.
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              activeTab === 'email'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20'
                : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Plantillas de Correo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gestores')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              activeTab === 'gestores'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20'
                : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestores de Registro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copropiedad')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              activeTab === 'copropiedad'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20'
                : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Parámetros del Conjunto</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: PLANTILLAS DE CORREO */}
      {activeTab === 'email' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl animate-fadeIn">
          <GestorPlantillasEmail
            activeTenantId={activeCopId}
            notifySuccess={(tit, msg) => toast.success(msg, tit)}
            notifyError={(tit, msg) => toast.error(msg, tit)}
          />
        </div>
      )}

      {/* PESTAÑA 2: GESTORES DE REGISTRO */}
      {activeTab === 'gestores' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Administración de Gestores de Registro
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Usuarios habilitados para operar la mesa de registro e ingreso en asambleas presenciales.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCrearGestor(prev => !prev)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{showCrearGestor ? 'Cancelar' : '+ Nuevo Gestor'}</span>
              </button>
            </div>

            {/* Formulario Crear Gestor */}
            {showCrearGestor && (
              <form onSubmit={handleCrearGestor} className="p-5 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-4 animate-fadeIn text-xs">
                <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  Registrar Nuevo Usuario Gestor
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Documento / Cédula *</label>
                    <input
                      type="text"
                      required
                      value={docGestor}
                      onChange={(e) => setDocGestor(e.target.value)}
                      placeholder="Ej. 10203040"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={nombreGestor}
                      onChange={(e) => setNombreGestor(e.target.value)}
                      placeholder="Ej. Maria Gestora de Registro"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={emailGestor}
                      onChange={(e) => setEmailGestor(e.target.value)}
                      placeholder="Ej. gestor@ejemplo.com"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={telGestor}
                      onChange={(e) => setTelGestor(e.target.value)}
                      placeholder="Ej. 3001234567"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingGestor}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingGestor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Guardar Gestor</span>
                  </button>
                </div>
              </form>
            )}

            {/* Listado de Gestores */}
            {loadingGestores ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Cargando gestores...
              </div>
            ) : gestores.length === 0 ? (
              <p className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
                No hay usuarios gestores registrados en el sistema.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gestores.map((g) => (
                  <div key={g.id || g.documento} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-sm hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{g.nombreCompleto || g.username}</h4>
                        <p className="text-xs text-slate-400 font-mono">Doc: {g.documento || 'N/A'}</p>
                      </div>

                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        Gestor Activo
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800/80 pt-2 font-mono">
                      {g.email && <p>📧 {g.email}</p>}
                      {g.telefono && <p>📞 {g.telefono}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PARÁMETROS DE LA COPROPIEDAD */}
      {activeTab === 'copropiedad' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="p-3 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-2xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Parámetros del Conjunto Residencial</h3>
              <p className="text-xs text-slate-400">Datos institucionales y de contacto de la copropiedad actual.</p>
            </div>
          </div>

          {loadingCop ? (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Cargando información de la copropiedad...
            </div>
          ) : !copropiedad ? (
            <p className="p-8 text-center text-slate-500 text-xs">No se encontró información de la copropiedad activa.</p>
          ) : (
            <form onSubmit={handleGuardarCopropiedad} className="space-y-4 text-xs w-full max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Conjunto *</label>
                  <input
                    type="text"
                    required
                    value={nombreCop}
                    onChange={(e) => setNombreCop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">NIT (Lectura de Sistema)</label>
                  <input
                    type="text"
                    disabled
                    value={copropiedad.nit || 'N/A'}
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Dirección Física *</label>
                  <input
                    type="text"
                    required
                    value={direccionCop}
                    onChange={(e) => setDireccionCop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingCop}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingCop ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingCop ? 'Guardando Cambios...' : 'Guardar Información'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
