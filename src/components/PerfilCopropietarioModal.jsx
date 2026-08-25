import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, ShieldCheck, X, CheckCircle2, RefreshCw, Lock, KeyRound, ChevronDown, ChevronUp, Activity, Database, Radio, LogOut } from 'lucide-react';
import api from '../api/axiosClient';

export default function PerfilCopropietarioModal({ user, onClose, onUserUpdate, onLogout, health, notifySuccess, notifyError }) {
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [telefonoInput, setTelefonoInput] = useState(user?.telefono || '');
  const [showCambiarPassword, setShowCambiarPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.email) setEmailInput(user.email);
    if (user?.telefono) setTelefonoInput(user.telefono);

    const syncPersonaInfo = async () => {
      if (!user?.documento) return;
      try {
        setLoadingInfo(true);
        const res = await api.get(`/auth/perfil/${user.documento}`);
        if (res.data) {
          setEmailInput(res.data.email || '');
          setTelefonoInput(res.data.telefono || '');
          const updatedUser = { ...user, ...res.data };
          sessionStorage.setItem('user_data', JSON.stringify(updatedUser));
          if (localStorage.getItem('user_data')) {
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
          }
          if (onUserUpdate) {
            onUserUpdate(updatedUser);
          }
        }
      } catch (err) {
        console.warn("No se pudo precargar el perfil desde el servidor:", err);
      } finally {
        setLoadingInfo(false);
      }
    };

    syncPersonaInfo();
  }, [user?.documento]);

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();

    if (!emailInput.trim() || !emailInput.includes('@')) {
      if (notifyError) {
        notifyError("Correo Inválido", "Por favor ingresa una dirección de correo electrónico válida.");
      }
      return;
    }

    if (showCambiarPassword || nuevaPassword.trim()) {
      if (!nuevaPassword.trim()) {
        if (notifyError) {
          notifyError("Contraseña Requerida", "Por favor ingresa la nueva contraseña.");
        }
        return;
      }
      if (nuevaPassword.trim().length < 6) {
        if (notifyError) {
          notifyError("Contraseña Muy Corta", "La nueva contraseña debe tener al menos 6 caracteres.");
        }
        return;
      }
      if (nuevaPassword !== confirmarPassword) {
        if (notifyError) {
          notifyError("Las Contraseñas No Coinciden", "Por favor verifica que la nueva contraseña y su confirmación sean exactamente iguales.");
        }
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        documento: user.documento,
        email: emailInput.trim().toLowerCase(),
        telefono: telefonoInput.trim(),
      };

      if (showCambiarPassword && nuevaPassword.trim()) {
        payload.nuevaPassword = nuevaPassword.trim();
      }

      const res = await api.put('/auth/perfil', payload);

      // Actualizar almacenamiento local y estado global de usuario
      sessionStorage.setItem('user_data', JSON.stringify(res.data));
      if (localStorage.getItem('user_data')) {
        localStorage.setItem('user_data', JSON.stringify(res.data));
      }
      if (onUserUpdate) {
        onUserUpdate(res.data);
      }

      if (notifySuccess) {
        notifySuccess(
          "Perfil Actualizado",
          showCambiarPassword && nuevaPassword.trim()
            ? "Tus datos y contraseña se han actualizado exitosamente."
            : "Tus datos de contacto han sido guardados exitosamente."
        );
      }

      onClose();
    } catch (err) {
      if (notifyError) {
        notifyError("Error al guardar perfil", err.response?.data?.message || err.message || "No se pudieron actualizar los datos.");
      }
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  return (
    <div className="absolute right-0 top-full mt-2.5 z-50 w-[calc(100vw-24px)] max-w-[380px] sm:w-[420px] bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-700/90 shadow-2xl shadow-slate-950 animate-fadeIn space-y-4 text-xs text-slate-100">
      {/* Header identity inside popover */}
      <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/20">
            {user?.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white leading-tight">{user?.nombreCompleto || 'Usuario'}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">Doc: {user?.documento || 'N/A'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {isSuperAdmin ? '👑 SuperAdmin' : isAdmin ? '🛡️ Admin PH' : '👤 Copropietario'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Unidades Representadas */}
      {user?.unidadesRepresentadas && user.unidadesRepresentadas.length > 0 && (
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Inmueble(s) Representado(s):
          </span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {user.unidadesRepresentadas.map((u, idx) => (
              <span
                key={u.unidadId || idx}
                className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs font-bold text-indigo-300 flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                Torre {u.torre} Apt {u.numeroUnidad} ({u.coeficiente}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de Edición */}
      <form onSubmit={handleGuardarPerfil} className="space-y-3.5">
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo Electrónico
              </span>
              {loadingInfo && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-400" /> Teléfono / Celular
            </label>
            <input
              type="tel"
              value={telefonoInput}
              onChange={(e) => setTelefonoInput(e.target.value)}
              placeholder="Ej. +57 300 1234567"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Sección desplegable para Cambiar Contraseña */}
        <div className="pt-1.5 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowCambiarPassword(!showCambiarPassword)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-300 transition-all"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Cambiar Contraseña
            </span>
            {showCambiarPassword ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCambiarPassword && (
            <div className="space-y-2.5 p-3 mt-2 bg-slate-950/90 rounded-xl border border-slate-800 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-800">
          <div className="flex items-center justify-between gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Salir
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || loadingInfo}
                className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
