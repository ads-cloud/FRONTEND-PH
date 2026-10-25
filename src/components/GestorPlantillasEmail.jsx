import React, { useState, useEffect } from 'react';
import { Mail, Edit3, Eye, RefreshCw, Save, RotateCcw, Code, Sparkles, CheckCircle2, AlertCircle, Play, Pause, AlertTriangle } from 'lucide-react';
import api from '../api/axiosClient';

export default function GestorPlantillasEmail({ activeTenantId, notifySuccess, notifyError }) {
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingActivo, setTogglingActivo] = useState(false);

  useEffect(() => {
    fetchPlantillas();
  }, [activeTenantId]);

  const fetchPlantillas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plantillas-email', {
        params: { copropiedadId: activeTenantId }
      });
      const data = res.data || [];
      setPlantillas(data);
      if (data.length > 0) {
        const actual = plantillaSeleccionada ? data.find(p => p.codigo === plantillaSeleccionada.codigo) || data[0] : data[0];
        seleccionarPlantilla(actual);
      }
    } catch (err) {
      if (notifyError) notifyError("Error", "No se pudieron cargar las plantillas de correo.");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPlantilla = (p) => {
    setPlantillaSeleccionada(p);
    setAsunto(p.asunto || '');
    setCuerpoHtml(p.cuerpoHtml || '');
  };

  const handleInsertarVariable = (varName) => {
    const varTag = `{{${varName.trim()}}}`;
    setCuerpoHtml(prev => prev + ' ' + varTag);
  };

  const handleToggleActivo = async () => {
    if (!plantillaSeleccionada) return;
    try {
      setTogglingActivo(true);
      const res = await api.patch(`/plantillas-email/${plantillaSeleccionada.codigo}/toggle`, null, {
        params: { copropiedadId: activeTenantId }
      });
      const updated = res.data;
      const nuevoEstado = updated.activo;
      if (notifySuccess) {
        notifySuccess(
          nuevoEstado ? "Plantilla Activada" : "Plantilla Desactivada",
          `Los envíos de '${plantillaSeleccionada.nombre}' ahora están ${nuevoEstado ? 'habilitados' : 'pausados'}.`
        );
      }
      setPlantillaSeleccionada(updated);
      setPlantillas(prev => prev.map(p => p.codigo === updated.codigo ? updated : p));
    } catch (err) {
      if (notifyError) notifyError("Error", err.response?.data?.message || err.message);
    } finally {
      setTogglingActivo(false);
    }
  };

  const handleGuardar = async () => {
    if (!plantillaSeleccionada) return;
    try {
      setSaving(true);
      const res = await api.put(`/plantillas-email/${plantillaSeleccionada.codigo}`, {
        nombre: plantillaSeleccionada.nombre,
        asunto: asunto.trim(),
        cuerpoHtml: cuerpoHtml.trim(),
        variablesDisponibles: plantillaSeleccionada.variablesDisponibles,
        activo: plantillaSeleccionada.activo !== false
      }, {
        params: { copropiedadId: activeTenantId }
      });

      if (notifySuccess) notifySuccess("Plantilla Guardada", `La plantilla '${plantillaSeleccionada.nombre}' ha sido actualizada.`);
      fetchPlantillas();
    } catch (err) {
      if (notifyError) notifyError("Error al Guardar", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRestaurar = async () => {
    if (!plantillaSeleccionada) return;
    if (!window.confirm(`¿Estás seguro de restaurar la plantilla '${plantillaSeleccionada.nombre}' a su valor por defecto?`)) return;

    try {
      setSaving(true);
      await api.delete(`/plantillas-email/${plantillaSeleccionada.codigo}/restaurar`, {
        params: { copropiedadId: activeTenantId }
      });
      if (notifySuccess) notifySuccess("Plantilla Restaurada", "Se ha restaurado el valor global por defecto.");
      fetchPlantillas();
    } catch (err) {
      if (notifyError) notifyError("Error", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reemplazar dinámicamente variables simuladas para la previsualización en vivo
  const renderPreviewHtml = () => {
    let html = cuerpoHtml || '';
    const sampleVars = {
      nombre: "Carlos Andrés Pérez",
      username: "cperez",
      password: "Password123!",
      pin: "849201",
      pinAsamblea: "492018",
      contexto: "Acceso Propietario (Torre 1 - Apt 101)"
    };
    Object.keys(sampleVars).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, sampleVars[key]);
    });
    return html;
  };

  const variablesArray = plantillaSeleccionada?.variablesDisponibles
    ? plantillaSeleccionada.variablesDisponibles.split(',').map(v => v.replace(/[{}]/g, '').trim())
    : [];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Gestor de Plantillas HTML de Correo
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">Personaliza el diseño y los mensajes automáticos enviados por el sistema</p>
          </div>
        </div>

        <button
          onClick={fetchPlantillas}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-all"
          title="Recargar plantillas"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs Selector de Plantilla */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {plantillas.map((p) => {
          const isSelected = p.codigo === plantillaSeleccionada?.codigo;
          const esPersonalizada = p.copropiedadId != null;
          const isActiva = p.activo !== false;

          return (
            <button
              key={p.codigo}
              onClick={() => seleccionarPlantilla(p)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActiva ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <Code className="w-4 h-4" />
              <span>{p.nombre}</span>
              {!isActiva && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Pausada
                </span>
              )}
              {esPersonalizada && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Custom
                </span>
              )}
            </button>
          );
        })}
      </div>

      {plantillaSeleccionada && (
        <div className="grid grid-cols-1 lg:col-span-12 gap-6">
          {/* Main Work Area */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">

              {/* Banner de alerta si la plantilla está pausada */}
              {plantillaSeleccionada.activo === false && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Esta notificación está <strong>desactivada</strong>. El sistema no enviará correos automáticos de este tipo mientras se encuentre en pausa.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleActivo}
                    disabled={togglingActivo}
                    className="self-end sm:self-center px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Reanudar Envío
                  </button>
                </div>
              )}
              
              {/* Asunto Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Asunto del Correo Electrónico
                </label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej: Bienvenido a ProyectoPH"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>

              {/* Variables Disponibles Chips */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Variables dinámicas (haz clic para insertar en el código):
                </span>
                <div className="flex flex-wrap gap-2">
                  {variablesArray.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertarVariable(v)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-500 rounded-lg text-xs font-mono font-bold text-indigo-300 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor vs Preview Mode Toggle & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'editor'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editor HTML
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Previsualización en Vivo
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Interruptor Activo/Pausado para esta plantilla */}
                  <button
                    type="button"
                    onClick={handleToggleActivo}
                    disabled={togglingActivo || saving}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                      plantillaSeleccionada.activo !== false
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
                    }`}
                    title={plantillaSeleccionada.activo !== false ? 'Haga clic para pausar el envío de esta notificación' : 'Haga clic para reanudar el envío de esta notificación'}
                  >
                    <span className={`w-2 h-2 rounded-full ${plantillaSeleccionada.activo !== false ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
                    {togglingActivo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : plantillaSeleccionada.activo !== false ? (
                      <span className="flex items-center gap-1"><Pause className="w-3.5 h-3.5 text-emerald-400" /> Envíos Activos</span>
                    ) : (
                      <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5 text-rose-400" /> Envíos Pausados</span>
                    )}
                  </button>

                  {plantillaSeleccionada.copropiedadId != null && (
                    <button
                      onClick={handleRestaurar}
                      disabled={saving || togglingActivo}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restaurar Defecto
                    </button>
                  )}
                  <button
                    onClick={handleGuardar}
                    disabled={saving || togglingActivo}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              {/* Editor Tab */}
              {activeTab === 'editor' ? (
                <div className="space-y-2">
                  <textarea
                    rows={16}
                    value={cuerpoHtml}
                    onChange={(e) => setCuerpoHtml(e.target.value)}
                    placeholder="Código HTML de la plantilla..."
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
                  />
                </div>
              ) : (
                /* Live Preview Tab */
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vista previa con datos simulados
                    </span>
                    <span className="font-mono text-[10px]">Asunto: {asunto}</span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-800 overflow-hidden min-h-[350px] shadow-2xl">
                    <div
                      dangerouslySetInnerHTML={{ __html: renderPreviewHtml() }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
