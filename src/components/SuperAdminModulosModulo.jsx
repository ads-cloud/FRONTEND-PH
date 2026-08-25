import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import { ConfirmModal, useToast } from './NotificationToast';
import { 
  Settings, Plus, Edit3, CheckCircle2, AlertCircle, RefreshCw, 
  Search, Shield, Layers, Vote, User, Building, Building2, Home, 
  Megaphone, CreditCard, MessageSquare, Activity, Sparkles, X, Check
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Vote', label: 'Votación (Vote)', comp: Vote },
  { name: 'User', label: 'Usuario (User)', comp: User },
  { name: 'Building', label: 'Edificio (Building)', comp: Building },
  { name: 'Building2', label: 'Copropiedad (Building2)', comp: Building2 },
  { name: 'Home', label: 'Hogar (Home)', comp: Home },
  { name: 'Megaphone', label: 'Megáfono (Megaphone)', comp: Megaphone },
  { name: 'CreditCard', label: 'Tarjeta (CreditCard)', comp: CreditCard },
  { name: 'MessageSquare', label: 'Mensaje (MessageSquare)', comp: MessageSquare },
  { name: 'Activity', label: 'Actividad (Activity)', comp: Activity },
  { name: 'Settings', label: 'Ajustes (Settings)', comp: Settings },
  { name: 'Shield', label: 'Escudo (Shield)', comp: Shield },
  { name: 'Layers', label: 'Capas (Layers)', comp: Layers },
  { name: 'Sparkles', label: 'Brillo (Sparkles)', comp: Sparkles },
];

const GRADIENT_OPTIONS = [
  { label: 'Índigo - Cian (Asambleas)', value: 'from-indigo-600 via-violet-600 to-cyan-500' },
  { label: 'Esmeralda - Turquesa (Inmuebles)', value: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { label: 'Ámbar - Naranja (Administración)', value: 'from-amber-600 to-orange-600' },
  { label: 'Violeta - Púrpura (Perfil)', value: 'from-violet-600 via-purple-600 to-indigo-500' },
  { label: 'Cian - Azul (Monitoreo)', value: 'from-cyan-600 to-blue-600' },
  { label: 'Púrpura - Rosa (PQRS)', value: 'from-purple-600 to-pink-500' },
  { label: 'Teal - Esmeralda (Mi Inmueble)', value: 'from-teal-600 via-emerald-600 to-cyan-600' },
];

const ALL_ROLES = [
  { code: 'ROLE_SUPER_ADMIN', label: 'SuperAdministrador' },
  { code: 'ROLE_ADMIN', label: 'Administrador PH' },
  { code: 'ROLE_GESTOR', label: 'Gestor de Contenido' },
  { code: 'ROLE_COPROPIETARIO', label: 'Copropietario / Propietario' },
  { code: 'ROLE_APODERADO', label: 'Apoderado / Residente' },
];

export default function SuperAdminModulosModulo({ user }) {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notif, setNotif] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Estado del Modal de Formulario
  const [showModal, setShowModal] = useState(false);
  const [editingModuloId, setEditingModuloId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Campos del Formulario
  const [codigo, setCodigo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icono, setIcono] = useState('Settings');
  const [ruta, setRuta] = useState('');
  const [colorGradient, setColorGradient] = useState(GRADIENT_OPTIONS[0].value);
  const [badge, setBadge] = useState('Disponible');
  const [orden, setOrden] = useState(10);
  const [activo, setActivo] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState(['ROLE_SUPER_ADMIN']);

  const toast = useToast();
  const showNotif = (type, text) => {
    if (type === 'success') toast.success(text);
    else if (type === 'error') toast.error(text);
    else if (type === 'warning') toast.warning(text);
    else toast.info(text);
  };

  const fetchCatalogoModulos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/modulos/catalogo-global');
      setModulos(res.data || []);
    } catch (err) {
      console.error("Error al cargar catálogo global de módulos:", err);
      showNotif('error', 'Error al conectar con la base de datos de módulos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogoModulos();
  }, []);

  const handleOpenCrear = () => {
    setEditingModuloId(null);
    setCodigo('');
    setTitulo('');
    setDescripcion('');
    setIcono('Settings');
    setRuta('');
    setColorGradient(GRADIENT_OPTIONS[0].value);
    setBadge('Disponible');
    setOrden(modulos.length + 1);
    setActivo(true);
    setSelectedRoles(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']);
    setShowModal(true);
  };

  const handleOpenEditar = (mod) => {
    setEditingModuloId(mod.id);
    setCodigo(mod.codigo || '');
    setTitulo(mod.titulo || '');
    setDescripcion(mod.descripcion || '');
    setIcono(mod.icono || 'Settings');
    setRuta(mod.ruta || '');
    setColorGradient(mod.colorGradient || GRADIENT_OPTIONS[0].value);
    setBadge(mod.badge || 'Disponible');
    setOrden(mod.orden || 1);
    setActivo(Boolean(mod.activo));
    setSelectedRoles(Array.isArray(mod.rolesPermitidos) ? mod.rolesPermitidos : []);
    setShowModal(true);
  };

  const handleToggleRole = (roleCode) => {
    if (selectedRoles.includes(roleCode)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleCode));
    } else {
      setSelectedRoles([...selectedRoles, roleCode]);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!codigo.trim() || !titulo.trim() || !ruta.trim()) {
      showNotif('error', 'El código, título y ruta son obligatorios.');
      return;
    }
    if (selectedRoles.length === 0) {
      showNotif('error', 'Debes seleccionar al menos un rol autorizado.');
      return;
    }

    const payload = {
      id: editingModuloId || undefined,
      codigo: codigo.trim().toUpperCase(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      icono,
      ruta: ruta.trim().toLowerCase(),
      colorGradient,
      borderColor: 'border-indigo-500/40 hover:border-indigo-400',
      shadowColor: 'shadow-indigo-500/10 hover:shadow-indigo-500/25',
      badge: badge.trim() || 'Disponible',
      badgeColor: activo ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700',
      activo,
      orden: Number(orden) || 1,
      rolesPermitidos: selectedRoles
    };

    try {
      setSubmitting(true);
      if (editingModuloId) {
        await api.put(`/modulos/${editingModuloId}`, payload);
        showNotif('success', `Módulo "${titulo}" actualizado correctamente.`);
      } else {
        await api.post('/modulos', payload);
        showNotif('success', `Nuevo módulo "${titulo}" registrado exitosamente.`);
      }
      setShowModal(false);
      fetchCatalogoModulos();
    } catch (err) {
      console.error("Error al guardar módulo:", err);
      showNotif('error', err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = (mod) => {
    const nuevoEstado = !mod.activo;
    setConfirmConfig({
      title: `${nuevoEstado ? 'Habilitar' : 'Deshabilitar'} Módulo`,
      type: nuevoEstado ? 'info' : 'warning',
      message: `¿Estás seguro de que deseas ${nuevoEstado ? 'habilitar' : 'deshabilitar'} el módulo "${mod.titulo}" globalmente?`,
      confirmText: `Sí, ${nuevoEstado ? 'Habilitar' : 'Deshabilitar'}`,
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await api.patch(`/modulos/${mod.id}/estado?activo=${nuevoEstado}`);
          showNotif('success', `Módulo "${mod.titulo}" ${nuevoEstado ? 'habilitado' : 'deshabilitado'} exitosamente.`);
          fetchCatalogoModulos();
        } catch (err) {
          showNotif('error', 'Error al cambiar estado del módulo.');
        }
      }
    });
  };

  const modulosFiltrados = modulos.filter(m => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (m.titulo && m.titulo.toLowerCase().includes(term)) ||
      (m.codigo && m.codigo.toLowerCase().includes(term)) ||
      (m.descripcion && m.descripcion.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Modal de Confirmación Estilizado */}
      <ConfirmModal confirmConfig={confirmConfig} onClose={() => setConfirmConfig(null)} />

      {/* Notificaciones Flotantes */}
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
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Panel Exclusivo SuperAdministrador</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-400" />
            Administración del Catálogo de Módulos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Crea, edita, parametriza rutas, íconos y gestiona los permisos por rol de todos los módulos del sistema.
          </p>
        </div>

        <button
          onClick={handleOpenCrear}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Módulo</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Estadísticas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, título o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium self-end sm:self-center">
          Total de módulos: <span className="font-bold text-white">{modulos.length}</span> ({modulos.filter(m => m.activo).length} activos)
        </div>
      </div>

      {/* Grid de Módulos */}
      {loading ? (
        <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">Cargando catálogo global de módulos...</p>
        </div>
      ) : modulosFiltrados.length === 0 ? (
        <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No se encontraron módulos registrados que coincidan con "{searchTerm}"</p>
          <p className="text-xs text-slate-500">Haz clic en "Crear Nuevo Módulo" para registrar una nueva aplicación en la plataforma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulosFiltrados.map((mod) => {
            const IconObj = ICON_OPTIONS.find(i => i.name === mod.icono)?.comp || Settings;

            return (
              <div 
                key={mod.id} 
                className={`glass-panel p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative ${
                  mod.activo ? 'border-slate-800 hover:border-indigo-500/40 bg-slate-900/60' : 'border-rose-900/30 opacity-75 bg-slate-950/40'
                }`}
              >
                <div className="space-y-4">
                  {/* Header de Tarjeta */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${mod.colorGradient || 'from-indigo-600 to-cyan-500'} text-white shadow-lg`}>
                      <IconObj className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        mod.activo ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {mod.activo ? 'Habilitado' : 'Inhabilitado'}
                      </span>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        {mod.codigo}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">Orden: #{mod.orden}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{mod.titulo}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{mod.descripcion}</p>
                  </div>

                  {/* Ruta y Roles */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400">
                      Ruta: <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded font-mono">/{mod.ruta}</code>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Roles Autorizados:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(mod.rolesPermitidos) && mod.rolesPermitidos.map(r => (
                          <span key={r} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleToggleEstado(mod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      mod.activo 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {mod.activo ? 'Deshabilitar' : 'Habilitar'}
                  </button>

                  <button
                    onClick={() => handleOpenEditar(mod)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulario Crear / Editar Módulo */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingModuloId ? 'Editar Módulo del Sistema' : 'Crear Nuevo Módulo'}
                </h2>
                <p className="text-xs text-slate-400">Parametriza los atributos globales de la aplicación</p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Código del Módulo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. MANTENIMIENTO"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    disabled={Boolean(editingModuloId)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Título Visible *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mantenimiento y Servicios"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Descripción del Módulo *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe la funcionalidad del módulo..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Ruta de Navegación *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. mantenimiento"
                    value={ruta}
                    onChange={(e) => setRuta(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white lowercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Ícono Visual *</label>
                  <select
                    value={icono}
                    onChange={(e) => setIcono(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Orden de Presentación *</label>
                  <input
                    type="number"
                    min={1}
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Estilo Gradiente</label>
                  <select
                    value={colorGradient}
                    onChange={(e) => setColorGradient(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {GRADIENT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Etiqueta (Badge)</label>
                  <input
                    type="text"
                    placeholder="Disponible / Próximamente"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Roles Autorizados */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">Roles Autorizados para Acceso *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_ROLES.map(r => (
                    <label key={r.code} className="flex items-center gap-2 p-2 bg-slate-900/80 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(r.code)}
                        onChange={() => handleToggleRole(r.code)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span className="text-xs text-slate-200">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">Módulo Habilitado / Activo Globalmente</span>
                </label>
              </div>

              {/* Botones Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold shadow-lg transition-all"
                >
                  {submitting ? 'Guardando...' : (editingModuloId ? 'Guardar Cambios' : 'Crear Módulo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
