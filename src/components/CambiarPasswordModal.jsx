import React, { useState } from 'react';
import api from '../api/axiosClient';
import { useToast } from './NotificationToast';
import { KeyRound, Lock, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function CambiarPasswordModal({ user, onPasswordChanged }) {
  const toast = useToast();
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      toast.error('Las contraseñas no coinciden.', 'Validación de Contraseña');
      return;
    }

    if (nuevaPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.', 'Validación de Contraseña');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/auth/cambiar-password-inicial', {
        username: user.username || user.documento,
        passwordActual: passwordActual.trim(),
        nuevaPassword: nuevaPassword.trim()
      });

      setSuccessMsg('✅ ¡Contraseña actualizada exitosamente! Iniciando sesión...');
      toast.success('¡Contraseña actualizada exitosamente!', 'Cambio de Clave');
      
      const updatedUser = {
        ...user,
        ...res.data,
        debeCambiarPassword: false
      };
      
      sessionStorage.setItem('user_data', JSON.stringify(updatedUser));
      if (localStorage.getItem('user_data')) {
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }

      setTimeout(() => {
        onPasswordChanged(updatedUser);
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al cambiar la contraseña.';
      setError(msg);
      toast.error(msg, 'Error al Cambiar Clave');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 pb-20 sm:pb-4">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-amber-500/10 relative overflow-hidden animate-fadeIn max-h-[85vh] overflow-y-auto">
        
        {/* Top Warning Banner Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Cambio Obligatorio de Contraseña</h2>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Hola <strong className="text-white">{user.nombreCompleto}</strong>. Por motivos de seguridad y al ser tu primer ingreso con una clave temporal, debes actualizar tu contraseña por una permanente antes de continuar.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Contraseña Temporal Actual *</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingresa la contraseña con la que entraste"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Nueva Contraseña Permanente *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Confirmar Nueva Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !passwordActual.trim() || !nuevaPassword.trim() || !confirmarPassword.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {submitting ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
