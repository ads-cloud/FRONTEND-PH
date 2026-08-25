import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import TimerWidget from './TimerWidget';
import { ToastContainer, useToast } from './NotificationToast';
import { useWebSocket } from '../hooks/useWebSocket';
import { Smartphone, CheckCircle2, AlertCircle, Lock, UserCheck, RefreshCw, Building, KeyRound, ShieldAlert, ShieldCheck, ThumbsUp, ThumbsDown, MinusCircle, Sparkles, Clock, ListOrdered, ChevronDown, ChevronUp, PieChart, Users } from 'lucide-react';

const getOptionStyle = (textoRaw, index = 0) => {
  const txt = (textoRaw || '').toLowerCase().trim();

  if (txt.includes('aproba') || txt === 'sí' || txt === 'si' || txt.includes('favor') || txt.includes('acept')) {
    return {
      bg: 'bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-slate-950',
      border: 'border-emerald-500/50 hover:border-emerald-400',
      hoverGlow: 'hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5',
      selectedBg: 'bg-gradient-to-br from-emerald-600/40 via-emerald-700/30 to-emerald-950 border-emerald-400 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-400/60',
      text: 'text-emerald-300 font-extrabold',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: ThumbsUp,
      label: 'Aprobación'
    };
  }

  if (txt.includes('recha') || txt === 'no' || txt.includes('contra') || txt.includes('negativ')) {
    return {
      bg: 'bg-gradient-to-br from-rose-950/80 via-rose-900/40 to-slate-950',
      border: 'border-rose-500/50 hover:border-rose-400',
      hoverGlow: 'hover:shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5',
      selectedBg: 'bg-gradient-to-br from-rose-600/40 via-rose-700/30 to-rose-950 border-rose-400 shadow-xl shadow-rose-500/30 ring-2 ring-rose-400/60',
      text: 'text-rose-300 font-extrabold',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: ThumbsDown,
      label: 'Rechazo'
    };
  }

  if (txt.includes('absten') || txt.includes('blanco') || txt.includes('neutro')) {
    return {
      bg: 'bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-slate-950',
      border: 'border-amber-500/50 hover:border-amber-400',
      hoverGlow: 'hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5',
      selectedBg: 'bg-gradient-to-br from-amber-600/40 via-amber-700/30 to-amber-950 border-amber-400 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400/60',
      text: 'text-amber-300 font-extrabold',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: MinusCircle,
      label: 'Abstención'
    };
  }

  const palettes = [
    {
      bg: 'bg-gradient-to-br from-cyan-950/80 via-cyan-900/40 to-slate-950',
      border: 'border-cyan-500/50 hover:border-cyan-400',
      hoverGlow: 'hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5',
      selectedBg: 'bg-gradient-to-br from-cyan-600/40 via-cyan-700/30 to-cyan-950 border-cyan-400 shadow-xl shadow-cyan-500/30 ring-2 ring-cyan-400/60',
      text: 'text-cyan-300 font-extrabold',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: Sparkles,
      label: `Opción ${index + 1}`
    },
    {
      bg: 'bg-gradient-to-br from-violet-950/80 via-violet-900/40 to-slate-950',
      border: 'border-violet-500/50 hover:border-violet-400',
      hoverGlow: 'hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5',
      selectedBg: 'bg-gradient-to-br from-violet-600/40 via-violet-700/30 to-violet-950 border-violet-400 shadow-xl shadow-violet-500/30 ring-2 ring-violet-400/60',
      text: 'text-violet-300 font-extrabold',
      iconBg: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      icon: Sparkles,
      label: `Opción ${index + 1}`
    }
  ];

  return palettes[index % palettes.length];
};

export default function CopropietarioVotingView({ user: initialUser }) {
  const [auth, setAuth] = useState(() => {
    if (initialUser) return initialUser;
    const stored = sessionStorage.getItem('user_data') || localStorage.getItem('user_data');
    return stored ? JSON.parse(stored) : null;
  });

  const [selectedUnidadId, setSelectedUnidadId] = useState(null);

  const toast = useToast();
  const notifySuccess = (title, message) => toast.success(message, title);
  const notifyError = (title, message) => toast.error(message, title);
  const notifyWarning = (title, message) => toast.warning(message, title);

  // Estados para validación del PIN de la asamblea
  const [pinIngresado, setPinIngresado] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);
  const [errorPin, setErrorPin] = useState('');
  const [exitoPin, setExitoPin] = useState('');

  const [preguntas, setPreguntas] = useState([]);
  const [resultadosMap, setResultadosMap] = useState({});
  const [votosEmitidos, setVotosEmitidos] = useState({});
  const [submittingVoto, setSubmittingVoto] = useState(false);
  const [ordenDia, setOrdenDia] = useState(null);
  const [ordenDiaExpandido, setOrdenDiaExpandido] = useState(false);
  const [asambleaDetalle, setAsambleaDetalle] = useState(null);

  const pasosEstadoAsamblea = [
    {
      paso: 1,
      estadoKey: 'PROGRAMADA',
      titulo: 'Programada',
      descripcion: 'Paso 1: La asamblea está agendada. Aún no abre el registro presencial de propietarios.'
    },
    {
      paso: 2,
      estadoKey: 'EN_REGISTRO',
      titulo: 'Registro Asistencia',
      descripcion: 'Paso 2: Registro presencial en la entrada. Se valida la cédula, se entrega el PIN y se computa el quórum.'
    },
    {
      paso: 3,
      estadoKey: 'EN_CURSO',
      titulo: 'En Curso (Votación)',
      descripcion: 'Paso 3: Asamblea iniciada formalmente. Votaciones en vivo y preguntas abiertas para los copropietarios.'
    },
    {
      paso: 4,
      estadoKey: 'FINALIZADA',
      titulo: 'Finalizada',
      descripcion: 'Paso 4: Conclusión formal de la asamblea y consolidación inmutable del acta final y resultados.'
    }
  ];

  const fetchAsambleaDetalle = async () => {
    if (!auth?.asambleaActivaId) return;
    try {
      const res = await api.get(`/asambleas/${auth.asambleaActivaId}`);
      setAsambleaDetalle(res.data);
    } catch (err) {
      console.error("Error al obtener detalle de asamblea:", err);
    }
  };

  const fetchOrdenDiaCopropietario = async () => {
    if (!auth?.asambleaActivaId) return;
    try {
      const res = await api.get(`/asambleas/${auth.asambleaActivaId}/orden-dia`);
      setOrdenDia(res.data);
    } catch (err) {
      console.error("Error al obtener orden del día:", err);
    }
  };

  const fetchResultadosTodos = async (listaPreguntas) => {
    if (!listaPreguntas || listaPreguntas.length === 0) return;
    try {
      const mapa = {};
      await Promise.all(
        listaPreguntas.map(async (p) => {
          try {
            const res = await api.get(`/preguntas/${p.id}/resultados`);
            mapa[p.id] = res.data;
          } catch (e) {
            console.error(`Error al cargar resultados de pregunta ${p.id}:`, e);
          }
        })
      );
      setResultadosMap(mapa);
    } catch (err) {
      console.error("Error al obtener mapa de resultados:", err);
    }
  };

  useEffect(() => {
    if (initialUser) {
      setAuth(initialUser);
      if (initialUser.unidadesRepresentadas && initialUser.unidadesRepresentadas.length > 0) {
        setSelectedUnidadId(initialUser.unidadesRepresentadas[0].unidadId);
      }
    }
  }, [initialUser]);

  useEffect(() => {
    if (auth && auth.unidadesRepresentadas && auth.unidadesRepresentadas.length > 0 && !selectedUnidadId) {
      setSelectedUnidadId(auth.unidadesRepresentadas[0].unidadId);
    }
  }, [auth]);

  const unidadSeleccionada = auth?.unidadesRepresentadas?.find(u => u.unidadId === selectedUnidadId) || auth?.unidadesRepresentadas?.[0];

  const fetchPreguntasActivas = async () => {
    if (!auth?.asambleaActivaId) return;
    try {
      const res = await api.get(`/preguntas/asamblea/${auth.asambleaActivaId}`);
      const activas = (res.data || []).filter(p => p.estado !== 'FINALIZADA');
      setPreguntas(activas);
      fetchResultadosTodos(activas);
    } catch (err) {
      // Error silencioso
    }
  };
  const syncAsistenciaState = async () => {
    if (!auth?.asambleaActivaId || !auth?.unidadesRepresentadas) return;
    try {
      const res = await api.get(`/asambleas/${auth.asambleaActivaId}/asistentes`);
      const listaAsistentes = res.data || [];

      let hasChanges = false;
      const updatedUnidades = auth.unidadesRepresentadas.map(u => {
        const asisBD = listaAsistentes.find(a => a.unidadPrivada?.id === u.unidadId);
        const estaReg = Boolean(asisBD);
        const estaConf = asisBD ? Boolean(asisBD.asistenciaConfirmada) : false;

        if (u.asistenciaRegistrada !== estaReg || u.asistenciaConfirmada !== estaConf) {
          hasChanges = true;
          return { ...u, asistenciaRegistrada: estaReg, asistenciaConfirmada: estaConf };
        }
        return u;
      });

      if (hasChanges) {
        const updatedAuth = { ...auth, unidadesRepresentadas: updatedUnidades };
        setAuth(updatedAuth);
        sessionStorage.setItem('user_data', JSON.stringify(updatedAuth));
        if (localStorage.getItem('user_data')) {
          localStorage.setItem('user_data', JSON.stringify(updatedAuth));
        }
      }
    } catch (err) {
      // Error silencioso
    }
  };

  // ⚡ Suscripciones WebSocket en tiempo real (sin polling recurrente)
  useWebSocket(
    auth?.asambleaActivaId ? `/topic/asamblea/${auth.asambleaActivaId}/preguntas` : null,
    (event) => {
      fetchPreguntasActivas();
      fetchOrdenDiaCopropietario();
      fetchAsambleaDetalle();
      if (selectedUnidadId) fetchVotosEmitidosUnidad(selectedUnidadId);
    },
    Boolean(auth?.asambleaActivaId)
  );

  useWebSocket(
    auth?.asambleaActivaId ? `/topic/asamblea/${auth.asambleaActivaId}/quorum` : null,
    (event) => {
      syncAsistenciaState();
      fetchAsambleaDetalle();
    },
    Boolean(auth?.asambleaActivaId)
  );

  // Carga única inicial de la asamblea y estado
  useEffect(() => {
    if (auth?.asambleaActivaId) {
      syncAsistenciaState();
      fetchOrdenDiaCopropietario();
      fetchAsambleaDetalle();
    }
  }, [auth?.asambleaActivaId]);

  const fetchVotosEmitidosUnidad = async (unidadId) => {
    if (!unidadId) return;
    try {
      const res = await api.get(`/votaciones/unidad/${unidadId}`);
      if (res.data) {
        setVotosEmitidos(res.data);
      }
    } catch (err) {
      console.error("Error al cargar votos de la unidad:", err);
    }
  };

  useEffect(() => {
    if (selectedUnidadId) {
      fetchVotosEmitidosUnidad(selectedUnidadId);
    }
  }, [selectedUnidadId]);

  // Carga inicial al confirmar asistencia
  useEffect(() => {
    if (auth?.asambleaActivaId && unidadSeleccionada?.asistenciaConfirmada) {
      fetchPreguntasActivas();
      fetchOrdenDiaCopropietario();
      fetchAsambleaDetalle();
      if (selectedUnidadId) fetchVotosEmitidosUnidad(selectedUnidadId);
    }
  }, [auth?.asambleaActivaId, unidadSeleccionada?.asistenciaConfirmada, selectedUnidadId]);

  const handleValidarPin = async (e) => {
    e.preventDefault();
    setErrorPin('');
    setExitoPin('');

    if (!pinIngresado.trim()) {
      setErrorPin("Por favor ingresa el PIN de 6 dígitos que te enviamos al correo.");
      return;
    }

    setLoadingPin(true);
    try {
      await api.post('/asambleas/validar-pin', {
        asambleaId: auth.asambleaActivaId,
        unidadPrivadaId: unidadSeleccionada.unidadId,
        cedulaPersona: auth.documento,
        pin: pinIngresado.trim(),
      });

      setExitoPin("¡PIN verificado exitosamente! Bienvenido a la Asamblea.");
      notifySuccess("Asistencia Confirmada", "¡PIN verificado exitosamente! Ya puedes participar en las votaciones.");
      
      // Actualizar estado local para confirmación de asistencia
      const updatedUnidades = auth.unidadesRepresentadas.map(u => 
        u.unidadId === unidadSeleccionada.unidadId ? { ...u, asistenciaConfirmada: true } : u
      );
      const updatedAuth = { ...auth, unidadesRepresentadas: updatedUnidades };
      setAuth(updatedAuth);
      sessionStorage.setItem('user_data', JSON.stringify(updatedAuth));
      if (localStorage.getItem('user_data')) {
        localStorage.setItem('user_data', JSON.stringify(updatedAuth));
      }

      fetchPreguntasActivas();
    } catch (err) {
      setErrorPin(err.response?.data?.message || err.message || 'El PIN ingresado es incorrecto.');
      notifyError("PIN Incorrecto", err.response?.data?.message || "Por favor verifica el PIN enviado a tu correo e intenta de nuevo.");
    } finally {
      setLoadingPin(false);
    }
  };

  const [votoPendiente, setVotoPendiente] = useState(null);

  const handleSolicitarConfirmacionVoto = (pregunta, opcion) => {
    if (!selectedUnidadId) {
      notifyWarning("Selección Requerida", "Por favor selecciona el inmueble con el cual deseas emitir tu voto.");
      return;
    }
    const unidad = auth?.unidadesRepresentadas?.find(u => u.unidadId === selectedUnidadId) || auth?.unidadesRepresentadas?.[0];
    setVotoPendiente({ pregunta, opcion, unidad });
  };

  const handleEjecutarVotoConfirmado = async () => {
    if (!votoPendiente) return;
    const { pregunta, opcion, unidad } = votoPendiente;

    setSubmittingVoto(true);
    try {
      await api.post('/votaciones/emitir', {
        preguntaId: pregunta.id,
        opcionVotoId: opcion.id,
        opcionId: opcion.id,
        unidadPrivadaId: unidad.unidadId,
        cedulaPersona: auth.documento,
      });

      setVotosEmitidos(prev => ({
        ...prev,
        [pregunta.id]: opcion.id,
      }));

      notifySuccess("Voto Registrado", "Tu elección ha sido registrada de forma inalterable para esta pregunta.");
      setVotoPendiente(null);
    } catch (err) {
      notifyError("No se pudo registrar el voto", err.response?.data?.message || "Ocurrió un inconveniente temporal. Intenta de nuevo.");
    } finally {
      setSubmittingVoto(false);
    }
  };

  const [checkingSession, setCheckingSession] = useState(false);

  const handleRefreshEstado = async () => {
    setCheckingSession(true);
    try {
      const doc = auth?.documento;
      if (doc) {
        const res = await api.post('/auth/login-otp', { documento: doc, claveOtp: 'password123' });
        if (res.data) {
          setAuth(res.data);
          sessionStorage.setItem('user_data', JSON.stringify(res.data));
          if (localStorage.getItem('user_data')) {
            localStorage.setItem('user_data', JSON.stringify(res.data));
          }
        }
      }
    } catch (err) {
      // Error silencioso
    } finally {
      setCheckingSession(false);
    }
  };

  // CASO 1: No hay asamblea activa para el usuario
  if (!auth?.asambleaActivaId || !auth?.unidadesRepresentadas || auth.unidadesRepresentadas.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-panel max-w-lg w-full p-8 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="inline-flex p-4 bg-slate-900 text-slate-400 rounded-2xl border border-slate-800">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Sin Asamblea Activa</h2>
          <p className="text-sm text-slate-400">
            Hola <strong>{auth?.nombreCompleto}</strong>. En este momento no tienes ninguna asamblea en curso programada para tus unidades inmobiliarias.
          </p>
          <p className="text-xs text-slate-500">
            El acceso a las votaciones y preguntas se habilitará automáticamente tan pronto la administración de inicio a la asamblea.
          </p>
          <div className="pt-2">
            <button
              onClick={handleRefreshEstado}
              disabled={checkingSession}
              className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 flex items-center justify-center gap-2 mx-auto transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${checkingSession ? 'animate-spin' : ''}`} />
              {checkingSession ? 'Verificando...' : 'Verificar Asamblea Activa Nuevamente'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASO 1.5: La asistencia presencial no ha sido registrada por el administrador en la entrada
  if (!unidadSeleccionada?.asistenciaRegistrada) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-panel max-w-lg w-full p-8 rounded-3xl border border-amber-500/30 bg-amber-950/10 text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-4 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <UserCheck className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">Registro Presencial Requerido</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hola <strong className="text-white">{auth?.nombreCompleto}</strong>. Para acceder a las votaciones del inmueble <strong>Torre {unidadSeleccionada?.torre} Apt {unidadSeleccionada?.numeroUnidad}</strong>, debes presentar tu documento de identidad físico en la mesa de registro presencial de la asamblea.
          </p>
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-amber-300 text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="w-4 h-4" /> Proceso de Registro de Asistencia:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pt-1">
              <li>Muestra tu documento físico al administrador en la entrada.</li>
              <li>El administrador hará clic en <strong>Registrar Asistencia Presencial</strong>.</li>
              <li>Recibirás un <strong>PIN de 6 dígitos</strong> en tu correo electrónico.</li>
              <li>Ingresa ese PIN en tu pantalla para habilitar las preguntas en vivo.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: El poder del apoderado está pendiente de aprobación por el Administrador
  if (unidadSeleccionada?.esPorPoder && !unidadSeleccionada?.poderAprobado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-panel max-w-lg w-full p-8 rounded-3xl border border-amber-500/30 bg-amber-950/10 text-center space-y-4">
          <div className="inline-flex p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">Poder de Apoderado en Revisión</h2>
          <p className="text-sm text-slate-300">
            Tu poder para representar al inmueble <strong>Torre {unidadSeleccionada.torre} Apt {unidadSeleccionada.numeroUnidad}</strong> se encuentra en estado de verificación por parte de la administración.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-amber-300">
            Una vez la administración apruebe tu poder presencialmente en el panel, se enviará tu PIN de acceso y podrás votar.
          </div>
        </div>
      </div>
    );
  }

  // CASO 3: Asistencia no confirmada -> Solicitar el PIN de 6 dígitos enviado al hacer Check-in presencial
  if (!unidadSeleccionada?.asistenciaConfirmada) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Ingresa tu PIN de Asamblea</h2>
            <p className="text-xs text-slate-400">
              Al registrar tu llegada presencial en la entrada con tu cédula, enviamos un <strong>código PIN de 6 dígitos</strong> a tu correo electrónico.
            </p>
          </div>

          {errorPin && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorPin}</span>
            </div>
          )}

          {exitoPin && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{exitoPin}</span>
            </div>
          )}

          <form onSubmit={handleValidarPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                PIN de Acceso (6 dígitos)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={pinIngresado}
                onChange={(e) => setPinIngresado(e.target.value)}
                placeholder="Ej. 849201"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-indigo-500"
              />
              <span className="block text-[10px] text-slate-500 mt-1 text-center">
                (Prueba Demo PIN: <code className="text-emerald-400 font-mono">849201</code>)
              </span>
            </div>

            <button
              type="submit"
              disabled={loadingPin}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loadingPin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Confirmar PIN e Ingresar a Votaciones
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CASO 4: Asistencia confirmada -> Votaciones Habilitadas en vivo
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">PIN Asistencia Confirmado</span>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              {Array.isArray(auth?.roles) ? auth.roles.join(', ') : String(auth?.roles || '')}
            </span>
          </div>
        </div>

        {/* Property Selector for Multi-Unit / Proxy Voting */}
        {auth?.unidadesRepresentadas && auth.unidadesRepresentadas.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              Inmueble Activo para Votar:
            </label>
            <select
              value={selectedUnidadId || ''}
              onChange={(e) => setSelectedUnidadId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {auth.unidadesRepresentadas.map((u) => (
                <option key={u.unidadId} value={u.unidadId}>
                  Torre {u.torre} - Apt {u.numeroUnidad} (Coeficiente: {(u.coeficiente || 0).toFixed(4)}% {u.esPorPoder ? '• Poder Apoderado Aprobado' : '• Propietario Directo'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Línea de Tiempo Informativa de Estados de la Asamblea (Sin botones de transición) */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Línea de Tiempo de la Asamblea:
            </span>
            {asambleaDetalle?.titulo && (
              <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 truncate max-w-[200px]" title={asambleaDetalle.titulo}>
                {asambleaDetalle.titulo}
              </span>
            )}
          </div>
          <div className="bg-slate-950/90 p-2 rounded-2xl border border-slate-800/90 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              {pasosEstadoAsamblea.map((item, idx) => {
                const estadoActualIndex = pasosEstadoAsamblea.findIndex(p => p.estadoKey === asambleaDetalle?.estado);
                const isActual = estadoActualIndex === idx;
                const isCompletado = estadoActualIndex > idx;

                return (
                  <div key={item.paso} className="relative group w-full">
                    <div className={`px-2.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-1.5 ${
                      isActual
                        ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500/70 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                        : isCompletado
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60 group-hover:opacity-100 group-hover:border-slate-700'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 transition-all ${
                          isCompletado
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : isActual
                            ? 'bg-indigo-500 text-white animate-pulse shadow-sm'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isCompletado ? <CheckCircle2 className="w-3 h-3 stroke-[3]" /> : item.paso}
                        </span>
                        <span className={`text-[11px] font-extrabold truncate ${isActual ? 'text-white' : isCompletado ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {item.paso}. {item.titulo}
                        </span>
                      </div>

                      {isActual && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" title="Estado actual en curso" />
                      )}
                    </div>

                    {/* Tooltip emergente explicativo al pasar el cursor */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-60 p-2.5 bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl text-[11px] text-slate-200 animate-fadeIn pointer-events-none">
                      <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                        <span className="text-indigo-400 font-mono">Paso {item.paso}:</span> {item.titulo}
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[10px]">{item.descripcion}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active Questions Container */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Preguntas de la Asamblea</span>
          <button onClick={fetchPreguntasActivas} className="text-indigo-400 text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </h3>

        {(() => {
          const preguntasVisibles = preguntas.filter(p => p.estado !== 'ANULADA');
          if (preguntasVisibles.length === 0) {
            return (
              <div className="glass-panel p-6 rounded-2xl text-center text-slate-400 text-sm">
                No hay preguntas configuradas actualmente para la asamblea.
              </div>
            );
          }
          return preguntasVisibles.map((p) => {
            const isAbierta = p.estado === 'ABIERTA';
            const isAnulada = p.estado === 'ANULADA';
            const votoGuardado = votosEmitidos[p.id];

            return (
              <div key={p.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
                
                {/* Top Row: Moción ID & State Badge */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Moción / Pregunta ID #{p.id}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isAbierta 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse' 
                      : isAnulada
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : p.estado === 'FINALIZADA'
                      ? 'bg-slate-700 text-slate-300 border-slate-600'
                      : p.estado === 'PENDIENTE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isAbierta ? '• VOTACIÓN ABIERTA' : isAnulada ? 'ANULADA' : p.estado === 'FINALIZADA' ? 'FINALIZADA' : p.estado === 'PENDIENTE' ? 'PENDIENTE (POR ABRIR)' : 'CERRADA'}
                  </span>
                </div>

                {/* Question Enunciado */}
                <h4 className="text-lg font-bold text-white leading-snug">{p.enunciado}</h4>

                {/* Timer Widget occupying 100% width of card when open */}
                {isAbierta && (
                  <div className="w-full pt-1">
                    <TimerWidget
                      fechaHoraCierre={p.fechaHoraCierre}
                      duracionMinutos={p.duracionMinutos}
                      onExpire={fetchPreguntasActivas}
                    />
                  </div>
                )}

                {/* Voting Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {p.opciones && p.opciones.map((op, idx) => {
                    const isSelected = Number(votoGuardado) === Number(op.id);
                    const textoMostrar = op.texto || op.textoOpcion || `Opción ${idx + 1}`;
                    const style = getOptionStyle(textoMostrar, idx);
                    const IconComp = style.icon;

                    return (
                      <button
                        key={op.id}
                        disabled={!isAbierta || submittingVoto}
                        onClick={() => handleSolicitarConfirmacionVoto(p, op)}
                        className={`p-4.5 rounded-2xl border text-left transition-all duration-200 relative group overflow-hidden ${
                          isSelected
                            ? style.selectedBg
                            : isAbierta
                            ? `${style.bg} ${style.border} ${style.hoverGlow}`
                            : 'bg-slate-950/80 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 ${style.iconBg}`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div>
                              <span className={`text-base font-black tracking-wide block ${isSelected ? 'text-white font-extrabold' : style.text}`}>
                                {textoMostrar}
                              </span>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
                                {isSelected ? '✓ Tu Voto Confirmado' : style.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {isSelected ? (
                              <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg shadow-emerald-500/40 animate-pulse flex items-center gap-1">
                                <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                              </div>
                            ) : isAbierta ? (
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border transition-all ${style.badgeBg} group-hover:brightness-125`}>
                                Votar
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Monitor de Votación Ponderada en Vivo para Copropietarios & Apoderados */}
                {(() => {
                  const res = resultadosMap[p.id];
                  if (!res) return null;

                  const votaron = res.totalUnidadesVotaron || 0;
                  const asistentes = res.totalUnidadesAsistentes || 0;
                  const pctParticipacion = asistentes > 0 ? (votaron / asistentes) * 100 : 0;

                  return (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-emerald-400" />
                          Monitor de Votación Ponderada en Vivo
                        </h5>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Actualizado en vivo
                        </span>
                      </div>

                      {/* Tarjeta Resumen de Participación General */}
                      <div className="p-3.5 bg-slate-950/90 rounded-xl border border-indigo-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Participación de Votantes</span>
                          </div>
                          <div className="text-right font-extrabold text-indigo-300">
                            {pctParticipacion.toFixed(2)}%
                            <span className="text-[10px] text-slate-400 block font-mono font-normal">
                              ({votaron} de {asistentes} inmuebles)
                            </span>
                          </div>
                        </div>

                        {/* Barra de progreso de participación */}
                        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pctParticipacion, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Desglose Ponderado de Resultados por Opción */}
                      <div className="space-y-2.5">
                        {res.opciones && res.opciones.map((op) => {
                          const isAbstencion = op.opcionId === -1 || op.textoOpcion?.includes('Abstención');
                          return (
                            <div key={op.opcionId} className={`p-3 rounded-xl border space-y-1.5 ${isAbstencion ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-950/70 border-slate-800/80'}`}>
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-bold truncate max-w-[200px] sm:max-w-none ${isAbstencion ? 'text-amber-300' : 'text-white'}`}>
                                  {op.textoOpcion}
                                </span>
                                <div className="text-right shrink-0">
                                  <span className={`font-extrabold ${isAbstencion ? 'text-amber-300' : 'text-indigo-300'}`}>
                                    {(op.porcentajePonderado || 0).toFixed(2)}%
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    ({(op.sumaSistemaCoeficientes || 0).toFixed(4)}% Coef. / {op.totalVotosUnidades || 0} inmuebles)
                                  </span>
                                </div>
                              </div>

                              {/* Barra de progreso de la opción */}
                              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isAbstencion ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                                  style={{ width: `${Math.min(op.porcentajePonderado || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          });
        })()}
      </div>

      {/* Orden del Día - Línea de Tiempo Vertical Informativa (Colapsable Permanente) */}
      {ordenDia && ordenDia.puntos && ordenDia.puntos.length > 0 && (
        <div className="glass-panel rounded-3xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
          {/* Header clickeable para colapsar / expandir */}
          <button
            type="button"
            onClick={() => setOrdenDiaExpandido(prev => !prev)}
            className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-900/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Orden del Día</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    {ordenDiaExpandido ? 'Clic para contraer' : 'Clic para desplegar agenda'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Puntos de la asamblea y avance en tiempo real</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-bold text-indigo-300 font-mono bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                {ordenDia.puntos.filter(p => p.completado).length} / {ordenDia.puntos.length} Evacuados
              </span>
              <div className="p-2 bg-slate-900 text-indigo-400 rounded-xl border border-slate-700/80 transition-transform duration-200">
                {ordenDiaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {/* Contenido desplegable */}
          {ordenDiaExpandido && (
            <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 animate-fadeIn space-y-4">
              {/* Vertical Timeline Container */}
              <div className="relative pl-6 space-y-5 mt-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {ordenDia.puntos.map((punto, idx) => {
                  const isCompletado = punto.completado;
                  const isActual = !isCompletado && (idx === 0 || ordenDia.puntos[idx - 1]?.completado);

                  return (
                    <div key={punto.id || idx} className="relative flex items-start gap-3 group">
                      {/* Timeline Node Icon */}
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isCompletado
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                          : isActual
                          ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30 animate-pulse shadow-md shadow-indigo-500/40'
                          : 'bg-slate-900 border-2 border-slate-700 text-slate-600'
                      }`}>
                        {isCompletado ? (
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        ) : isActual ? (
                          <Clock className="w-3 h-3 text-white" />
                        ) : (
                          <span className="text-[9px] font-bold">{punto.orden}</span>
                        )}
                      </div>

                      {/* Point details */}
                      <div className={`flex-1 p-3 rounded-2xl border transition-all ${
                        isCompletado
                          ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300'
                          : isActual
                          ? 'bg-indigo-950/20 border-indigo-500/40 text-white shadow-md'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-bold ${isCompletado ? 'line-through text-slate-400' : isActual ? 'text-indigo-200' : 'text-slate-300'}`}>
                            {punto.orden}. {punto.titulo}
                          </h4>
                          {isCompletado && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                              Evacuado
                            </span>
                          )}
                          {isActual && (
                            <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                              En Discusión
                            </span>
                          )}
                        </div>
                        {punto.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-1">{punto.descripcion}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE VOTO */}
      {votoPendiente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel max-w-lg w-full p-4 sm:p-8 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-4 sm:space-y-6 relative overflow-hidden max-h-[85vh] overflow-y-auto">
            
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-white tracking-tight">Confirmar Emisión de Voto</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Verifica tu elección antes de registrar el voto inmutablemente</p>
                </div>
              </div>
            </div>

            {/* Moción / Pregunta Info */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Moción / Pregunta:</span>
              <p className="text-sm font-bold text-white leading-relaxed">{votoPendiente.pregunta.enunciado}</p>
            </div>



            {/* Opción Seleccionada Preview Card */}
            {(() => {
              const textoOp = votoPendiente.opcion.texto || votoPendiente.opcion.textoOpcion;
              const style = getOptionStyle(textoOp, 0);
              const IconComp = style.icon;
              return (
                <div className={`p-5 rounded-2xl border ${style.bg} ${style.border} shadow-lg space-y-2`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Opción Seleccionada:</span>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl border ${style.iconBg}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-lg font-black block ${style.text}`}>{textoOp}</span>
                      <span className="text-xs text-slate-300 font-medium">{style.label}</span>
                    </div>
                  </div>
                </div>
              );
            })()}



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={submittingVoto}
                onClick={() => setVotoPendiente(null)}
                className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 transition-colors"
              >
                Cancelar / Cambiar Opción
              </button>

              <button
                type="button"
                disabled={submittingVoto}
                onClick={handleEjecutarVotoConfirmado}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submittingVoto ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submittingVoto ? 'Guardando Voto...' : 'Sí, Confirmar y Registrar Voto'}
              </button>
            </div>

          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
