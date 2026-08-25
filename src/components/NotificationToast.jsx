import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle, Ban, Square } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Global Toast Provider & Manager
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, message, title = '') => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const toastHelpers = {
    success: (message, title) => showToast('success', message, title),
    error: (message, title) => showToast('error', message, title),
    warning: (message, title) => showToast('warning', message, title),
    info: (message, title) => showToast('info', message, title),
    show: showToast
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Custom Hook for Toast Notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      show: () => {}
    };
  }
  return context;
}

/**
 * Modern Glassmorphic Toast Notification Card
 */
export function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const { id, type = 'info', title, message } = toast;

  let bgClasses = 'bg-slate-900/95 border-indigo-500/40 text-indigo-200 shadow-indigo-500/10';
  let icon = <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />;

  if (type === 'success') {
    bgClasses = 'bg-slate-900/95 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10';
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
  } else if (type === 'error') {
    bgClasses = 'bg-slate-900/95 border-rose-500/40 text-rose-200 shadow-rose-500/10';
    icon = <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
  } else if (type === 'warning') {
    bgClasses = 'bg-slate-900/95 border-amber-500/40 text-amber-200 shadow-amber-500/10';
    icon = <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
  }

  return (
    <div className={`glass-panel p-4 rounded-2xl border shadow-xl flex items-start gap-3 w-full max-w-sm backdrop-blur-md animate-slideInRight transition-all ${bgClasses}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0 pr-1">
        {title && <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Toast Notifications Container Positioned Cleanly Below Navbar (top-20 z-[9999])
 */
export function ToastContainer({ toasts = [], onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-auto">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

/**
 * Friendly Custom Confirmation Modal (z-[9999])
 */
export function ConfirmModal({ confirmConfig, onClose }) {
  if (!confirmConfig) return null;

  const {
    title = '¿Estás seguro?',
    message,
    type = 'warning',
    confirmText = 'Sí, confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    loading = false,
  } = confirmConfig;

  let headerBg = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  let iconComp = <AlertTriangle className="w-6 h-6 text-amber-400" />;
  let btnGradient = 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-indigo-500/20';

  if (type === 'danger' || type === 'rose') {
    headerBg = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    iconComp = <Ban className="w-6 h-6 text-rose-400" />;
    btnGradient = 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20';
  } else if (type === 'stop') {
    headerBg = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    iconComp = <Square className="w-6 h-6 text-rose-400" />;
    btnGradient = 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20';
  } else if (type === 'info') {
    headerBg = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    iconComp = <HelpCircle className="w-6 h-6 text-indigo-400" />;
    btnGradient = 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20';
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${headerBg}`}>
            {iconComp}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">{title}</h3>
            <p className="text-xs text-slate-400">Por favor confirma tu elección</p>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">
            {message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${btnGradient}`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
