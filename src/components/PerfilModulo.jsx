import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ChevronDown,
  ChevronUp,
  LogOut,
  Crown,
  UserCheck,
  Sparkles,
  Lock,
  FileText,
  Briefcase
} from 'lucide-react';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';

export default function PerfilModulo({ user, onUserUpdate, onLogout, health }) {
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [telefonoInput, setTelefonoInput] = useState(user?.telefono || '');
  const [showCambiarPassword, setShowCambiarPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mensajes de notificación interna
  const [mensaje, setMensaje] = useState(null); // { type: 'success' | 'error', text: '' }

  const toast = useToast();
  const showNotif = (type, text) => {
    if (type === 'success') toast.success(text);
    else if (type === 'error') toast.error(text);
    else if (type === 'warning') toast.warning(text);
    else toast.info(text);
  };

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
      showNotif('error', 'Por favor ingresa una dirección de correo electrónico válida.');
      return;
    }

    if (showCambiarPassword || nuevaPassword.trim()) {
      if (!nuevaPassword.trim()) {
        showNotif('error', 'Por favor ingresa la nueva contraseña.');
        return;
      }
      if (nuevaPassword.trim().length < 6) {
        showNotif('error', 'La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (nuevaPassword !== confirmarPassword) {
        showNotif('error', 'La nueva contraseña y su confirmación no coinciden.');
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

      showNotif(
        'success',
        showCambiarPassword && nuevaPassword.trim()
          ? '¡Perfil y contraseña actualizados exitosamente!'
          : '¡Tus datos de contacto se guardaron exitosamente!'
      );
      setNuevaPassword('');
      setConfirmarPassword('');
      setShowCambiarPassword(false);
    } catch (err) {
      showNotif('error', err.response?.data?.message || err.message || 'No se pudieron guardar los datos.');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isSecretaria = user?.roles?.includes('ROLE_SECRETARIA');
  const isGestor = user?.roles?.includes('ROLE_GESTOR');

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <User className="w-6 h-6 text-indigo-400" />
            </div>
            Administración de Perfil
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona tu información personal, datos de contacto, contraseña e inmuebles asociados.
          </p>
        </div>
      </div>

      {/* Notificación Flotante de Acción */}
      {mensaje && (
        <div className={`p-4 rounded-2xl border text-xs font-bold animate-fadeIn flex items-center gap-2 ${mensaje.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
          {mensaje.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Lock className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{mensaje.text}</span>
        </div>
      )}

      {/* Grid Principal de Datos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Columna Izquierda: Tarjeta de Identidad */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl text-center space-y-4 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/25 border-2 border-indigo-400/30">
              {user?.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-white">{user?.nombreCompleto || 'Usuario'}</h3>
              <p className="text-xs font-mono text-slate-400">Documento: {user?.documento || 'N/A'}</p>
            </div>

            <div className="pt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isSuperAdmin ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  isAdmin ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                    isSecretaria ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' :
                      isGestor ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                {isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                {isSecretaria && <Briefcase className="w-3.5 h-3.5 text-pink-400" />}
                {isGestor && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {isSuperAdmin ? 'SuperAdministrador' : isAdmin ? 'Administrador PH' : isSecretaria ? 'Secretaría PH' : isGestor ? 'Gestor de Registro' : 'Copropietario / Votante'}
              </span>
            </div>

            {/* Inmuebles Representados (si aplican) */}
            {user?.unidadesRepresentadas && user.unidadesRepresentadas.length > 0 && (
              <div className="pt-4 border-t border-slate-800 text-left space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Inmueble(s) Asociado(s):
                </span>
                <div className="space-y-1.5">
                  {user.unidadesRepresentadas.map((u, idx) => (
                    <div
                      key={u.unidadId || idx}
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-indigo-300 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        Torre {u.torre} - Apt {u.numeroUnidad}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {u.coeficiente}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón Cerrar Sesión */}
            {onLogout && (
              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Formulario de Actualización */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleGuardarPerfil} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 bg-slate-900/90">

            {/* Sección 1: Datos de Contacto */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Mail className="w-4 h-4 text-indigo-400" />
                Información de Contacto
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Correo Electrónico *</span>
                    {loadingInfo && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Teléfono / Celular
                  </label>
                  <input
                    type="tel"
                    value={telefonoInput}
                    onChange={(e) => setTelefonoInput(e.target.value)}
                    placeholder="Ej. 3001234567"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Seguridad y Cambio de Contraseña */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Seguridad de la Cuenta
              </h4>

              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowCambiarPassword(!showCambiarPassword)}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-300">Cambiar Contraseña de Acceso</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {showCambiarPassword ? '(Clic para ocultar)' : '(Clic para cambiar)'}
                    </span>
                  </div>
                  {showCambiarPassword ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
                </button>

                {showCambiarPassword && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nueva Contraseña *
                      </label>
                      <input
                        type="password"
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirmar Contraseña *
                      </label>
                      <input
                        type="password"
                        value={confirmarPassword}
                        onChange={(e) => setConfirmarPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón Guardar Cambios */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving || loadingInfo}
                className="px-6 py-2.5 text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Guardando Cambios...' : 'Guardar Cambios de Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
