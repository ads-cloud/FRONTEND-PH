import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';
import PaginationControls from './PaginationControls';
import { 
  Building2, PlusCircle, ShieldCheck, UserPlus, Building, Lock, AlertCircle, 
  CheckCircle2, RefreshCw, User, Phone, Mail, Edit3, FileText, Activity, 
  Database, Radio, Server, SlidersHorizontal, X, Check, Search, Vote, 
  Megaphone, CreditCard, MessageSquare, Settings, MailCheck, Clock, AlertTriangle, Layers, ChevronDown, ChevronRight, Sparkles, Play, Pause, Power 
} from 'lucide-react';

const ICON_MAP = {
  Vote,
  User,
  Building,
  Building2,
  Megaphone,
  CreditCard,
  MessageSquare,
  Activity,
  Settings,
};

export const formatNit = (val) => {
  if (!val) return 'N/A';
  const digits = val.toString().replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export default function SuperAdminDashboard({ health, defaultTab = 'monitoreo' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'monitoreo' | 'ph'

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  const toast = useToast();
  const [copropiedades, setCopropiedades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Paginación de Copropiedades (Pestaña PH)
  const [pageCop, setPageCop] = useState(0);
  const [pageSizeCop, setPageSizeCop] = useState(6);
  const [totalPagesCop, setTotalPagesCop] = useState(1);
  const [totalElementsCop, setTotalElementsCop] = useState(0);

  // Estados de Paginación para Monitoreo PH (Pestaña Monitoreo)
  const [pagePh, setPagePh] = useState(0);
  const [pageSizePh, setPageSizePh] = useState(6);

  const [liveHealth, setLiveHealth] = useState(health);
  const [refreshingEmailCard, setRefreshingEmailCard] = useState(false);
  const [refreshingRabbitCard, setRefreshingRabbitCard] = useState(false);

  // Estados para Modal de Módulos por PH
  const [showModulosModal, setShowModulosModal] = useState(false);
  const [selectedCopForModulos, setSelectedCopForModulos] = useState(null);
  const [todosModulosSistema, setTodosModulosSistema] = useState([]);
  const [modulosPhState, setModulosPhState] = useState({});
  const [loadingModulosPh, setLoadingModulosPh] = useState(false);
  const [savingModulosPh, setSavingModulosPh] = useState(false);
  const [searchModuloTerm, setSearchModuloTerm] = useState('');
  const [searchPhTerm, setSearchPhTerm] = useState('');
  const [searchConjuntoTerm, setSearchConjuntoTerm] = useState('');
  // Estados para secciones colapsables: Infraestructura visible por defecto (true)
  const [showInfraSection, setShowInfraSection] = useState(true);
  const [showPhSection, setShowPhSection] = useState(true);

  useEffect(() => {
    // Al cargar el componente o cambiar a la pestaña de monitoreo, obtener datos frescos
    fetchHealthData('all');
  }, [activeTab]);

  const fetchHealthData = async (target = 'all') => {
    try {
      if (target === 'email') setRefreshingEmailCard(true);
      if (target === 'rabbit') setRefreshingRabbitCard(true);
      
      const res = await api.get('/health');
      setLiveHealth(res.data);
    } catch (e) {
      console.error("Error al refrescar health:", e);
    } finally {
      if (target === 'email') setRefreshingEmailCard(false);
      if (target === 'rabbit') setRefreshingRabbitCard(false);
    }
  };

  const [togglingNotificaciones, setTogglingNotificaciones] = useState(false);

  const handleToggleNotificaciones = async () => {
    try {
      setTogglingNotificaciones(true);
      const res = await api.post('/health/notificaciones/toggle');
      const activo = res.data?.activo;
      const msg = res.data?.message || (activo ? 'Envío de notificaciones reanudado exitosamente.' : 'Envío de notificaciones pausado exitosamente.');
      if (activo) {
        toast.success(msg, 'Envíos Reanudados');
      } else {
        toast.warning(msg, 'Envíos Pausados');
      }
      await fetchHealthData('email');
    } catch (e) {
      console.error("Error al alternar estado de notificaciones:", e);
      toast.error(e.response?.data?.message || "No se pudo cambiar el estado de las notificaciones.", "Error");
    } finally {
      setTogglingNotificaciones(false);
    }
  };

  const [togglingPhNotifs, setTogglingPhNotifs] = useState({});

  const handleToggleNotificacionesPh = async (copId) => {
    try {
      setTogglingPhNotifs(prev => ({ ...prev, [copId]: true }));
      const res = await api.patch(`/copropiedades/${copId}/toggle-notificaciones`);
      const nuevoEstado = res.data?.notificacionesHabilitadas;
      const phNombre = res.data?.nombre || '';
      if (nuevoEstado) {
        toast.success(`Notificaciones por correo habilitadas para ${phNombre}`, 'Envíos PH Activos');
      } else {
        toast.warning(`Notificaciones por correo pausadas para ${phNombre}`, 'Envíos PH Pausados');
      }
      setCopropiedades(prev => prev.map(c => c.id === copId ? { ...c, notificacionesHabilitadas: nuevoEstado } : c));
    } catch (e) {
      console.error("Error al alternar notificaciones de PH:", e);
      toast.error(e.response?.data?.message || "No se pudo cambiar el estado de las notificaciones para este conjunto.", "Error");
    } finally {
      setTogglingPhNotifs(prev => ({ ...prev, [copId]: false }));
    }
  };

  // Form para nueva copropiedad
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoNit, setNuevoNit] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoCoeficiente, setNuevoCoeficiente] = useState(100.0);
  const [submitting, setSubmitting] = useState(false);

  // Form para asignar/crear admin
  const [selectedCopropiedadId, setSelectedCopropiedadId] = useState(null);
  const [documentoAdmin, setDocumentoAdmin] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [telefonoAdmin, setTelefonoAdmin] = useState('');
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const [adminVerificadoInfo, setAdminVerificadoInfo] = useState(null);
  const [verificandoAdmin, setVerificandoAdmin] = useState(false);

  const verificarAdminPorCedula = async (doc, copId) => {
    const cedulaLimpia = (doc || '').trim();
    if (!cedulaLimpia || cedulaLimpia.length < 5) {
      setAdminVerificadoInfo(null);
      return;
    }
    try {
      setVerificandoAdmin(true);
      const res = await api.get(`/copropiedades/verificar-admin?documento=${encodeURIComponent(cedulaLimpia)}&copropiedadId=${copId || ''}`);
      if (res.data && res.data.existe) {
        setAdminVerificadoInfo(res.data);
        setNombreAdmin(res.data.nombreCompleto || '');
        setEmailAdmin(res.data.email || '');
        setTelefonoAdmin(res.data.telefono || '');
      } else {
        // La cédula no existe: limpiar formulario para evitar que queden datos precargados de otra persona
        setAdminVerificadoInfo({ existe: false });
        setNombreAdmin('');
        setEmailAdmin('');
        setTelefonoAdmin('');
      }
    } catch (e) {
      console.warn("No se pudo verificar cédula del admin:", e);
      setAdminVerificadoInfo(null);
    } finally {
      setVerificandoAdmin(false);
    }
  };

  useEffect(() => {
    if (!selectedCopropiedadId) return;
    const cedulaLimpia = (documentoAdmin || '').trim();
    if (cedulaLimpia.length === 0) {
      setAdminVerificadoInfo(null);
      setNombreAdmin('');
      setEmailAdmin('');
      setTelefonoAdmin('');
      return;
    }
    if (cedulaLimpia.length < 5) {
      setAdminVerificadoInfo(null);
      return;
    }
    const timer = setTimeout(() => {
      verificarAdminPorCedula(documentoAdmin, selectedCopropiedadId);
    }, 450);
    return () => clearTimeout(timer);
  }, [documentoAdmin, selectedCopropiedadId]);

  const fetchCopropiedades = async (pageTarget = pageCop, sizeTarget = pageSizeCop) => {
    setLoading(true);
    try {
      const res = await api.get(`/copropiedades?page=${pageTarget}&size=${sizeTarget}`);
      if (res.data && res.data.content) {
        setCopropiedades(res.data.content);
        setPageCop(res.data.page);
        setPageSizeCop(res.data.size);
        setTotalPagesCop(res.data.totalPages);
        setTotalElementsCop(res.data.totalElements);
      } else if (Array.isArray(res.data)) {
        setCopropiedades(res.data);
        setTotalElementsCop(res.data.length);
        setTotalPagesCop(1);
      }
    } catch (err) {
      console.error("[SuperAdminDashboard] Error al cargar copropiedades:", err);
      const detalleError = err.response?.data?.message || err.message || "Error de conexión con el servidor.";
      toast.error(`No se pudieron cargar los conjuntos residenciales: ${detalleError}`, 'Error al Cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopropiedades(pageCop, pageSizeCop);
  }, [pageCop, pageSizeCop]);

  const handleCrearCopropiedad = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      toast.error('El nombre del conjunto es obligatorio.', 'Campo Requerido');
      return;
    }
    if (!nuevoNit.trim()) {
      toast.error('El NIT del conjunto es obligatorio.', 'Campo Requerido');
      return;
    }
    if (!nuevaDireccion.trim()) {
      toast.error('La dirección del conjunto es obligatoria.', 'Campo Requerido');
      return;
    }
    if (!nuevoCoeficiente || parseFloat(nuevoCoeficiente) <= 0) {
      toast.error('El coeficiente total es obligatorio y debe ser un número mayor a 0.', 'Campo Requerido');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/copropiedades', {
        nombre: nuevoNombre.trim(),
        nit: nuevoNit.trim(),
        direccion: nuevaDireccion.trim(),
        totalCoeficiente: parseFloat(nuevoCoeficiente) || 100.0
      });
      const msg = `Conjunto "${res.data.nombre}" registrado exitosamente.`;
      toast.success(msg, 'Conjunto Registrado');
      setNuevoNombre('');
      setNuevoNit('');
      setNuevaDireccion('');
      fetchCopropiedades();
    } catch (err) {
      console.error("[SuperAdminDashboard] Error al crear copropiedad:", err);
      const detalleError = err.response?.data?.message || err.message;
      const errMsg = `Error al crear la copropiedad: ${detalleError}`;
      toast.error(errMsg, 'Error al Crear');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbrirFormAdmin = (cop, admin) => {
    if (selectedCopropiedadId === cop.id) {
      setSelectedCopropiedadId(null);
      setAdminVerificadoInfo(null);
    } else {
      setSelectedCopropiedadId(cop.id);
      setAdminVerificadoInfo(null);
      setDocumentoAdmin(admin?.documento || '');
      setNombreAdmin(admin?.nombreCompleto || '');
      setEmailAdmin(admin?.email || '');
      setTelefonoAdmin(admin?.telefono || '');
    }
  };

  const handleAsignarAdmin = async (copropiedadId) => {
    if (!documentoAdmin.trim()) {
      toast.error('El número de documento es obligatorio.', 'Campo Requerido');
      return;
    }

    if (!nombreAdmin.trim()) {
      toast.error('El nombre completo del administrador es obligatorio.', 'Campo Requerido');
      return;
    }

    if (!emailAdmin.trim()) {
      toast.error('El correo electrónico del administrador es obligatorio.', 'Campo Requerido');
      return;
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(emailAdmin.trim())) {
      toast.error('Ingresa un correo electrónico con un formato válido (ej. usuario@ejemplo.com).', 'Correo Inválido');
      return;
    }

    if (!telefonoAdmin.trim()) {
      toast.error('El teléfono del administrador es obligatorio.', 'Campo Requerido');
      return;
    }

    setAssigningAdmin(true);

    try {
      const res = await api.post(`/copropiedades/${copropiedadId}/asignar-admin`, {
        documento: documentoAdmin.trim(),
        nombreCompleto: nombreAdmin.trim(),
        email: emailAdmin.trim(),
        telefono: telefonoAdmin.trim()
      });
      const msg = `Datos del administrador "${res.data.nombreCompleto}" (Doc: ${res.data.documento}) guardados correctamente.`;
      toast.success(msg, 'Administrador Guardado');
      setDocumentoAdmin('');
      setNombreAdmin('');
      setEmailAdmin('');
      setTelefonoAdmin('');
      setAdminVerificadoInfo(null);
      setSelectedCopropiedadId(null);
      fetchCopropiedades();
    } catch (err) {
      console.error("[SuperAdminDashboard] Error al asignar administrador:", err);
      const errMsg = "Error al vincular/crear administrador: " + (err.response?.data?.message || err.message);
      toast.error(errMsg, 'Error al Asignar Admin');
    } finally {
      setAssigningAdmin(false);
    }
  };

  const copropiedadesFiltradas = copropiedades.filter((cop) => {
    if (!searchConjuntoTerm.trim()) return true;
    const term = searchConjuntoTerm.toLowerCase().trim();
    const nombre = (cop.nombre || '').toLowerCase();
    const nit = (cop.nit || '').toLowerCase();
    const direccion = (cop.direccion || '').toLowerCase();
    const admin = cop.administradores && cop.administradores.length > 0 ? cop.administradores[0] : null;
    const adminNombre = (admin?.nombreCompleto || '').toLowerCase();
    const adminDoc = (admin?.documento || '').toLowerCase();
    const adminEmail = (admin?.email || '').toLowerCase();
    return nombre.includes(term) || nit.includes(term) || direccion.includes(term) || 
           adminNombre.includes(term) || adminDoc.includes(term) || adminEmail.includes(term);
  });

  return (
    <div className="space-y-6">



      {/* TAB: Monitoreo del Sistema */}
      {activeTab === 'monitoreo' && (
        <div className="space-y-6">
          {/* SECCIÓN 1 GENERAL: Estado del Sistema & Infraestructura (Colapsable por defecto) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all">
            {/* Header Clicable */}
            <div
              onClick={() => setShowInfraSection(prev => !prev)}
              className="p-6 cursor-pointer hover:bg-slate-800/40 transition-colors flex items-center justify-between select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
                  <Activity className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    Estado del Sistema & Infraestructura
                  </h3>
                  <p className="text-xs text-slate-400">Estado global de servicios backend, base de datos, correos y cola de mensajes</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-extrabold rounded-full border flex items-center gap-2 ${
                  health?.status === 'UP' || !health
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    health?.status === 'UP' || !health ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}></span>
                  SISTEMA {health?.status || 'UP'}
                </span>

                <button type="button" className="p-1 text-slate-400 hover:text-white transition-colors">
                  {showInfraSection ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Contenido Desplegable de Infraestructura */}
            {showInfraSection && (
              <div className="p-6 pt-0 space-y-6 border-t border-slate-800/80 animate-fadeIn">
                {/* Grid de Servicios Base */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  {/* Servidor General / API */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Server className="w-5 h-5" />
                        <span className="font-bold text-xs text-slate-200">Servidor API / Backend</span>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        liveHealth?.status === 'UP' || !liveHealth
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {liveHealth?.status || 'UP'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Microservicio principal Spring Boot escuchando en el puerto backend.
                    </p>
                  </div>

                  {/* Base de Datos */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Database className="w-5 h-5" />
                        <span className="font-bold text-xs text-slate-200">Base de Datos PostgreSQL</span>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        liveHealth?.database === 'UP' || !liveHealth
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {liveHealth?.database || 'UP'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Conexión activa a PostgreSQL (Multi-tenant schema / datos).
                    </p>
                  </div>

                  {/* Servicio de Mensajería General */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Radio className="w-5 h-5" />
                        <span className="font-bold text-xs text-slate-200">Broker RabbitMQ</span>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        liveHealth?.rabbitmq === 'UP' || !liveHealth
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {liveHealth?.rabbitmq || 'UP'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Broker de eventos asíncronos y sincronización de votaciones.
                    </p>
                  </div>
                </div>

                {/* MONITOREO DETALLADO: Notificaciones por Correo & Colas RabbitMQ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                  {/* Tarjeta 1: Notificaciones por Correo en sus distintos estados */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-white">Notificaciones por Correo</h4>
                            <p className="text-[11px] text-slate-400">Estados de correos transaccionales</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Interruptor Interactivo On/Off para Envíos */}
                          <button
                            type="button"
                            onClick={handleToggleNotificaciones}
                            disabled={togglingNotificaciones}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 ${
                              (liveHealth?.notificacionesEmail?.activo ?? true)
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-sm'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 shadow-sm'
                            }`}
                            title={(liveHealth?.notificacionesEmail?.activo ?? true) ? 'Haga clic para pausar el despacho de correos' : 'Haga clic para reanudar el despacho de correos'}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              (liveHealth?.notificacionesEmail?.activo ?? true)
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                                : 'bg-rose-400 animate-ping'
                            }`} />
                            {togglingNotificaciones ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (liveHealth?.notificacionesEmail?.activo ?? true) ? (
                              <span className="flex items-center gap-1">
                                <Pause className="w-3 h-3 text-emerald-400" /> Activo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Play className="w-3 h-3 text-rose-400" /> Pausado
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => fetchHealthData('email')}
                            disabled={refreshingEmailCard}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            title="Actualizar notificaciones"
                          >
                            <RefreshCw className={`w-4 h-4 ${refreshingEmailCard ? 'animate-spin text-purple-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Alerta visible si el servicio está pausado */}
                      {liveHealth?.notificacionesEmail && liveHealth.notificacionesEmail.activo === false && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs text-rose-200">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <span>El despacho automático está <strong>pausado</strong>. Los correos se acumularán en <em>Pendientes</em>.</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggleNotificaciones}
                            disabled={togglingNotificaciones}
                            className="ml-2 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Reanudar
                          </button>
                        </div>
                      )}

                      {/* Metricas por Estado */}
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-0.5">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-400 uppercase">
                            <Clock className="w-3 h-3" /> Pendientes
                          </div>
                          <span className="text-xl font-black text-amber-300 font-mono">
                            {liveHealth?.notificacionesEmail?.pendientes ?? 0}
                          </span>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-0.5">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                            <MailCheck className="w-3 h-3" /> Enviados
                          </div>
                          <span className="text-xl font-black text-emerald-300 font-mono">
                            {liveHealth?.notificacionesEmail?.enviados ?? 0}
                          </span>
                        </div>

                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-0.5">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-rose-400 uppercase">
                            <AlertTriangle className="w-3 h-3" /> Fallidos
                          </div>
                          <span className="text-xl font-black text-rose-300 font-mono">
                            {liveHealth?.notificacionesEmail?.fallidos ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Total Registros Encolados:</span>
                      <span className="font-bold text-slate-300 font-mono">
                        {liveHealth?.notificacionesEmail?.total ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta 2: Colas en RabbitMQ procesándose */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-white">Colas Procesándose en RabbitMQ</h4>
                            <p className="text-[11px] text-slate-400">Monitoreo activo de mensajes por cola</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => fetchHealthData('rabbit')}
                          disabled={refreshingRabbitCard}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          title="Actualizar colas RabbitMQ"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshingRabbitCard ? 'animate-spin text-indigo-400' : ''}`} />
                        </button>
                      </div>

                      {/* Lista de Colas */}
                      <div className="space-y-2 pt-1">
                        {(liveHealth?.colasRabbit && liveHealth.colasRabbit.length > 0) ? (
                          liveHealth.colasRabbit.map((q, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-slate-200 text-[11px]">
                                  {q.nombreCola}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>Consumidores: <strong className="text-emerald-400">{q.consumidoresActivos}</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  {q.mensajesPendientes} msgs
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                  q.estado === 'ACTIVA'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {q.estado}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 text-xs font-mono">
                            No hay métricas de colas disponibles.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Colas Monitoreadas:</span>
                      <span className="font-bold text-slate-300 font-mono">
                        {liveHealth?.colasRabbit?.length || 0} Colas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2 GENERAL: Monitoreo por Propiedad Horizontal (PH) (Colapsable por defecto) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all">
            {/* Header Clicable */}
            <div
              onClick={() => setShowPhSection(prev => !prev)}
              className="p-6 cursor-pointer hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <Building className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    Monitoreo por Propiedad Horizontal
                  </h3>
                  <p className="text-xs text-slate-400">Estado operativo en tiempo real de conjuntos residenciales, quórum y asambleas activas</p>
                </div>
              </div>

              {/* Buscador de PH y Contador */}
              <div className="flex items-center gap-3 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchPhTerm}
                    onChange={(e) => setSearchPhTerm(e.target.value)}
                    placeholder="Buscar conjunto por nombre o NIT..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                </div>

                <span className="text-xs px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-mono font-bold shrink-0">
                  {(liveHealth?.copropiedadesMonitoreo?.length || copropiedades?.length || 0)} PHs
                </span>

                <button type="button" onClick={() => setShowPhSection(prev => !prev)} className="p-1 text-slate-400 hover:text-white transition-colors">
                  {showPhSection ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Contenido Desplegable de Monitoreo por PH */}
            {showPhSection && (
              <div className="p-6 pt-0 border-t border-slate-800/80 animate-fadeIn">
                    {(() => {
                      const allPhs = (liveHealth?.copropiedadesMonitoreo && liveHealth.copropiedadesMonitoreo.length > 0 
                        ? liveHealth.copropiedadesMonitoreo 
                        : copropiedades.map(c => ({
                            copropiedadId: c.id,
                            copropiedadNombre: c.nombre,
                            nit: c.nit,
                            unidadesRegistradas: c.unidadesPrivadas?.length || 0,
                            usuariosActivos: c.administradores?.length || 0
                          }))
                      )
                      .filter(ph => {
                        if (!searchPhTerm.trim()) return true;
                        const term = searchPhTerm.toLowerCase().trim();
                        const nombre = (ph.copropiedadNombre || ph.nombre || '').toLowerCase();
                        const nit = (ph.nit || '').toLowerCase();
                        return nombre.includes(term) || nit.includes(term);
                      });

                      const totalPhs = allPhs.length;
                      const totalPagesPhCalculated = Math.max(1, Math.ceil(totalPhs / pageSizePh));
                      const safePagePh = Math.min(pagePh, totalPagesPhCalculated - 1);
                      const paginatedPhs = allPhs.slice(safePagePh * pageSizePh, (safePagePh + 1) * pageSizePh);

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                            {paginatedPhs.map((ph) => {
                              const cardId = ph.copropiedadId || ph.id;

                              return (
                                <div key={cardId} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors shadow-lg">
                                  <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
                                    <div>
                                      <h5 className="font-bold text-white text-sm flex items-center gap-2">
                                        {ph.copropiedadNombre || ph.nombre}
                                        {ph.tieneAsambleaActiva && (
                                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Asamblea activa en curso" />
                                        )}
                                      </h5>
                                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIT: {formatNit(ph.nit)}</p>
                                    </div>
                                    <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                                      <Building2 className="w-4 h-4" />
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Unidades Registradas
                                      </span>
                                      <span className="block text-2xl font-black text-white font-mono">
                                        {ph.unidadesRegistradas ?? 0}
                                      </span>
                                    </div>

                                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Usuarios Activos
                                      </span>
                                      <span className="block text-2xl font-black text-emerald-400 font-mono">
                                        {ph.usuariosActivos ?? 0}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Sección de Asamblea Activa (si existe) */}
                                  {ph.tieneAsambleaActiva ? (
                                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                          Asamblea Activa
                                        </span>
                                        
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                            ph.asambleaEstado === 'EN_CURSO'
                                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                          }`}>
                                            {ph.asambleaEstado === 'EN_CURSO' ? '🟢 EN CURSO' : '🟡 CONVOCADA'}
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() => fetchHealthData('all')}
                                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
                                            title={`Actualizar métricas de ${ph.copropiedadNombre || 'la PH'}`}
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="pt-1.5 border-t border-indigo-500/20 space-y-1 text-[11px]">
                                        <div className="flex items-center justify-between text-slate-400">
                                          <span>Asistentes registrados:</span>
                                          <span className="font-bold text-emerald-400 font-mono">{ph.asistentesQuorum ?? 0} quórum</span>
                                        </div>

                                        <div className="flex items-center justify-between text-slate-400">
                                          <span>Ingreso de Votos:</span>
                                          <span className="font-bold text-purple-300 font-mono flex items-center gap-1">
                                            <Vote className="w-3 h-3 text-purple-400" />
                                            {ph.votosRegistrados ?? 0} votos
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="px-3 py-2 bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
                                      <span>Estado Asamblea:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-400">Sin asamblea activa</span>
                                        <button
                                          type="button"
                                          onClick={() => fetchHealthData('all')}
                                          className="p-1 text-slate-500 hover:text-slate-300 rounded-lg transition-all cursor-pointer"
                                          title="Actualizar estado"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Paginador de Monitoreo por PH */}
                          {totalPhs > 0 && (
                            <div className="pt-4">
                              <PaginationControls
                                currentPage={safePagePh}
                                totalPages={totalPagesPhCalculated}
                                totalElements={totalPhs}
                                pageSize={pageSizePh}
                                pageSizeOptions={[6, 12, 24, 48]}
                                onPageChange={(newPage) => setPagePh(newPage)}
                                onPageSizeChange={(newSize) => {
                                  setPageSizePh(newSize);
                                  setPagePh(0);
                                }}
                                itemName="PHs en monitoreo"
                              />
                            </div>
                          )}
                        </>
                      );
                    })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Administración de PH */}
      {activeTab === 'ph' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        {/* Formulario Registro de Conjunto */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Registrar Nuevo Conjunto</h3>
          </div>

          <form onSubmit={handleCrearCopropiedad} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nombre del Conjunto *</label>
              <input
                type="text"
                required
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Condominio Reserva del Sol"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">NIT *</label>
              <input
                type="text"
                required
                value={nuevoNit}
                onChange={(e) => setNuevoNit(formatNit(e.target.value))}
                placeholder="Ej. 900.123.123-9"
                maxLength={15}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Dirección *</label>
              <input
                type="text"
                required
                value={nuevaDireccion}
                onChange={(e) => setNuevaDireccion(e.target.value)}
                placeholder="Ej. Cra 45 # 120-15, Bogotá"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Coeficiente Total (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={nuevoCoeficiente}
                onChange={(e) => setNuevoCoeficiente(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              {submitting ? 'Registrando...' : 'Crear Copropiedad'}
            </button>
          </form>
        </div>

        {/* Listado de Conjuntos (Tenants) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5 shrink-0">
              <Building className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Conjuntos Residenciales Registrados</h3>
            </div>

            {/* Buscador de Conjuntos */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchConjuntoTerm}
                  onChange={(e) => setSearchConjuntoTerm(e.target.value)}
                  placeholder="Buscar conjunto, NIT, admin..."
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all"
                />
                {searchConjuntoTerm && (
                  <button 
                    type="button" 
                    onClick={() => setSearchConjuntoTerm('')}
                    className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <span className="text-xs px-2.5 py-1.5 bg-indigo-500/20 text-indigo-300 font-mono rounded-xl font-semibold shrink-0">
                {copropiedadesFiltradas.length} / {copropiedades.length} PHs
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Cargando lista de conjuntos...
            </div>
          ) : copropiedades.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-xs">No hay copropiedades registradas en el sistema.</p>
          ) : (
            <div className="space-y-3">
              {copropiedadesFiltradas.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-2">
                  <Building className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs font-medium">
                    No se encontraron conjuntos residenciales que coincidan con "<strong className="text-white">{searchConjuntoTerm}</strong>"
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchConjuntoTerm('')}
                    className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                copropiedadesFiltradas.map((cop) => {
                  const adminActual = cop.administradores && cop.administradores.length > 0 ? cop.administradores[0] : null;

                return (
                  <div key={cop.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors shadow-md">
                    {/* Header de la Tarjeta del Conjunto */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-extrabold text-white text-base">{cop.nombre}</h4>
                          {adminActual ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              ✓ Admin Asignado
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              ⚠ Sin Admin
                            </span>
                          )}

                          {/* Toggle de Notificaciones por Copropiedad */}
                          <button
                            type="button"
                            onClick={() => handleToggleNotificacionesPh(cop.id)}
                            disabled={togglingPhNotifs[cop.id]}
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition-all border cursor-pointer disabled:opacity-50 ${
                              cop.notificacionesHabilitadas !== false
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                            title={cop.notificacionesHabilitadas !== false ? 'Notificaciones por correo activas para este PH. Haz clic para pausar.' : 'Notificaciones por correo pausadas para este PH. Haz clic para reanudar.'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cop.notificacionesHabilitadas !== false ? 'bg-indigo-400' : 'bg-rose-400'}`} />
                            {togglingPhNotifs[cop.id] ? (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            ) : cop.notificacionesHabilitadas !== false ? (
                              <span>Envíos PH Activos</span>
                            ) : (
                              <span>Envíos PH Pausados</span>
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 font-medium pt-0.5">
                          <span className="font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
                            NIT: <strong className="text-slate-200">{formatNit(cop.nit)}</strong>
                          </span>

                          <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-400" />
                            {cop.totalUnidades ?? (cop.unidadesPrivadas?.length || 0)} Inmuebles
                          </span>

                          <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 text-[11px] font-bold flex items-center gap-1">
                            <SlidersHorizontal className="w-3 h-3 text-purple-400" />
                            {cop.totalModulosPermitidos ?? 0} Módulos Activos
                          </span>

                          {cop.direccion && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              📍 {cop.direccion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción Principal */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setLoadingModulosPh(true);
                              setSelectedCopForModulos(cop);
                              const resAll = await api.get('/modulos/admin');
                              setTodosModulosSistema(resAll.data);
                              const resPh = await api.get(`/modulos/copropiedad/${cop.id}`);
                              const mapActivos = {};
                              if (resPh.data && resPh.data.length > 0) {
                                resPh.data.forEach(cm => {
                                  if (cm.modulo && cm.modulo.id) {
                                    mapActivos[cm.modulo.id] = cm.activo === true;
                                  }
                                });
                              } else {
                                resAll.data.forEach(m => {
                                  mapActivos[m.id] = true;
                                });
                              }
                              setModulosPhState(mapActivos);
                              setShowModulosModal(true);
                            } catch (e) {
                              console.error("Error al cargar módulos de PH:", e);
                            } finally {
                              setLoadingModulosPh(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Gestionar visibilidad de módulos para este conjunto"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Módulos PH</span>
                        </button>

                        <button
                          onClick={() => handleAbrirFormAdmin(cop, adminActual)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          {adminActual ? <Edit3 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                          {adminActual ? 'Editar Admin' : 'Vincular Admin'}
                        </button>
                      </div>
                    </div>

                    {/* Bloque Detalle del Administrador Asignado */}
                    {adminActual ? (
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Administrador Asignado
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            Usuario: <strong className="text-white">{adminActual.username || adminActual.documento}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                          <div className="font-semibold text-white truncate">
                            👤 {adminActual.nombreCompleto}
                          </div>
                          <div className="font-mono text-slate-300 truncate">
                            📄 Cédula: {adminActual.documento}
                          </div>
                          <div className="font-mono text-slate-300 truncate">
                            📞 {adminActual.telefono || 'Sin teléfono'}
                          </div>
                        </div>

                        {adminActual.email && (
                          <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60 truncate">
                            ✉️ {adminActual.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-300/80 flex items-center justify-between">
                        <span>No hay un Administrador asignado a este conjunto.</span>
                        <button
                          onClick={() => handleAbrirFormAdmin(cop, null)}
                          className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                        >
                          + Vincular ahora
                        </button>
                      </div>
                    )}

                    {/* Desplegable para editar o crear Admin */}
                    {selectedCopropiedadId === cop.id && (
                      <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-2xl space-y-3.5 text-xs animate-fadeIn">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-amber-400" />
                            {adminVerificadoInfo?.copropiedades?.length > 0 && !adminVerificadoInfo?.yaAsignadoAEstaPh
                              ? 'Vincular Administrador Existente a esta PH'
                              : adminActual
                              ? 'Editar Datos del Administrador'
                              : 'Crear o Vincular Administrador de Conjunto'}
                          </span>
                          {verificandoAdmin && (
                            <span className="text-[11px] text-indigo-400 flex items-center gap-1 font-semibold animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Verificando cédula...
                            </span>
                          )}
                        </div>

                        {/* Banner Informativo si el Admin ya existe en otras copropiedades */}
                        {adminVerificadoInfo?.existe && adminVerificadoInfo?.copropiedades?.length > 0 && !adminVerificadoInfo?.yaAsignadoAEstaPh && (
                          <div className="p-3.5 bg-indigo-950/70 border border-indigo-500/50 rounded-2xl space-y-2 shadow-lg shadow-indigo-950/40 animate-fadeIn">
                            <div className="flex items-center gap-2 text-indigo-300 font-bold">
                              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>¡Administrador existente detectado!</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              La persona con cédula <strong className="text-white font-mono">{documentoAdmin}</strong> (<span className="text-amber-300 font-semibold">{adminVerificadoInfo.nombreCompleto}</span>) ya está asignada como administrador en:
                            </p>
                            <div className="flex flex-wrap gap-1.5 py-1">
                              {adminVerificadoInfo.copropiedades.map((nom, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] flex items-center gap-1">
                                  <Building className="w-3 h-3 text-indigo-400" /> {nom}
                                </span>
                              ))}
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2 font-medium">
                              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Sus datos personales han sido precargados. Al confirmar, quedará asociado también como administrador de <strong>{cop.nombre}</strong> conservando su acceso en sus demás conjuntos.</span>
                            </div>
                          </div>
                        )}

                        {/* Banner si ya está asignado a esta misma copropiedad */}
                        {adminVerificadoInfo?.existe && adminVerificadoInfo?.yaAsignadoAEstaPh && (
                          <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2 text-xs animate-fadeIn">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Esta persona ya es el administrador asignado actualmente a este conjunto. Los cambios guardados actualizarán sus datos de contacto.</span>
                          </div>
                        )}

                        {/* Banner si existe la persona en el sistema pero aún no es admin de ninguna copropiedad */}
                        {adminVerificadoInfo?.existe && !adminVerificadoInfo?.yaAsignadoAEstaPh && (!adminVerificadoInfo?.copropiedades || adminVerificadoInfo.copropiedades.length === 0) && (
                          <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-cyan-200 flex items-center gap-2 text-[11px] animate-fadeIn">
                            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>Se encontraron datos registrados para esta cédula ({adminVerificadoInfo.nombreCompleto}). Han sido precargados en el formulario.</span>
                          </div>
                        )}

                        {/* Banner si la cédula no existe en el sistema */}
                        {adminVerificadoInfo?.existe === false && documentoAdmin.trim().length >= 5 && !verificandoAdmin && (
                          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 flex items-center gap-2 text-[11px] animate-fadeIn">
                            <UserPlus className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>Cédula no registrada en el sistema. El formulario ha sido limpiado para registrar los datos del nuevo administrador.</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-indigo-400" /> Documento / Cédula *
                              </span>
                              {verificandoAdmin && (
                                <span className="text-[10px] text-indigo-400 font-normal">Buscando...</span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              value={documentoAdmin}
                              onChange={(e) => setDocumentoAdmin(e.target.value)}
                              placeholder="Ej. 99999999"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                              <User className="w-3 h-3 text-indigo-400" /> Nombre Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={nombreAdmin}
                              onChange={(e) => setNombreAdmin(e.target.value)}
                              placeholder="Ej. Pedro Administrador"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-violet-400" /> Correo Electrónico (Mail) *
                            </label>
                            <input
                              type="email"
                              required
                              value={emailAdmin}
                              onChange={(e) => setEmailAdmin(e.target.value)}
                              placeholder="Ej. admin@ejemplo.com"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-400" /> Teléfono *
                            </label>
                            <input
                              type="text"
                              required
                              value={telefonoAdmin}
                              onChange={(e) => setTelefonoAdmin(e.target.value)}
                              placeholder="Ej. 3009998877"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2 border-t border-slate-800">
                          <p className="text-[10px] text-slate-400 max-w-sm">
                            * {adminVerificadoInfo?.copropiedades?.length > 0 && !adminVerificadoInfo?.yaAsignadoAEstaPh
                              ? 'Al confirmar, este usuario tendrá acceso de administración simultáneo a sus demás conjuntos y a este.'
                              : 'Los datos editados se actualizarán inmediatamente para el administrador asignado a esta copropiedad.'}
                          </p>

                          <button
                            onClick={() => handleAsignarAdmin(cop.id)}
                            disabled={assigningAdmin || !documentoAdmin.trim() || verificandoAdmin}
                            className={`px-4 py-2 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shrink-0 text-white ${
                              adminVerificadoInfo?.copropiedades?.length > 0 && !adminVerificadoInfo?.yaAsignadoAEstaPh
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/20'
                            }`}
                          >
                            {assigningAdmin ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : adminVerificadoInfo?.copropiedades?.length > 0 && !adminVerificadoInfo?.yaAsignadoAEstaPh ? (
                              <UserPlus className="w-4 h-4" />
                            ) : (
                              <Edit3 className="w-4 h-4" />
                            )}
                            {assigningAdmin
                              ? 'Guardando...'
                              : adminVerificadoInfo?.copropiedades?.length > 0 && !adminVerificadoInfo?.yaAsignadoAEstaPh
                              ? 'Asociar a esta Copropiedad'
                              : adminActual
                              ? 'Guardar Datos Administrador'
                              : 'Asignar Administrador'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>
          )}

          {/* Controles de Paginación de Copropiedades */}
          {!loading && totalElementsCop > 0 && (
            <div className="pt-2">
              <PaginationControls
                currentPage={pageCop}
                totalPages={totalPagesCop}
                totalElements={totalElementsCop}
                pageSize={pageSizeCop}
                pageSizeOptions={[6, 12, 24, 48]}
                onPageChange={(newPage) => setPageCop(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSizeCop(newSize);
                  setPageCop(0);
                }}
                itemName="conjuntos residenciales"
              />
            </div>
          )}
        </div>
      </div>
      )}

      {/* MODAL PANTALLA COMPLETA VIA PORTAL: Configuración de Módulos Permisados por PH */}
      {showModulosModal && selectedCopForModulos && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-fadeIn overflow-hidden">
          {/* Header Pantalla Completa */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  Gestión de Módulos Habilitados para PH
                </h2>
                <p className="text-xs font-semibold text-purple-300">
                  {selectedCopForModulos.nombre} <span className="text-slate-500 font-normal">| NIT: {selectedCopForModulos.nit || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Buscador de Módulos */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchModuloTerm}
                  onChange={(e) => setSearchModuloTerm(e.target.value)}
                  placeholder="Buscar módulo por nombre o código..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModulosModal(false);
                  setSelectedCopForModulos(null);
                  setSearchModuloTerm('');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                title="Cerrar (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Cuerpo Scrollable con Grid de Tarjetas */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="w-full max-w-[95%] xl:max-w-[90%] mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <p className="text-xs text-slate-400">
                  Selecciona qué módulos estará autorizada a visualizar y operar la administración de esta PH.
                </p>
                <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 w-fit">
                  {Object.values(modulosPhState).filter(v => v !== false).length} Módulos Habilitados
                </span>
              </div>

              {loadingModulosPh ? (
                <div className="p-20 text-center text-slate-400 text-xs flex items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                  <span>Cargando catálogo completo de módulos del sistema...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {todosModulosSistema
                    .filter(m => m.codigo !== 'MONITOREO' && m.codigo !== 'ADMIN_PH')
                    .filter(m => {
                      if (!searchModuloTerm.trim()) return true;
                      const term = searchModuloTerm.toLowerCase().trim();
                      return (
                        (m.titulo && m.titulo.toLowerCase().includes(term)) ||
                        (m.codigo && m.codigo.toLowerCase().includes(term)) ||
                        (m.descripcion && m.descripcion.toLowerCase().includes(term))
                      );
                    })
                    .map((mod) => {
                      const isActivo = modulosPhState[mod.id] !== false;
                      const IconComponent = ICON_MAP[mod.icono] || Building;

                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            setModulosPhState(prev => ({
                              ...prev,
                              [mod.id]: !isActivo
                            }));
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                            isActivo
                              ? 'bg-gradient-to-b from-purple-950/40 to-slate-900/90 border-purple-500/40 text-white shadow-lg shadow-purple-950/20'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:border-slate-700 opacity-75'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg border ${
                                  isActivo 
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                }`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                  {mod.codigo}
                                </span>
                              </div>

                              <button
                                type="button"
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                  isActivo ? 'bg-purple-600' : 'bg-slate-800'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    isActivo ? 'translate-x-4.5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            <div>
                              <h4 className="text-xs font-extrabold text-white group-hover:text-purple-300 transition-colors">
                                {mod.titulo}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {mod.descripcion}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                            <span className={`font-bold ${isActivo ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {isActivo ? '● Permitido' : '○ Inhabilitado'}
                            </span>
                            <span className="text-slate-500">
                              {mod.badge || 'Módulo'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Pantalla Completa */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowModulosModal(false);
                setSelectedCopForModulos(null);
                setSearchModuloTerm('');
              }}
              className="px-5 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={savingModulosPh || loadingModulosPh}
              onClick={async () => {
                try {
                  setSavingModulosPh(true);
                  const activosIds = Object.keys(modulosPhState)
                    .filter(id => modulosPhState[id])
                    .map(id => parseInt(id));

                  await api.put(`/modulos/copropiedad/${selectedCopForModulos.id}`, activosIds);
                  const msg = `Permisos de módulos para "${selectedCopForModulos.nombre}" actualizados exitosamente.`;
                  toast.success(msg, 'Módulos Actualizados');
                  setShowModulosModal(false);
                  setSelectedCopForModulos(null);
                  setSearchModuloTerm('');
                  if (typeof fetchCopropiedades === 'function') {
                    await fetchCopropiedades();
                  }
                } catch (err) {
                  console.error("Error al guardar módulos de la PH:", err);
                  const errMsg = "No se pudieron guardar los permisos de los módulos para la PH.";
                  toast.error(errMsg, 'Error al Guardar Permisos');
                } finally {
                  setSavingModulosPh(false);
                }
              }}
              className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingModulosPh ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{savingModulosPh ? 'Guardando...' : 'Guardar Permisos de PH'}</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
