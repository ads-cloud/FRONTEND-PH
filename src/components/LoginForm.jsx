import React, { useState } from 'react';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';
import { Lock, Building2, AlertCircle, CheckCircle2, RefreshCw, User, KeyRound, ShieldCheck, Mail, ArrowLeft, Key, AlertTriangle, X } from 'lucide-react';

export default function LoginForm({ onLoginSuccess, health }) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para restauración de contraseña
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Cédula, 2: PIN, 3: Nueva Clave
  const [documentoReset, setDocumentoReset] = useState('');
  const [pinReset, setPinReset] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        username: username.trim(),
        password: password.trim(),
        rememberMe: rememberMe,
      });

      const data = res.data;
      if (data.accessToken) {
        sessionStorage.setItem('jwt_token', data.accessToken);
        localStorage.setItem('jwt_token', data.accessToken);
      }
      sessionStorage.setItem('user_data', JSON.stringify(data));
      if (rememberMe) {
        localStorage.setItem('user_data', JSON.stringify(data));
      } else {
        localStorage.removeItem('user_data');
      }

      if (data.copropiedadId) {
        sessionStorage.setItem('active_copropiedad_id', data.copropiedadId.toString());
        localStorage.setItem('active_copropiedad_id', data.copropiedadId.toString());
      }
      onLoginSuccess(data);
    } catch (err) {
      const detailedMessage = err.response?.data?.message
        || (err.message === 'Network Error' || err.code === 'ERR_NETWORK'
          ? 'Error de conexión con el servidor. Por favor verifica tu acceso a red.'
          : err.message)
        || 'Nombre de usuario o contraseña incorrectos.';

      toast.error(detailedMessage, 'Error de Autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarPin = async (e) => {
    e.preventDefault();
    if (!documentoReset.trim()) return;
    setResetLoading(true);

    try {
      const res = await api.post('/auth/reset-password/solicitar-pin', { documento: documentoReset.trim() });
      toast.success(res.data.message || 'Código PIN generado y enviado.', 'Código PIN Generado');
      setResetStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al solicitar el código PIN.';
      toast.error(msg, 'Error de Restablecimiento');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerificarPin = async (e) => {
    e.preventDefault();
    if (!pinReset.trim()) return;
    setResetLoading(true);

    try {
      const res = await api.post('/auth/reset-password/verificar-pin', { documento: documentoReset.trim(), pin: pinReset.trim() });
      toast.success(res.data.message || 'PIN verificado correctamente.', 'PIN Válido');
      setResetStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'PIN inválido o expirado.';
      toast.error(msg, 'Error de Verificación');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmarPassword = async (e) => {
    e.preventDefault();
    if (!nuevaPassword.trim()) return;
    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden.', 'Validación');
      return;
    }
    if (nuevaPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.', 'Validación');
      return;
    }

    setResetLoading(true);

    try {
      const res = await api.post('/auth/reset-password/confirmar', {
        documento: documentoReset.trim(),
        pin: pinReset.trim(),
        nuevaPassword: nuevaPassword.trim()
      });
      toast.success(res.data.message || 'Contraseña actualizada exitosamente.', 'Operación Exitosa');
      setTimeout(() => {
        setIsResetMode(false);
        setResetStep(1);
        setDocumentoReset('');
        setPinReset('');
        setNuevaPassword('');
        setConfirmarPassword('');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al restablecer la contraseña.';
      toast.error(msg, 'Error al Restablecer');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Resplandor focal tras el título y la tarjeta */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Título Central Gigante estilo "SERVICES" */}
      <div className="text-center mb-8 space-y-3 z-10">
        <div className="inline-flex items-center gap-3 sm:gap-4 justify-center">
          <span className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent tracking-wider uppercase font-sans drop-shadow-md">
            SERVICES
          </span>
        </div>
      </div>

      {/* Tarjeta de Formulario de Inicio de Sesión */}
      <div className="max-w-md w-full space-y-6 glass-panel p-8 sm:p-10 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 relative overflow-hidden backdrop-blur-2xl z-10">

        {/* Línea superior con gradiente de acento azul cian */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600" />

        {/* MODO RESTAURACIÓN DE CONTRASEÑA */}
        {isResetMode ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-cyan-400" /> Restablecer Contraseña (Paso {resetStep} de 3)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setResetStep(1);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Login
              </button>
            </div>

            {/* Paso 1: Ingresar Cédula / Documento */}
            {resetStep === 1 && (
              <form onSubmit={handleSolicitarPin} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ingresa tu número de cédula o documento de identidad. El sistema buscará tu correo registrado y te enviará un código de verificación de 6 dígitos.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Número de Cédula / Documento *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={documentoReset}
                      onChange={(e) => setDocumentoReset(e.target.value)}
                      placeholder="Ej. 101842011"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || !documentoReset.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
                >
                  {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {resetLoading ? 'Buscando Cuenta y Enviando PIN...' : 'Enviar Código al Correo Registrado'}
                </button>
              </form>
            )}

            {/* Paso 2: Ingresar PIN de Seguridad */}
            {resetStep === 2 && (
              <form onSubmit={handleVerificarPin} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ingresa el código PIN de 6 dígitos enviado al correo registrado del documento <strong className="text-cyan-300">{documentoReset}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">PIN de Seguridad (6 dígitos) *</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pinReset}
                      onChange={(e) => setPinReset(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-cyan-300 font-mono text-center tracking-widest text-base focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold border border-slate-700/50 transition-colors"
                  >
                    Reenviar PIN
                  </button>

                  <button
                    type="submit"
                    disabled={resetLoading || !pinReset.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
                  >
                    {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    {resetLoading ? 'Verificando...' : 'Verificar PIN'}
                  </button>
                </div>
              </form>
            )}

            {/* Paso 3: Ingresar Nueva Contraseña */}
            {resetStep === 3 && (
              <form onSubmit={handleConfirmarPassword} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  PIN verificado. Ingresa tu nueva contraseña para actualizar el acceso.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nueva Contraseña *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmar Nueva Contraseña *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || !nuevaPassword.trim() || !confirmarPassword.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
                >
                  {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {resetLoading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* MODO INICIO DE SESIÓN NORMAL */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center pb-2">
              <p className="text-xs text-slate-400">Administración de propiedad horizontal </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre de Usuario</label>
              <div className="relative">
                <User className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. usuario o admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setResetStep(1);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-cyan-500/70 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer"
                />
                <span className="text-slate-400">Recordar mi sesión</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}
        <div className="text-center pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            {health?.status === 'UP' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
                <span className="text-slate-300">Disponible <strong className="text-emerald-400 font-normal"></strong></span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 inline" />
                <span className="text-rose-300 font-semibold">Sin conexión</span>
              </>
            )}
          </span>
          <span className="font-mono text-slate-600">v1.0.0</span>
        </div>
      </div>

      {/* Texto de pie de página centrado al final de la pantalla en dos líneas */}
      <div className="mt-8 text-center text-[11px] font-medium z-10 px-4 max-w-lg space-y-1">
        <p className="text-slate-200">Plataforma de administración de propiedad horizontal</p>
        <p className="text-[10px] text-cyan-300 font-semibold">proyectoPH &copy; 2026</p>
      </div>
    </div>
  );
}
