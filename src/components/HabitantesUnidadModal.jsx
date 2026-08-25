import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Crown,
  X,
  Check,
  Trash2,
  PlusCircle,
  Building,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Star
} from 'lucide-react';
import api from '../api/axiosClient';

export default function HabitantesUnidadModal({ unidad, onClose }) {
  const [habitantes, setHabitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState(null);

  // Form para nuevo residente
  const [cedula, setCedula] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [parentesco, setParentesco] = useState('PROPIETARIO');
  const [esPropietarioPrincipal, setEsPropietarioPrincipal] = useState(false);
  const [esArrendatario, setEsArrendatario] = useState(false);
  const [esApoderadoDesignado, setEsApoderadoDesignado] = useState(false);

  // Estado para modal emergente de confirmación interactiva
  const [confirmModal, setConfirmModal] = useState(null);

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 5000);
  };

  const fetchHabitantes = async () => {
    if (!unidad?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/unidades/${unidad.id}/habitantes`);
      setHabitantes(res.data);
    } catch (err) {
      console.error("Error al cargar habitantes de la unidad:", err);
      showNotif('error', 'No se pudieron cargar los integrantes de la unidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitantes();
  }, [unidad?.id]);

  const handleAgregarHabitante = async (e, confirmarPropietario = false, confirmarApoderado = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!cedula.trim() || !nombreCompleto.trim()) {
      showNotif('error', 'La identificación y el nombre completo son campos obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cedula: cedula.trim(),
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        parentesco: parentesco || 'HABITANTE',
        esPropietarioPrincipal: esPropietarioPrincipal,
        esArrendatario: esArrendatario,
        esApoderadoDesignado: esApoderadoDesignado,
        confirmarCambioPropietario: confirmarPropietario,
        confirmarCambioApoderado: confirmarApoderado,
        confirmarCambio: Boolean(confirmarPropietario || confirmarApoderado)
      };

      const res = await api.post(`/unidades/${unidad.id}/habitantes`, payload);

      if (res.data?.status === 'REQUIERE_CONFIRMACION' || res.data?.requiereConfirmacion) {
        const isApoderado = Boolean(res.data?.requiereConfirmacionApoderado);

        setConfirmModal({
          title: isApoderado ? "⚠️ Confirmar Reemplazo de Apoderado" : "⚠️ Transferencia de Propietario Titular",
          buttonText: isApoderado ? "Sí, Transferir Apoderado" : "Sí, Transferir Propietario Titular",
          message: res.data.message,
          onConfirm: async () => {
            setConfirmModal(null);
            await handleAgregarHabitante(null, true, true);
          }
        });
        return;
      }

      showNotif('success', `Integrante "${nombreCompleto}" registrado exitosamente.`);

      setConfirmModal(null);
      // Limpiar formulario
      setCedula('');
      setNombreCompleto('');
      setEmail('');
      setTelefono('');
      setParentesco('PROPIETARIO');
      setEsPropietarioPrincipal(false);
      setEsArrendatario(false);
      setEsApoderadoDesignado(false);

      fetchHabitantes();
    } catch (err) {
      if (err.response?.data?.requiereConfirmacion || err.response?.status === 409) {
        const data = err.response.data;
        const isApoderado = Boolean(data?.requiereConfirmacionApoderado);

        setConfirmModal({
          title: isApoderado ? "⚠️ Confirmar Reemplazo de Apoderado" : "⚠️ Transferencia de Propietario Titular",
          buttonText: isApoderado ? "Sí, Transferir Apoderado" : "Sí, Transferir Propietario Titular",
          message: data.message,
          onConfirm: async () => {
            setConfirmModal(null);
            await handleAgregarHabitante(null, true, true);
          }
        });
        return;
      }
      const msg = err.response?.data?.message || err.message || 'Error al guardar residente.';
      showNotif('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleApoderado = async (habitante, confirmar = false) => {
    const nuevoEstado = !habitante.esApoderadoDesignado || confirmar;
    try {
      const url = `/unidades/${unidad.id}/habitantes/${habitante.id}/apoderado?esApoderado=${nuevoEstado}${confirmar ? '&confirmarCambio=true' : ''}`;
      const res = await api.patch(url);

      if (res.data?.status === 'REQUIERE_CONFIRMACION' || res.data?.requiereConfirmacion) {
        setConfirmModal({
          title: "⚠️ Confirmar Reemplazo de Apoderado",
          buttonText: "Sí, Transferir Apoderado",
          message: res.data.message,
          onConfirm: async () => {
            setConfirmModal(null);
            await handleToggleApoderado(habitante, true);
          }
        });
        return;
      }

      setConfirmModal(null);
      showNotif('success', `Apoderado ${nuevoEstado ? 'activado' : 'desactivado'} para ${habitante.persona.nombreCompleto}.`);
      fetchHabitantes();
    } catch (err) {
      if (err.response?.data?.requiereConfirmacion || err.response?.status === 409) {
        setConfirmModal({
          title: "⚠️ Confirmar Reemplazo de Apoderado",
          buttonText: "Sí, Transferir Apoderado",
          message: err.response.data.message,
          onConfirm: async () => {
            setConfirmModal(null);
            await handleToggleApoderado(habitante, true);
          }
        });
        return;
      }
      showNotif('error', err.response?.data?.message || 'Error al actualizar designación de apoderado.');
    }
  };

  const handleEliminarHabitante = async (habitanteId, nombre) => {
    if (!window.confirm(`¿Estás seguro de retirar a "${nombre}" de la lista de residentes de esta unidad?`)) return;

    try {
      await api.delete(`/unidades/${unidad.id}/habitantes/${habitanteId}`);
      showNotif('success', 'Habitante retirado exitosamente.');
      fetchHabitantes();
    } catch (err) {
      showNotif('error', 'Error al eliminar habitante.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Residentes e Integrantes
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Torre {unidad.torre} - Apt {unidad.numeroUnidad}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Coeficiente: <strong className="text-white">{unidad.coeficiente}%</strong> | Registro censal y designación de representante en asambleas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

          {/* Notificaciones */}
          {notif && (
            <div className={`p-4 rounded-2xl border text-xs font-bold animate-fadeIn flex items-center gap-2.5 ${notif.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
              {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              <span>{notif.text}</span>
            </div>
          )}

          {/* Formulario Agregar Residente */}
          <form onSubmit={handleAgregarHabitante} className="p-5 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              Registrar Nuevo Integrante / Residente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Cédula */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Identificación / Cédula *</label>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej: 101842011"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Nombre Completo */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej: Laura Camila Linares"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Email (Opcional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Email (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Teléfono (Opcional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Teléfono (Opcional)</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="300 123 4567"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Opciones y Banderas */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">

                {/* Check Propietario Principal */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPropietarioPrincipal}
                    onChange={(e) => setEsPropietarioPrincipal(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <span>Propietario Titular (Usuario Acceso)</span>
                </label>

                {/* Check Inquilino/Arrendatario */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esArrendatario}
                    onChange={(e) => setEsArrendatario(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <span>Arrendatario / Inquilino</span>
                </label>

                {/* Check Apoderado */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esApoderadoDesignado}
                    onChange={(e) => setEsApoderadoDesignado(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <span>Apoderado de Asamblea</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                <span>{submitting ? 'Guardando...' : 'Agregar Integrante'}</span>
              </button>
            </div>
          </form>

          {/* Listado de Habitantes Registrados */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Integrantes Registrados ({habitantes.length})</span>
            </h3>

            {loading ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Cargando residentes de la unidad...</p>
              </div>
            ) : habitantes.length === 0 ? (
              <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                No hay integrantes registrados en esta unidad. Agrega el primer residente arriba.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {habitantes.map((h) => {
                  const p = h.persona;
                  return (
                    <div
                      key={h.id}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-sm">{p.nombreCompleto}</h4>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Doc: {p.cedula}</p>
                        </div>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleEliminarHabitante(h.id, p.nombreCompleto)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Retirar Integrante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Datos de contacto opcionales */}
                      {(p.email || p.telefono) && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                          {p.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {p.email}
                            </span>
                          )}
                          {p.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {p.telefono}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Badges de Roles y Apoderado */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                        {h.esPropietarioPrincipal && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-indigo-400" /> Propietario Titular
                          </span>
                        )}

                        {h.esArrendatario && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Inquilino / Arrendatario
                          </span>
                        )}

                        {/* Designación de Apoderado con botón Activar (Solo si NO es Propietario Titular) */}
                        {!h.esPropietarioPrincipal && (
                          <button
                            type="button"
                            onClick={() => handleToggleApoderado(h)}
                            className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${h.esApoderadoDesignado
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900 hover:text-white'
                              }`}
                            title="Hacer clic para activar o desactivar apoderado oficial de la unidad"
                          >
                            <Star className={`w-3.5 h-3.5 ${h.esApoderadoDesignado ? 'text-amber-400 fill-amber-400' : 'text-indigo-400'}`} />
                            <span>{h.esApoderadoDesignado ? '✓ Apoderado Activo' : '⚡ Activar como Apoderado'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Modal Emergente de Confirmación Interactivo */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-4 relative">
            <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
              {confirmModal.title}
            </h3>
            <div className="text-xs text-slate-300 space-y-2 whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {confirmModal.message}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{confirmModal.buttonText || "Confirmar Reemplazo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
