import React, { useState, useEffect } from 'react';
import { ListOrdered, Plus, Trash2, CheckSquare, Square, Lock, Save, ShieldCheck, X, RefreshCw, ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';

export default function OrdenDiaModal({ asamblea, onClose, notifySuccess, notifyError, showConfirmDialog, onUpdateAsamblea }) {
  const [puntos, setPuntos] = useState([
    { orden: 1, titulo: 'Verificación de Quórum y Apertura de la Asamblea', descripcion: '' },
    { orden: 2, titulo: 'Elección de Presidente y Secretario de la Asamblea', descripcion: '' },
    { orden: 3, titulo: 'Lectura y Aprobación del Orden del Día', descripcion: '' },
  ]);
  const [esDefinitivo, setEsDefinitivo] = useState(asamblea?.ordenDiaDefinitivo || false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar Orden del Día desde Backend
  const fetchOrdenDia = async () => {
    if (!asamblea?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/asambleas/${asamblea.id}/orden-dia`);
      setEsDefinitivo(res.data.ordenDiaDefinitivo || false);
      if (res.data.puntos && res.data.puntos.length > 0) {
        setPuntos(res.data.puntos);
      }
    } catch (err) {
      console.warn("No se pudo cargar el orden del día:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdenDia();
  }, [asamblea?.id]);

  const handleAgregarPunto = () => {
    if (esDefinitivo) return;
    setPuntos((prev) => [
      ...prev,
      { orden: prev.length + 1, titulo: '', descripcion: '' }
    ]);
  };

  const handleEliminarPunto = (index) => {
    if (esDefinitivo) return;
    setPuntos((prev) => {
      const nuevos = prev.filter((_, i) => i !== index);
      return nuevos.map((p, idx) => ({ ...p, orden: idx + 1 }));
    });
  };

  const handleMoverPunto = (index, direccion) => {
    if (esDefinitivo) return;
    if (direccion === 'arriba' && index === 0) return;
    if (direccion === 'abajo' && index === puntos.length - 1) return;

    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    const copia = [...puntos];
    const temp = copia[index];
    copia[index] = copia[targetIndex];
    copia[targetIndex] = temp;

    const reordenados = copia.map((p, idx) => ({ ...p, orden: idx + 1 }));
    setPuntos(reordenados);
  };

  const handleCambiarItemText = (index, field, value) => {
    if (esDefinitivo) return;
    setPuntos((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [field]: value };
      return copia;
    });
  };

  const handleGuardarOrdenDia = async (marcarDefinitivo = false) => {
    if (esDefinitivo) return;

    const puntosValidos = puntos.filter((p) => p.titulo && p.titulo.trim().length > 0);
    if (puntosValidos.length === 0) {
      if (notifyError) {
        notifyError("Puntos Requeridos", "Por favor ingresa al menos un punto para el Orden del Día.");
      }
      return;
    }

    const ejecutarGuardado = async () => {
      try {
        setSaving(true);
        const payload = {
          asambleaId: asamblea.id,
          esDefinitivo: marcarDefinitivo,
          puntos: puntosValidos.map((p, idx) => ({
            orden: idx + 1,
            titulo: p.titulo.trim(),
            descripcion: p.descripcion ? p.descripcion.trim() : null,
          })),
        };

        const res = await api.post(`/asambleas/${asamblea.id}/orden-dia`, payload);
        setEsDefinitivo(res.data.ordenDiaDefinitivo);
        setPuntos(res.data.puntos);

        if (onUpdateAsamblea) {
          onUpdateAsamblea();
        }

        if (notifySuccess) {
          notifySuccess(
            marcarDefinitivo ? "Orden del Día Aprobado" : "Borrador Guardado",
            marcarDefinitivo
              ? "El Orden del Día ha sido APROBADO por la asamblea. Ya se pueden ir marcando el cumplimiento de los puntos en vivo."
              : "Los puntos del Orden del Día han sido guardados como borrador."
          );
        }

        if (marcarDefinitivo) {
          // Mantener abierto el modal en modo definitivo para iniciar checkboxes
        } else {
          onClose();
        }
      } catch (err) {
        if (notifyError) {
          notifyError("Error al guardar", err.response?.data?.message || err.message);
        }
      } finally {
        setSaving(false);
      }
    };

    if (marcarDefinitivo) {
      if (showConfirmDialog) {
        showConfirmDialog({
          title: "Aprobar Orden del Día",
          message: "¿Deseas APROBAR el Orden del Día para la asamblea? Una vez aprobado por la asamblea, no se podrán modificar los puntos y solo se podrá marcar el cumplimiento de cada uno.",
          type: "info",
          confirmText: "Sí, aprobar Orden del Día",
          onConfirm: ejecutarGuardado,
        });
      } else {
        await ejecutarGuardado();
      }
    } else {
      await ejecutarGuardado();
    }
  };

  const handleToggleCompletadoPunto = async (puntoId, completadoActual) => {
    if (!esDefinitivo) return;
    const nuevoEstado = !completadoActual;

    try {
      // Actualización optimista local
      setPuntos((prev) =>
        prev.map((p) => (p.id === puntoId ? { ...p, completado: nuevoEstado } : p))
      );

      await api.patch(`/asambleas/orden-dia/puntos/${puntoId}/completado?completado=${nuevoEstado}`);

      if (onUpdateAsamblea) {
        onUpdateAsamblea();
      }
    } catch (err) {
      // Revertir en caso de error
      setPuntos((prev) =>
        prev.map((p) => (p.id === puntoId ? { ...p, completado: completadoActual } : p))
      );
      if (notifyError) {
        notifyError("Error al actualizar punto", err.response?.data?.message || err.message);
      }
    }
  };

  const totalPuntos = puntos.length;
  const completadosCount = puntos.filter((p) => p.completado).length;
  const porcentaje = totalPuntos > 0 ? Math.round((completadosCount / totalPuntos) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl p-4 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4 sm:space-y-6 relative max-h-[85vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-wide">Orden del Día</h3>
              {esDefinitivo ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Definitivo
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Borrador
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Asamblea ID #{asamblea?.id}: {asamblea?.titulo}
            </p>
          </div>
        </div>

        {/* Progress bar in Definitive mode */}
        {esDefinitivo && (
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Avance del Orden del Día:
              </span>
              <span className="text-emerald-400 font-mono">
                {completadosCount} de {totalPuntos} completados ({porcentaje}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                style={{ width: `${porcentaje}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Instructions banner */}
        {!esDefinitivo ? (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Agrega y ordena los puntos que se discutirán en la asamblea. Puedes guardar como <strong>Borrador</strong> para editar luego, o como <strong>Guardar Definitivo</strong> para congelar la agenda y marcar su avance en vivo.
            </span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Orden del Día congelado. Marca cada punto a medida que se vaya cumpliendo en la asamblea.
            </span>
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
            <p className="text-xs text-slate-400">Cargando puntos del orden del día...</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {puntos.map((punto, index) => (
              <div
                key={punto.id || index}
                className={`p-4 rounded-2xl border transition-all ${
                  punto.completado
                    ? 'bg-emerald-950/20 border-emerald-500/40 opacity-90'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Item Index / Checkbox */}
                  {esDefinitivo ? (
                    <button
                      type="button"
                      onClick={() => handleToggleCompletadoPunto(punto.id, punto.completado)}
                      className={`p-1 rounded-xl transition-all shrink-0 mt-0.5 ${
                        punto.completado
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-500 hover:text-indigo-400'
                      }`}
                      title={punto.completado ? "Marcar como pendiente" : "Marcar como completado"}
                    >
                      {punto.completado ? (
                        <CheckSquare className="w-6 h-6 fill-emerald-500/20 text-emerald-400" />
                      ) : (
                        <Square className="w-6 h-6" />
                      )}
                    </button>
                  ) : (
                    <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                  )}

                  {/* Title & Description inputs / text */}
                  <div className="flex-1 space-y-1.5">
                    {esDefinitivo ? (
                      <div>
                        <h4 className={`text-xs font-bold ${punto.completado ? 'line-through text-slate-400' : 'text-white'}`}>
                          {punto.orden}. {punto.titulo}
                        </h4>
                        {punto.descripcion && (
                          <p className="text-[11px] text-slate-400">{punto.descripcion}</p>
                        )}
                        {punto.completado && punto.fechaCompletado && (
                          <span className="text-[10px] text-emerald-400 font-mono block pt-0.5">
                            ✓ Completado: {new Date(punto.fechaCompletado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          required
                          value={punto.titulo}
                          onChange={(e) => handleCambiarItemText(index, 'titulo', e.target.value)}
                          placeholder={`Ej. Punto ${index + 1}: Lectura de informe...`}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={punto.descripcion || ''}
                          onChange={(e) => handleCambiarItemText(index, 'descripcion', e.target.value)}
                          placeholder="Descripción u observaciones adicionales (opcional)..."
                          className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-[11px] focus:outline-none focus:border-indigo-500/60"
                        />
                      </>
                    )}
                  </div>

                  {/* Move & Delete Actions (Draft Mode Only) */}
                  {!esDefinitivo && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoverPunto(index, 'arriba')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                        title="Mover arriba"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoverPunto(index, 'abajo')}
                        disabled={index === puntos.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                        title="Mover abajo"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarPunto(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                        title="Eliminar punto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Point Button (Draft Mode Only) */}
            {!esDefinitivo && (
              <button
                type="button"
                onClick={handleAgregarPunto}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-indigo-500/50 text-indigo-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Agregar Nuevo Punto al Orden del Día
              </button>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
          >
            {esDefinitivo ? 'Cerrar' : 'Cancelar'}
          </button>

          {!esDefinitivo && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleGuardarOrdenDia(false)}
                disabled={saving || loading}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar Borrador
              </button>

              <button
                type="button"
                onClick={() => handleGuardarOrdenDia(true)}
                disabled={saving || loading}
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Aprobar Orden del Día
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
