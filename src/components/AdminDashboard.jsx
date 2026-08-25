import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import QuorumWidget from './QuorumWidget';
import TimerWidget from './TimerWidget';
import OrdenDiaModal from './OrdenDiaModal';
import { ToastContainer, ConfirmModal, useToast } from './NotificationToast';
import { useWebSocket } from '../hooks/useWebSocket';
import { Vote, Play, Square, PieChart, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Users, UserPlus, ChevronDown, ChevronUp, ChevronRight, ArrowRight, Search, PlusCircle, Building, Calendar, FileText, X, Upload, Download, FileSpreadsheet, Clock, Edit3, Ban, Lock, ListOrdered, Mail } from 'lucide-react';

import HabitantesUnidadModal from './HabitantesUnidadModal';
import GestorPlantillasEmail from './GestorPlantillasEmail';

export default function AdminDashboard({ user = null, asambleaId = null }) {
  const isGestor = user?.roles?.includes('ROLE_GESTOR') && !user?.roles?.includes('ROLE_ADMIN') && !user?.roles?.includes('ROLE_SUPER_ADMIN');
  const [quorum, setQuorum] = useState(null);
  const [unidadResidentesModal, setUnidadResidentesModal] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [selectedPreguntaId, setSelectedPreguntaId] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOrdenDiaModal, setShowOrdenDiaModal] = useState(false);
  const [showPlantillasModal, setShowPlantillasModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Sistema de Notificaciones Flotantes y Modal de Confirmación
  const toast = useToast();
  const notifySuccess = (title, message) => toast.success(message, title);
  const notifyError = (title, message) => toast.error(message, title);
  const notifyWarning = (title, message) => toast.warning(message, title);
  const notifyInfo = (title, message) => toast.info(message, title);

  const showConfirmDialog = ({ title, message, type = 'warning', confirmText = 'Sí, confirmar', cancelText = 'Cancelar', onConfirm }) => {
    setConfirmConfig({
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  // Estados para Registro de Asistencia Manual / Presencial
  const [showManualForm, setShowManualForm] = useState(false);
  const [unidadIdManual, setUnidadIdManual] = useState('');
  const [cedulaManual, setCedulaManual] = useState('');
  const [esApoderadoManual, setEsApoderadoManual] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  // Estados para colapsar / expandir tablas
  const [isAsistenciaOpen, setIsAsistenciaOpen] = useState(true);
  const [isPoderesOpen, setIsPoderesOpen] = useState(true);

  // Estados para filtros de búsqueda por Torre + Apto (ej. 2505) o Nombre / Documento
  const [filterAsistencia, setFilterAsistencia] = useState('');
  const [filterPoderes, setFilterPoderes] = useState('');

  // Estados para Modal de Crear Nueva Asamblea
  const [showCrearAsambleaModal, setShowCrearAsambleaModal] = useState(false);
  const [tituloNuevaAsamblea, setTituloNuevaAsamblea] = useState('');
  const [tipoNuevaAsamblea, setTipoNuevaAsamblea] = useState('ORDINARIA');
  const [puntosOrdenDiaCreacion, setPuntosOrdenDiaCreacion] = useState([
    'Verificación del quórum deliberatorio',
    'Lectura y aprobación del Orden del Día',
    'Elección del Presidente y Secretario de la Asamblea',
    'Lectura y aprobación del informe de Administración',
    'Presentación y aprobación de los Estados Financieros',
    'Elección de los miembros del Consejo de Administración',
    'Proposiciones y varios'
  ]);
  const [crearAsambleaLoading, setCrearAsambleaLoading] = useState(false);

  // Estados para Modal de Crear / Editar Pregunta
  const [showCrearPreguntaModal, setShowCrearPreguntaModal] = useState(false);
  const [preguntaEditar, setPreguntaEditar] = useState(null);
  const [enunciadoNuevaPregunta, setEnunciadoNuevaPregunta] = useState('');
  const [tipoMayoriaNuevaPregunta, setTipoMayoriaNuevaPregunta] = useState('MAYORIA_SIMPLE');
  const [duracionMinutosNuevaPregunta, setDuracionMinutosNuevaPregunta] = useState(3);
  const [opcionesNuevaPregunta, setOpcionesNuevaPregunta] = useState(['Aprobar', 'Rechazar', 'Abstenerse']);
  const [crearPreguntaLoading, setCrearPreguntaLoading] = useState(false);

  // Estados para Modal de Abrir / Reabrir Votación
  const [showAbrirPreguntaModal, setShowAbrirPreguntaModal] = useState(false);
  const [preguntaParaAbrir, setPreguntaParaAbrir] = useState(null);
  const [duracionAperturaInput, setDuracionAperturaInput] = useState(3);

  // Estados para Modal de Gestión de Usuarios Gestores de Registro
  const [showGestoresModal, setShowGestoresModal] = useState(false);
  const [gestoresList, setGestoresList] = useState([]);
  const [gestorCedula, setGestorCedula] = useState('');
  const [gestorNombre, setGestorNombre] = useState('');
  const [gestorEmail, setGestorEmail] = useState('');
  const [gestorTelefono, setGestorTelefono] = useState('');
  const [gestoresLoading, setGestoresLoading] = useState(false);

  const fetchGestores = async () => {
    try {
      const activeTenantId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1';
      const res = await api.get(`/gestores?copropiedadId=${activeTenantId}`);
      setGestoresList(res.data);
    } catch (err) {
      console.warn("Error al cargar lista de gestores:", err);
    }
  };

  const handleCrearGestor = async (e) => {
    e.preventDefault();
    if (!gestorCedula.trim() || !gestorNombre.trim()) {
      notifyWarning("Campos Requeridos", "Cédula y Nombre Completo son obligatorios.");
      return;
    }
    try {
      setGestoresLoading(true);
      const activeTenantId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1';
      await api.post('/gestores', {
        cedula: gestorCedula.trim(),
        nombreCompleto: gestorNombre.trim(),
        email: gestorEmail.trim(),
        telefono: gestorTelefono.trim(),
        copropiedadId: parseInt(activeTenantId)
      });
      notifySuccess("Gestor Creado", `Usuario gestor para '${gestorNombre}' creado exitosamente con contraseña por defecto ''.`);
      setGestorCedula('');
      setGestorNombre('');
      setGestorEmail('');
      setGestorTelefono('');
      await fetchGestores();
    } catch (err) {
      notifyError("Error al crear gestor", err.response?.data?.message || err.message);
    } finally {
      setGestoresLoading(false);
    }
  };

  const handleResetearPasswordGestor = async (gestorId, gestorNombre) => {
    showConfirmDialog({
      title: "Restablecer Contraseña del Gestor",
      message: `¿Estás seguro de restablecer la contraseña de '${gestorNombre}'?`,
      type: "warning",
      confirmText: "Sí, restablecer clave",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const res = await api.post(`/gestores/${gestorId}/reset-password`);
          notifySuccess("Contraseña Restablecida", res.data?.message || "Contraseña restablecida.");
        } catch (err) {
          notifyError("Error al restablecer contraseña", err.response?.data?.message || err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleSolicitarAbrirPregunta = (p) => {
    if (asambleaSeleccionada?.estado !== 'EN_CURSO') {
      notifyWarning("Asamblea No Iniciada", "Debes cerrar el registro de asistencia presencial y dar inicio a la asamblea antes de abrir votaciones en vivo.");
      return;
    }
    setPreguntaParaAbrir(p);
    setDuracionAperturaInput(p.duracionMinutos || 3);
    setShowAbrirPreguntaModal(true);
  };

  const handleConfirmarAbrirVotacion = async (e) => {
    e.preventDefault();
    if (!preguntaParaAbrir) return;

    const mins = parseInt(duracionAperturaInput);
    if (!mins || mins < 1) {
      notifyWarning("Duración Requerida", "Por favor ingresa una cantidad válida de minutos (mayor a 0).");
      return;
    }

    try {
      setActionLoading(true);
      await api.patch(`/preguntas/${preguntaParaAbrir.id}/estado?estado=ABIERTA&duracionMinutos=${mins}`);
      setShowAbrirPreguntaModal(false);
      setPreguntaParaAbrir(null);
      notifySuccess("Votación Iniciada", `Votación abierta exitosamente por ${mins} minutos.`);
      await fetchPreguntas(currentAsambleaId);
      await fetchResultados(preguntaParaAbrir.id);
    } catch (err) {
      notifyError("No se pudo abrir la votación", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Estados para Modal de Registrar Nuevo Inmueble / Unidad
  const [showCrearUnidadModal, setShowCrearUnidadModal] = useState(false);
  const [tabRegistroUnidad, setTabRegistroUnidad] = useState('individual'); // 'individual' | 'masivo'
  const [torreNuevaUnidad, setTorreNuevaUnidad] = useState('');
  const [numeroNuevaUnidad, setNumeroNuevaUnidad] = useState('');
  const [coeficienteNuevaUnidad, setCoeficienteNuevaUnidad] = useState('');
  const [cedulaPropietarioNuevaUnidad, setCedulaPropietarioNuevaUnidad] = useState('');
  const [nombrePropietarioNuevaUnidad, setNombrePropietarioNuevaUnidad] = useState('');
  const [emailPropietarioNuevaUnidad, setEmailPropietarioNuevaUnidad] = useState('');
  const [telefonoPropietarioNuevaUnidad, setTelefonoPropietarioNuevaUnidad] = useState('');
  const [documentoApoderadoNuevaUnidad, setDocumentoApoderadoNuevaUnidad] = useState('');
  const [nombreApoderadoNuevaUnidad, setNombreApoderadoNuevaUnidad] = useState('');
  const [emailApoderadoNuevaUnidad, setEmailApoderadoNuevaUnidad] = useState('');
  const [telefonoApoderadoNuevaUnidad, setTelefonoApoderadoNuevaUnidad] = useState('');
  const [crearUnidadLoading, setCrearUnidadLoading] = useState(false);
  const [showApoderadoCrear, setShowApoderadoCrear] = useState(false);

  // Estados para Modal de Editar Inmueble / Propietario / Apoderado
  const [showEditarUnidadModal, setShowEditarUnidadModal] = useState(false);
  const [unidadEditar, setUnidadEditar] = useState(null);
  const [editTorre, setEditTorre] = useState('');
  const [editNumeroUnidad, setEditNumeroUnidad] = useState('');
  const [editCoeficiente, setEditCoeficiente] = useState('');
  const [editCedulaProp, setEditCedulaProp] = useState('');
  const [editNombreProp, setEditNombreProp] = useState('');
  const [editEmailProp, setEditEmailProp] = useState('');
  const [editTelProp, setEditTelProp] = useState('');
  const [editDocApoderado, setEditDocApoderado] = useState('');
  const [editNombreApoderado, setEditNombreApoderado] = useState('');
  const [editEmailApoderado, setEditEmailApoderado] = useState('');
  const [editTelApoderado, setEditTelApoderado] = useState('');
  const [editarUnidadLoading, setEditarUnidadLoading] = useState(false);
  const [showApoderadoEdit, setShowApoderadoEdit] = useState(false);

  const handleAbrirEditarUnidad = (u) => {
    setUnidadEditar(u);
    setEditTorre(u.torre || '');
    setEditNumeroUnidad(u.numeroUnidad || '');
    setEditCoeficiente(u.coeficiente || '');
    setEditCedulaProp(u.propietario?.cedula || '');
    setEditNombreProp(u.propietario?.nombreCompleto || '');
    setEditEmailProp(u.propietario?.email || '');
    setEditTelProp(u.propietario?.telefono || '');
    setEditDocApoderado(u.apoderado?.documento || '');
    setEditNombreApoderado(u.apoderado?.nombreCompleto || '');
    setEditEmailApoderado(u.apoderado?.email || '');
    setEditTelApoderado(u.apoderado?.telefono || '');
    setShowApoderadoEdit(Boolean(u.apoderado?.documento || u.apoderado?.nombreCompleto));
    setShowEditarUnidadModal(true);
  };

  const handleGuardarEditarUnidad = async (e) => {
    e.preventDefault();
    if (!unidadEditar) return;

    try {
      setEditarUnidadLoading(true);
      const res = await api.put(`/unidades/${unidadEditar.id}`, {
        torre: editTorre.trim(),
        numeroUnidad: editNumeroUnidad.trim(),
        coeficiente: parseFloat(editCoeficiente) || 0,
        cedulaPropietario: editCedulaProp.trim(),
        nombrePropietario: editNombreProp.trim(),
        emailPropietario: editEmailProp.trim(),
        telefonoPropietario: editTelProp.trim(),
        documentoApoderado: editDocApoderado.trim(),
        nombreApoderado: editNombreApoderado.trim(),
        emailApoderado: editEmailApoderado.trim(),
        telefonoApoderado: editTelApoderado.trim(),
      });

      notifySuccess("Inmueble Actualizado", `Inmueble Torre ${res.data.torre} - Apt ${res.data.numeroUnidad} guardado exitosamente.`);
      setShowEditarUnidadModal(false);
      setUnidadEditar(null);
      await fetchUnidades();
      if (currentAsambleaId) {
        await fetchAsistentes(currentAsambleaId);
        await fetchQuorum(currentAsambleaId);
      }
    } catch (err) {
      notifyError("Error al actualizar inmueble", err.response?.data?.message || err.message);
    } finally {
      setEditarUnidadLoading(false);
    }
  };

  // Estados para Cargue Masivo Excel
  const [archivoCargueMasivo, setArchivoCargueMasivo] = useState(null);
  const [cargueMasivoLoading, setCargueMasivoLoading] = useState(false);
  const [cargueMasivoResultado, setCargueMasivoResultado] = useState(null);

  // Función para seleccionar unidad y auto-cargar cédula del asistente (propietario o apoderado)
  const handleSeleccionarUnidad = (idStr, list = unidades) => {
    setUnidadIdManual(idStr);
    if (!idStr) {
      setCedulaManual('');
      setEsApoderadoManual(false);
      return;
    }
    const u = list.find((unit) => String(unit.id) === String(idStr));
    if (u) {
      if (u.apoderado && u.apoderado.documento) {
        setCedulaManual(u.apoderado.documento);
        setEsApoderadoManual(true);
      } else if (u.propietario && u.propietario.cedula) {
        setCedulaManual(u.propietario.cedula);
        setEsApoderadoManual(false);
      } else {
        setCedulaManual('');
        setEsApoderadoManual(false);
      }
    }
  };

  const handleRegistrarAsistenciaManual = async (e) => {
    e.preventDefault();
    if (!currentAsambleaId) {
      notifyWarning("Asamblea Requerida", "No hay asambleas activas en este momento. Debes iniciar una asamblea antes de registrar asistencia.");
      return;
    }
    if (!unidadIdManual) {
      notifyWarning("Inmueble Requerido", "Por favor selecciona un inmueble.");
      return;
    }
    if (!cedulaManual.trim()) {
      notifyWarning("Cédula Requerida", "Por favor ingresa el número de cédula del asistente.");
      return;
    }
    try {
      setManualLoading(true);
      await api.post('/asambleas/asistencia', {
        asambleaId: currentAsambleaId,
        unidadPrivadaId: Number(unidadIdManual),
        cedulaPersona: cedulaManual.trim(),
        esApoderado: esApoderadoManual,
      });
      notifySuccess("Asistencia Registrada", "Asistencia presencial registrada. Se ha generado y enviado el PIN de 6 dígitos al correo del asistente.");
      setShowManualForm(false);
      await fetchAsistentes(currentAsambleaId);
      await fetchQuorum(currentAsambleaId);
    } catch (err) {
      notifyError("Error de registro", err.response?.data?.message || err.message);
    } finally {
      setManualLoading(false);
    }
  };

  const handleRegistrarAsistenciaDirecta = async (unidad) => {
    if (!currentAsambleaId) {
      notifyWarning("Asamblea Requerida", "No hay asambleas activas en este momento. Debes iniciar una asamblea antes de registrar asistencia.");
      return;
    }
    const cedula = unidad.apoderado ? unidad.apoderado.documento : unidad.propietario?.cedula;
    if (!cedula) {
      notifyWarning("Cédula No Encontrada", "No se encontró la cédula registrada del propietario o apoderado para esta unidad.");
      return;
    }
    try {
      setActionLoading(true);
      await api.post('/asambleas/asistencia', {
        asambleaId: currentAsambleaId,
        unidadPrivadaId: unidad.id,
        cedulaPersona: cedula.trim(),
        esApoderado: Boolean(unidad.apoderado),
      });
      notifySuccess("Asistencia Confirmada", `Asistencia presencial registrada para Torre ${unidad.torre} - Apt ${unidad.numeroUnidad}. PIN enviado a su correo.`);
      await fetchAsistentes(currentAsambleaId);
      await fetchQuorum(currentAsambleaId);
    } catch (err) {
      notifyError("Error de registro", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const [asambleas, setAsambleas] = useState([]);
  const [currentAsambleaId, setCurrentAsambleaId] = useState(null);

  const fetchAsambleas = async () => {
    try {
      const res = await api.get('/asambleas');
      setAsambleas(res.data);
      const activa = res.data.find(a => a.estado === 'EN_REGISTRO' || a.estado === 'EN_CURSO' || a.estado === 'PROGRAMADA');
      if (activa) {
        setCurrentAsambleaId(activa.id);
      } else {
        setCurrentAsambleaId(null);
      }
    } catch (err) {
      console.error("Error al cargar asambleas del tenant:", err);
    }
  };

  const handleToggleCerrarRegistro = async (asambleaIdToToggle, cerradoActual) => {
    const nuevoEstado = !cerradoActual;

    showConfirmDialog({
      title: nuevoEstado ? "Cerrar Registro de Asistencia" : "Reabrir Registro de Asistencia",
      message: nuevoEstado
        ? "¿Estás seguro de que deseas CERRAR el registro de asistencia? No se podrán registrar asistencias presenciales mientras esté cerrado."
        : "¿Deseas REABRIR el registro de asistencia presencial para esta asamblea?",
      type: nuevoEstado ? "stop" : "info",
      confirmText: nuevoEstado ? "Sí, cerrar registro" : "Sí, reabrir registro",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await api.patch(`/asambleas/${asambleaIdToToggle}/registro-cerrado?cerrado=${nuevoEstado}`);
          notifySuccess("Registro de Asistencia", nuevoEstado ? "Registro de asistencia cerrado exitosamente." : "Registro de asistencia reabierto exitosamente.");
          await fetchAsambleas();
        } catch (err) {
          notifyError("Error al actualizar registro", err.response?.data?.message || err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const fetchQuorum = async (targetId = currentAsambleaId) => {
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await api.get(`/asambleas/${targetId}/quorum`);
      setQuorum(res.data);
    } catch (err) {
      console.error("Error al cargar quórum:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreguntas = async (targetId = currentAsambleaId) => {
    if (!targetId) return;
    try {
      const res = await api.get(`/preguntas/asamblea/${targetId}`);
      setPreguntas(res.data);
      const activas = res.data.filter(p => p.estado !== 'FINALIZADA' && p.estado !== 'ANULADA');
      if (activas.length > 0) {
        if (!activas.some(p => p.id === selectedPreguntaId)) {
          setSelectedPreguntaId(activas[0].id);
        }
      } else {
        setSelectedPreguntaId(null);
        setResultados(null);
      }
    } catch (err) {
      console.error("Error al cargar preguntas:", err);
    }
  };

  const fetchAsistentes = async (targetId = currentAsambleaId) => {
    if (!targetId) return;
    try {
      const res = await api.get(`/asambleas/${targetId}/asistentes`);
      setAsistentes(res.data);
    } catch (err) {
      console.error("Error al cargar asistentes:", err);
    }
  };

  const fetchResultados = async (preguntaId) => {
    if (!preguntaId) return;
    try {
      const res = await api.get(`/preguntas/${preguntaId}/resultados`);
      setResultados(res.data);
    } catch (err) {
      console.error("Error al cargar resultados:", err);
    }
  };

  // Estado para gestión y aprobación de poderes
  const [unidades, setUnidades] = useState([]);

  const fetchUnidades = async () => {
    try {
      const res = await api.get('/unidades');
      setUnidades(res.data);
      if (res.data.length > 0 && !unidadIdManual) {
        handleSeleccionarUnidad(String(res.data[0].id), res.data);
      }
    } catch (err) {
      console.error("Error al cargar unidades del tenant:", err);
    }
  };

  const handleToggleAprobarPoder = async (unidadId, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual;
      await api.patch(`/unidades/${unidadId}/aprobar-poder?aprobado=${nuevoEstado}`);
      await fetchUnidades();
      if (currentAsambleaId) {
        await fetchAsistentes(currentAsambleaId);
        await fetchQuorum(currentAsambleaId);
      }
    } catch (err) {
      notifyError("Error de poder", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchAsambleas();
    fetchUnidades();
  }, []);

  useEffect(() => {
    if (currentAsambleaId) {
      fetchQuorum(currentAsambleaId);
      fetchPreguntas(currentAsambleaId);
      fetchAsistentes(currentAsambleaId);
    } else {
      setQuorum(null);
      setPreguntas([]);
      setSelectedPreguntaId(null);
      setAsistentes([]);
    }
  }, [currentAsambleaId]);

  // ⚡ Suscripciones WebSocket en tiempo real para resultados y quórum
  useWebSocket(
    currentAsambleaId ? `/topic/asamblea/${currentAsambleaId}/votos` : null,
    (event) => {
      if (selectedPreguntaId) fetchResultados(selectedPreguntaId);
      if (currentAsambleaId) fetchQuorum(currentAsambleaId);
    },
    Boolean(currentAsambleaId)
  );

  useWebSocket(
    currentAsambleaId ? `/topic/asamblea/${currentAsambleaId}/quorum` : null,
    (event) => {
      if (currentAsambleaId) fetchQuorum(currentAsambleaId);
    },
    Boolean(currentAsambleaId)
  );

  useEffect(() => {
    if (selectedPreguntaId) {
      fetchResultados(selectedPreguntaId);
    }
  }, [selectedPreguntaId]);

  const handleCambiarEstadoPregunta = async (preguntaId, nuevoEstado) => {
    try {
      setActionLoading(true);
      await api.patch(`/preguntas/${preguntaId}/estado?estado=${nuevoEstado}`);
      if (nuevoEstado === 'FINALIZADA' || nuevoEstado === 'ANULADA') {
        if (selectedPreguntaId === preguntaId) {
          setSelectedPreguntaId(null);
          setResultados(null);
        }
      }
      await fetchPreguntas();
      if (nuevoEstado !== 'FINALIZADA' && nuevoEstado !== 'ANULADA') {
        await fetchResultados(preguntaId);
      }
    } catch (err) {
      notifyError("No se pudo cambiar el estado", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizarAsamblea = async (asambleaIdToFinish) => {
    showConfirmDialog({
      title: "Finalizar Asamblea en Curso",
      message: "¿Estás seguro de que deseas concluir la asamblea activa? Una vez finalizada, podrás iniciar una nueva asamblea.",
      type: "stop",
      confirmText: "Sí, finalizar asamblea",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await api.patch(`/asambleas/${asambleaIdToFinish}/estado?estado=FINALIZADA`);
          notifySuccess("Asamblea Concluida", "La asamblea ha sido finalizada exitosamente.");
          await fetchAsambleas();
        } catch (err) {
          notifyError("Error al finalizar asamblea", err.response?.data?.message || err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleCrearAsamblea = async (e) => {
    e.preventDefault();
    if (!tituloNuevaAsamblea.trim()) {
      notifyWarning("Título Requerido", "Por favor ingresa el título de la asamblea.");
      return;
    }

    const puntosValidos = puntosOrdenDiaCreacion.filter(p => p.trim() !== '');
    if (puntosValidos.length === 0) {
      notifyWarning("Orden del Día Requerido", "Por favor incluye al menos un punto en el Orden del Día.");
      return;
    }

    try {
      setCrearAsambleaLoading(true);
      const activeTenantId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1';
      const res = await api.post('/asambleas', {
        titulo: tituloNuevaAsamblea.trim(),
        tipo: tipoNuevaAsamblea,
        copropiedadId: parseInt(activeTenantId),
        ordenDia: puntosValidos.map((t, idx) => ({ orden: idx + 1, titulo: t.trim() }))
      });
      notifySuccess("Asamblea Creada", `Asamblea "${res.data.titulo}" registrada y programada exitosamente con su Orden del Día.`);
      setShowCrearAsambleaModal(false);
      setTituloNuevaAsamblea('');
      window.location.reload();
    } catch (err) {
      notifyError("Error al crear la asamblea", err.response?.data?.message || err.message);
    } finally {
      setCrearAsambleaLoading(false);
    }
  };

  const handleAbrirCrearPregunta = () => {
    const tienePreguntaSinFinalizar = preguntas.some(p => p.estado === 'PENDIENTE' || p.estado === 'ABIERTA' || p.estado === 'CERRADA');
    if (tienePreguntaSinFinalizar) {
      notifyWarning("Pregunta Activa en Curso", "Debes finalizar o anular la pregunta actual antes de crear una nueva.");
      return;
    }
    setPreguntaEditar(null);
    setEnunciadoNuevaPregunta('');
    setTipoMayoriaNuevaPregunta('MAYORIA_SIMPLE');
    setDuracionMinutosNuevaPregunta(3);
    setOpcionesNuevaPregunta(['Aprobar', 'Rechazar', 'Abstenerse']);
    setShowCrearPreguntaModal(true);
  };

  const handleAbrirEditarPregunta = (p) => {
    if (p.estado !== 'PENDIENTE') {
      notifyWarning("Edición No Disponible", "Solo se pueden editar preguntas en estado PENDIENTE antes de iniciar la votación.");
      return;
    }
    setPreguntaEditar(p);
    setEnunciadoNuevaPregunta(p.enunciado);
    setTipoMayoriaNuevaPregunta(p.tipoMayoria || 'MAYORIA_SIMPLE');
    setDuracionMinutosNuevaPregunta(p.duracionMinutos || 3);
    setOpcionesNuevaPregunta(p.opciones && p.opciones.length > 0 ? p.opciones.map(o => o.textoOpcion || o.texto) : ['Aprobar', 'Rechazar', 'Abstenerse']);
    setShowCrearPreguntaModal(true);
  };

  const handleAnularPregunta = async (preguntaId) => {
    showConfirmDialog({
      title: "Anular Moción de Votación",
      message: "¿Estás seguro de que deseas ANULAR esta pregunta? Se descartará la moción y los votos emitidos.",
      type: "danger",
      confirmText: "Sí, anular moción",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await api.patch(`/preguntas/${preguntaId}/estado?estado=ANULADA`);
          notifySuccess("Moción Anulada", "La pregunta ha sido anulada exitosamente.");
          if (currentAsambleaId) {
            await fetchPreguntas(currentAsambleaId);
          }
          if (selectedPreguntaId === preguntaId) {
            fetchResultados(preguntaId);
          }
        } catch (err) {
          notifyError("Error al anular pregunta", err.response?.data?.message || err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleCrearPregunta = async (e) => {
    e.preventDefault();
    if (!enunciadoNuevaPregunta.trim()) {
      notifyWarning("Enunciado Requerido", "Por favor ingresa el texto de la pregunta.");
      return;
    }
    if (!currentAsambleaId) {
      notifyWarning("Asamblea Requerida", "Por favor selecciona una asamblea.");
      return;
    }
    const opcionesValidas = opcionesNuevaPregunta.map(o => o.trim()).filter(Boolean);
    if (opcionesValidas.length < 2) {
      notifyWarning("Opciones Insuficientes", "Por favor ingresa al menos 2 opciones de respuesta.");
      return;
    }
    try {
      setCrearPreguntaLoading(true);

      const payload = {
        asambleaId: currentAsambleaId,
        enunciado: enunciadoNuevaPregunta.trim(),
        tipoMayoria: tipoMayoriaNuevaPregunta,
        duracionMinutos: parseInt(duracionMinutosNuevaPregunta) || 5,
        opciones: opcionesValidas,
      };

      let res;
      if (preguntaEditar) {
        res = await api.put(`/preguntas/${preguntaEditar.id}`, payload);
        notifySuccess("Pregunta Actualizada", "La moción de votación fue editada exitosamente.");
      } else {
        res = await api.post('/preguntas', payload);
        notifySuccess("Pregunta Creada", "Nueva moción registrada exitosamente para la asamblea.");
      }

      setShowCrearPreguntaModal(false);
      setPreguntaEditar(null);
      setEnunciadoNuevaPregunta('');
      setTipoMayoriaNuevaPregunta('MAYORIA_SIMPLE');
      setDuracionMinutosNuevaPregunta(5);
      setOpcionesNuevaPregunta(['Aprobar', 'Rechazar', 'Abstenerse']);
      await fetchPreguntas(currentAsambleaId);
      if (res.data && res.data.id) {
        setSelectedPreguntaId(res.data.id);
      }
    } catch (err) {
      notifyError("Error al guardar pregunta", err.response?.data?.message || err.message);
    } finally {
      setCrearPreguntaLoading(false);
    }
  };

  const handleCrearUnidad = async (e) => {
    e.preventDefault();
    if (!torreNuevaUnidad.trim() || !numeroNuevaUnidad.trim()) {
      notifyWarning("Datos Incompletos", "Por favor ingresa la torre y el número del inmueble.");
      return;
    }
    try {
      setCrearUnidadLoading(true);
      const activeTenantId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1';
      const res = await api.post('/unidades', {
        torre: torreNuevaUnidad.trim(),
        numeroUnidad: numeroNuevaUnidad.trim(),
        coeficiente: parseFloat(coeficienteNuevaUnidad) || 5.0,
        copropiedadId: parseInt(activeTenantId),
        cedulaPropietario: cedulaPropietarioNuevaUnidad.trim(),
        nombrePropietario: nombrePropietarioNuevaUnidad.trim(),
        emailPropietario: emailPropietarioNuevaUnidad.trim(),
        telefonoPropietario: telefonoPropietarioNuevaUnidad.trim(),
        documentoApoderado: documentoApoderadoNuevaUnidad.trim(),
        nombreApoderado: nombreApoderadoNuevaUnidad.trim(),
        emailApoderado: emailApoderadoNuevaUnidad.trim(),
        telefonoApoderado: telefonoApoderadoNuevaUnidad.trim(),
      });
      notifySuccess("Inmueble Creado", `Inmueble Torre ${res.data.torre} - Apt ${res.data.numeroUnidad} creado exitosamente.`);
      setShowCrearUnidadModal(false);
      setTorreNuevaUnidad('');
      setNumeroNuevaUnidad('');
      setCoeficienteNuevaUnidad('');
      setCedulaPropietarioNuevaUnidad('');
      setNombrePropietarioNuevaUnidad('');
      setEmailPropietarioNuevaUnidad('');
      setTelefonoPropietarioNuevaUnidad('');
      setDocumentoApoderadoNuevaUnidad('');
      setNombreApoderadoNuevaUnidad('');
      setEmailApoderadoNuevaUnidad('');
      setTelefonoApoderadoNuevaUnidad('');
      await fetchUnidades();
      if (currentAsambleaId) {
        await fetchAsistentes(currentAsambleaId);
        await fetchQuorum(currentAsambleaId);
      }
    } catch (err) {
      notifyError("Error al registrar inmueble", err.response?.data?.message || err.message);
    } finally {
      setCrearUnidadLoading(false);
    }
  };

  const handleCargueMasivo = async (e) => {
    e.preventDefault();
    if (!archivoCargueMasivo) {
      notifyWarning("Archivo Requerido", "Por favor selecciona un archivo de Excel (.xlsx, .xls) o CSV.");
      return;
    }
    try {
      setCargueMasivoLoading(true);
      setCargueMasivoResultado(null);
      const activeTenantId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1';
      const formData = new FormData();
      formData.append('file', archivoCargueMasivo);
      formData.append('copropiedadId', activeTenantId);

      const res = await api.post('/unidades/cargue-masivo', formData);

      setCargueMasivoResultado(res.data);
      setArchivoCargueMasivo(null);
      notifySuccess("Cargue Completo", "Se procesaron las unidades del archivo exitosamente.");
      await fetchUnidades();
      await fetchAsistentes();
      await fetchQuorum();
    } catch (err) {
      notifyError("Error en cargue masivo", err.response?.data?.message || err.message);
    } finally {
      setCargueMasivoLoading(false);
    }
  };

  // Filtrado de Asistentes por términos separados por coma (ej. "1102, 2201, 3301") o Nombres / Cédulas
  const asistentesFiltrados = asistentes.filter((a) => {
    if (!filterAsistencia.trim()) return true;
    const terms = filterAsistencia.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (terms.length === 0) return true;

    const torre = String(a.unidadPrivada?.torre || '').toLowerCase();
    const apto = String(a.unidadPrivada?.numeroUnidad || '').toLowerCase();
    const concatenado = `${torre}${apto}`;
    const nombre = String(a.persona?.nombreCompleto || '').toLowerCase();
    const cedula = String(a.persona?.cedula || '').toLowerCase();

    return terms.some((term) => (
      concatenado.includes(term) ||
      torre.includes(term) ||
      apto.includes(term) ||
      nombre.includes(term) ||
      cedula.includes(term)
    ));
  });

  // Filtrado de Poderes / Unidades por términos separados por coma (ej. "1102, 2201, 3301") o Nombres / Cédulas
  const unidadesFiltradas = unidades.filter((u) => {
    if (!filterPoderes.trim()) return true;
    const terms = filterPoderes.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (terms.length === 0) return true;

    const torre = String(u.torre || '').toLowerCase();
    const apto = String(u.numeroUnidad || '').toLowerCase();
    const concatenado = `${torre}${apto}`;
    const propNombre = String(u.propietario?.nombreCompleto || '').toLowerCase();
    const propCedula = String(u.propietario?.cedula || '').toLowerCase();
    const apodNombre = String(u.apoderado?.nombreCompleto || '').toLowerCase();
    const apodDoc = String(u.apoderado?.documento || '').toLowerCase();

    return terms.some((term) => (
      concatenado.includes(term) ||
      torre.includes(term) ||
      apto.includes(term) ||
      propNombre.includes(term) ||
      propCedula.includes(term) ||
      apodNombre.includes(term) ||
      apodDoc.includes(term)
    ));
  });

  const asambleaSeleccionada = asambleas.find(a => a.id === currentAsambleaId);
  const tieneAsambleaActiva = asambleas.some(a => a.estado === 'EN_REGISTRO' || a.estado === 'EN_CURSO');

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

  const handleAvanzarEstado = async (estadoActualKey) => {
    if (!asambleaSeleccionada) return;

    if (estadoActualKey === 'PROGRAMADA') {
      showConfirmDialog({
        title: "Abrir Registro de Asistencia",
        message: "¿Deseas pasar la asamblea al estado EN REGISTRO para habilitar el control de quórum y bienvenida en la entrada?",
        type: "info",
        confirmText: "Sí, abrir registro",
        onConfirm: async () => {
          try {
            setActionLoading(true);
            await api.patch(`/asambleas/${asambleaSeleccionada.id}/estado?estado=EN_REGISTRO`);
            notifySuccess("Registro Abierto", "Se ha cambiado el estado de la asamblea a EN REGISTRO.");
            await fetchAsambleas();
          } catch (err) {
            notifyError("Error al abrir registro", err.response?.data?.message || err.message);
          } finally {
            setActionLoading(false);
          }
        }
      });
    } else if (estadoActualKey === 'EN_REGISTRO') {
      if (!asambleaSeleccionada?.registroCerrado) {
        notifyWarning("Registro Abierto", "Debes hacer clic en 'Cerrar Registro Asistencia' en el panel de quórum antes de dar inicio a la asamblea.");
        return;
      }
      showConfirmDialog({
        title: "Dar Inicio a la Asamblea",
        message: "¿Deseas dar inicio formal a la asamblea? Se cambiará el estado a EN CURSO y se habilitarán las preguntas y votaciones en vivo.",
        type: "info",
        confirmText: "Sí, dar inicio a la asamblea",
        onConfirm: async () => {
          try {
            setActionLoading(true);
            await api.patch(`/asambleas/${asambleaSeleccionada.id}/estado?estado=EN_CURSO`);
            notifySuccess("Asamblea Iniciada", "La asamblea ha iniciado formalmente.");
            await fetchAsambleas();
          } catch (err) {
            notifyError("Error al iniciar asamblea", err.response?.data?.message || err.message);
          } finally {
            setActionLoading(false);
          }
        }
      });
    } else if (estadoActualKey === 'EN_CURSO') {
      handleFinalizarAsamblea(asambleaSeleccionada.id);
    }
  };

  return (
    <div className="space-y-8">
      {!isGestor && (
        <>
          {/* Action Toolbar & Interactive Timeline for Administration */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">

            {/* 1. Controles de Gestión de Asamblea y Botones de Acción */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Gestión de Asamblea
                </h2>
                {asambleas.length > 0 && (
                  <div className="ml-3 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 hidden sm:inline">Asamblea:</span>
                    <select
                      value={currentAsambleaId || ''}
                      onChange={(e) => setCurrentAsambleaId(Number(e.target.value))}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    >
                      {asambleas.map((a) => {
                        const estadoLabel =
                          a.estado === 'PROGRAMADA' ? '[ 📅 PROGRAMADA ]' :
                            a.estado === 'EN_REGISTRO' ? '[ 📝 EN REGISTRO ]' :
                              a.estado === 'EN_CURSO' ? '[ 🟢 EN CURSO ]' :
                                a.estado === 'FINALIZADA' ? '[ 🏁 FINALIZADA ]' :
                                  `[ ${a.estado} ]`;

                        return (
                          <option key={a.id} value={a.id} className="bg-slate-900 text-white font-semibold">
                            {a.titulo} {estadoLabel}
                          </option>
                        );
                      })}
                    </select>

                    {/* Badge de Estado de la Asamblea Seleccionada */}
                    {asambleaSeleccionada && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 shrink-0 ${asambleaSeleccionada.estado === 'PROGRAMADA'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : asambleaSeleccionada.estado === 'EN_REGISTRO'
                          ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                          : asambleaSeleccionada.estado === 'EN_CURSO'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                        {asambleaSeleccionada.estado === 'EN_CURSO' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        )}
                        {asambleaSeleccionada.estado === 'PROGRAMADA' && '📅 PROGRAMADA'}
                        {asambleaSeleccionada.estado === 'EN_REGISTRO' && '📝 EN REGISTRO'}
                        {asambleaSeleccionada.estado === 'EN_CURSO' && '🟢 EN CURSO'}
                        {asambleaSeleccionada.estado === 'FINALIZADA' && '🏁 FINALIZADA'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                {asambleaSeleccionada?.estado === 'EN_REGISTRO' && (
                  <>
                    {quorum?.alcanzoQuorum ? (
                      <button
                        onClick={() => {
                          if (!asambleaSeleccionada?.registroCerrado) {
                            notifyWarning("Registro Abierto", "Debes hacer clic en 'Cerrar Registro Asistencia' en el panel de quórum antes de dar inicio a la asamblea.");
                            return;
                          }

                          showConfirmDialog({
                            title: "Dar Inicio a la Asamblea",
                            message: "¿Deseas dar inicio formal a la asamblea? Se cambiará el estado a EN CURSO y se habilitarán las preguntas y votaciones en vivo.",
                            type: "info",
                            confirmText: "Sí, dar inicio a la asamblea",
                            onConfirm: async () => {
                              try {
                                setActionLoading(true);
                                await api.patch(`/asambleas/${asambleaSeleccionada.id}/estado?estado=EN_CURSO`);
                                notifySuccess("Asamblea Iniciada", "La asamblea ha iniciado formalmente. Las votaciones en vivo están habilitadas.");
                                await fetchAsambleas();
                              } catch (err) {
                                notifyError("Error al iniciar asamblea", err.response?.data?.message || err.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }
                          });
                        }}
                        disabled={!asambleaSeleccionada?.registroCerrado || actionLoading}
                        title={!asambleaSeleccionada?.registroCerrado ? "Debes cerrar el registro de asistencia presencial antes de dar inicio a la asamblea" : "Iniciar formalmente la asamblea y habilitar preguntas en vivo"}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${!asambleaSeleccionada?.registroCerrado
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-emerald-500/20'
                          }`}
                      >
                        <Play className="w-4 h-4 fill-current text-white" /> Dar Inicio a la Asamblea
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          showConfirmDialog({
                            title: "Finalizar Asamblea por Falta de Quórum",
                            message: `No se alcanzó el quórum deliberatorio mínimo (> 50.00%). El quórum acumulado actual es de ${quorum?.porcentajeQuorum ?? 0}%. ¿Deseas declarar fallida y finalizar la asamblea por falta de quórum conforme a la Ley 675?`,
                            type: "stop",
                            confirmText: "Sí, finalizar por falta de quórum",
                            onConfirm: async () => {
                              try {
                                setActionLoading(true);
                                await api.patch(`/asambleas/${asambleaSeleccionada.id}/estado?estado=FINALIZADA`);
                                notifySuccess("Asamblea Finalizada", "Se ha cerrado la asamblea por falta de quórum deliberatorio.");
                                await fetchAsambleas();
                              } catch (err) {
                                notifyError("Error al finalizar asamblea", err.response?.data?.message || err.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }
                          });
                        }}
                        disabled={actionLoading}
                        title="No hay quórum deliberatorio suficiente para dar inicio (> 50%). Clic para finalizar la asamblea."
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-md bg-gradient-to-r from-rose-700 to-red-600 hover:brightness-110 text-white shadow-rose-500/20 animate-pulse"
                      >
                        <XCircle className="w-4 h-4 text-white" /> Finalizar por Falta de Quórum ({quorum?.porcentajeQuorum ?? 0}%)
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => {
                    if (tieneAsambleaActiva) {
                      notifyWarning("Asamblea Activa", "Ya existe una asamblea activa en registro o en curso. Debes finalizarla antes de crear una nueva.");
                      return;
                    }
                    setShowCrearAsambleaModal(true);
                  }}
                  title={tieneAsambleaActiva ? "Debes finalizar la asamblea activa antes de crear otra" : "Crear una nueva asamblea"}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-md ${tieneAsambleaActiva
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-indigo-500/20'
                    }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  + Crear Nueva Asamblea
                </button>



                {asambleaSeleccionada && (
                  <button
                    onClick={() => setShowOrdenDiaModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-950 hover:bg-slate-900 text-indigo-300 border border-indigo-500/40 transition-all shadow-sm"
                    title="Configurar y marcar avance del Orden del Día"
                  >
                    <ListOrdered className="w-4 h-4 text-indigo-400" />
                    📋 Orden del Día
                    {asambleaSeleccionada.ordenDiaDefinitivo && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Orden del Día Definitivo Activo"></span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 2. Línea de Tiempo de Estados de Asamblea (Parte Inferior) */}
            <div className="bg-slate-950/90 p-2 sm:p-2.5 rounded-2xl border border-slate-800/90 w-full pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                {pasosEstadoAsamblea.map((item, idx) => {
                  const estadoActualIndex = pasosEstadoAsamblea.findIndex(p => p.estadoKey === asambleaSeleccionada?.estado);
                  const isActual = estadoActualIndex === idx;
                  const isCompletado = estadoActualIndex > idx;

                  return (
                    <div key={item.paso} className="relative group w-full">
                      <div className={`px-2.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-1.5 ${isActual
                        ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500/70 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                        : isCompletado
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60 group-hover:opacity-100 group-hover:border-slate-700'
                        }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 transition-all ${isCompletado
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

                        <div className="flex items-center gap-1 shrink-0">
                          {isActual && idx < 3 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAvanzarEstado(item.estadoKey);
                              }}
                              disabled={actionLoading}
                              className="p-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-md flex items-center justify-center transition-all shrink-0 border border-indigo-400/40 hover:scale-105"
                              title={`Pasar al siguiente estado: ${pasosEstadoAsamblea[idx + 1]?.titulo}`}
                            >
                              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          )}

                          {isActual && idx === 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Proceso completado" />
                          )}
                        </div>
                      </div>

                      {/* Tooltip emergente al pasar el mouse sobre cada paso */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl text-[11px] text-slate-200 animate-fadeIn pointer-events-none">
                        <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                          <span className="text-indigo-400 font-mono">Paso {item.paso}:</span> {item.titulo}
                        </div>
                        <p className="text-slate-300 leading-relaxed">{item.descripcion}</p>
                        {isActual && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                            <Play className="w-3 h-3 text-indigo-400 fill-current" /> Estado actual en ejecución
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1. Quórum Section */}
          <QuorumWidget quorum={quorum} onRefresh={fetchQuorum} loading={loading} totalUnidadesRegistradas={unidades.length} />

          {/* 2. Main Content Grid: Gestor de Preguntas & Monitor de Resultados */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: List & Controls of Questions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Vote className="w-5 h-5 text-indigo-400" />
                    Gestor de Preguntas en Vivo
                  </h3>
                  <button
                    onClick={() => {
                      if (!currentAsambleaId) {
                        notifyWarning("Asamblea Requerida", "Por favor crea o inicia una asamblea antes de agregar preguntas.");
                        return;
                      }
                      handleAbrirCrearPregunta();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    + Nueva Pregunta
                  </button>
                </div>

                <div className="space-y-4">
                  {preguntas.filter(p => p.estado !== 'FINALIZADA' && p.estado !== 'ANULADA').map((p) => {
                    const isSelected = p.id === selectedPreguntaId;
                    const isAbierta = p.estado === 'ABIERTA';
                    const isCerrada = p.estado === 'CERRADA';
                    const isFinalizada = p.estado === 'FINALIZADA';
                    const isAnulada = p.estado === 'ANULADA';
                    const isPendiente = p.estado === 'PENDIENTE';

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPreguntaId(p.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                          ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${p.tipoMayoria === 'MAYORIA_CALIFICADA'
                              ? 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              }`}>
                              {p.tipoMayoria === 'MAYORIA_CALIFICADA' ? 'Mayoría Calificada (70%)' : 'Mayoría Simple (50%+1)'}
                            </span>

                            {/* State Badge */}
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg flex-shrink-0 ${isAbierta
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                              : isCerrada
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : isFinalizada
                                  ? 'bg-slate-700 text-slate-300 border border-slate-600'
                                  : isAnulada
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}>
                              {p.estado}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white leading-snug">
                            {p.enunciado}
                          </h4>

                          <div className="w-full pt-1">
                            <TimerWidget
                              fechaHoraCierre={p.fechaHoraCierre}
                              duracionMinutos={p.duracionMinutos}
                              onExpire={() => fetchPreguntas(currentAsambleaId)}
                            />
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                          {isPendiente && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirEditarPregunta(p);
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSolicitarAbrirPregunta(p);
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                              >
                                <Play className="w-3.5 h-3.5" /> Abrir Votación
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnularPregunta(p.id);
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" /> Anular
                              </button>
                            </>
                          )}

                          {isAbierta && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCambiarEstadoPregunta(p.id, 'CERRADA');
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                              >
                                <Square className="w-3.5 h-3.5" /> Cerrar Votación
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnularPregunta(p.id);
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" /> Anular
                              </button>
                            </>
                          )}

                          {isCerrada && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSolicitarAbrirPregunta(p);
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                title="Reabrir la votación configurando el tiempo en minutos"
                              >
                                <Play className="w-3.5 h-3.5" /> Reabrir Votación
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCambiarEstadoPregunta(p.id, 'FINALIZADA');
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                                title="Finalizar la pregunta definitivamente (bloquea reaperturas y cambios)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar Pregunta
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnularPregunta(p.id);
                                }}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" /> Anular
                              </button>
                            </>
                          )}

                          {(isFinalizada || isAnulada) && (
                            <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
                              🔒 Pregunta {isFinalizada ? 'Finalizada' : 'Anulada'} (sin acciones disponibles)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Live Results Monitor */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-emerald-400" />
                    Monitor de Votación Ponderada en Vivo
                  </h3>
                </div>

                {resultados ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pregunta Evaluada:</h4>
                      <p className="text-base text-white font-medium">{resultados.enunciado}</p>
                    </div>

                    {/* Weighted Option Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Desglose por Opción (Voto Ponderado)
                      </h4>

                      {/* Overall Participation Card */}
                      {(() => {
                        const votaron = resultados.totalUnidadesVotaron || 0;
                        const asistentes = resultados.totalUnidadesAsistentes || 0;
                        const pctParticipacion = asistentes > 0 ? (votaron / asistentes) * 100 : 0;
                        return (
                          <div className="p-4 bg-slate-950/90 rounded-xl border border-indigo-500/30 space-y-2 shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-400" />
                                <span className="font-bold text-sm text-white">Participación Total de Votantes</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-indigo-300">
                                  {pctParticipacion.toFixed(2)}%
                                </span>
                                <span className="text-xs text-slate-400 block font-mono font-semibold">
                                  ({votaron} de {asistentes} inmuebles)
                                </span>
                              </div>
                            </div>

                            {/* Participation Progress Bar */}
                            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${Math.min(pctParticipacion, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {resultados.opciones?.map((op) => {
                        const isAbstencion = op.opcionId === -1 || op.textoOpcion?.includes('Abstención');
                        return (
                          <div key={op.opcionId} className={`p-4 rounded-xl border space-y-2 ${isAbstencion ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/80 border-slate-800'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-sm ${isAbstencion ? 'text-amber-300' : 'text-white'}`}>{op.textoOpcion}</span>
                              <div className="text-right">
                                <span className={`text-sm font-extrabold ${isAbstencion ? 'text-amber-300' : 'text-indigo-300'}`}>
                                  {(op.porcentajePonderado || 0).toFixed(2)}%
                                </span>
                                <span className="text-xs text-slate-400 block">
                                  ({(op.sumaSistemaCoeficientes || 0).toFixed(4)}% Coef. / {op.totalVotosUnidades || 0} de {resultados.totalUnidadesAsistentes || 0} inmuebles)
                                </span>
                              </div>
                            </div>

                            {/* Option Progress Bar */}
                            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
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
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Selecciona una pregunta para ver sus resultados consolidados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. Control General de Inmuebles, Asistencia Presencial y Poderes (Tabla Única Unificada) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div
          onClick={() => setIsAsistenciaOpen(!isAsistenciaOpen)}
          className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 cursor-pointer select-none group"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Gestión de Inmuebles, Poderes y Asistencia Presencial ({asistentes.length} Unidades Presentes / {unidades.length} Totales)
            </h3>
            <span className="text-xs text-slate-400 group-hover:text-indigo-400 transition-colors">
              {isAsistenciaOpen ? '(Clic para colapsar)' : '(Clic para expandir)'}
            </span>
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {!isGestor && currentAsambleaId && (
              <button
                type="button"
                onClick={() => {
                  const curr = asambleas.find(a => a.id === currentAsambleaId);
                  if (curr) handleToggleCerrarRegistro(curr.id, curr.registroCerrado);
                }}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${asambleas.find(a => a.id === currentAsambleaId)?.registroCerrado
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border-transparent shadow-md shadow-rose-500/20'
                  }`}
              >
                <Lock className="w-4 h-4" />
                {asambleas.find(a => a.id === currentAsambleaId)?.registroCerrado ? '🔓 Reabrir Registro' : '🔒 Cerrar Registro Asistencia'}
              </button>
            )}

            {!isGestor && (
              <button
                type="button"
                onClick={() => setShowCrearUnidadModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-500/20"
              >
                <Building className="w-4 h-4" />
                + Registrar Inmueble
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAsistenciaOpen(!isAsistenciaOpen)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
              title={isAsistenciaOpen ? "Colapsar tabla" : "Expandir tabla"}
            >
              {isAsistenciaOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isAsistenciaOpen && (
          <div className="space-y-4 animate-fadeIn">
            {/* Buscador unificado por Torre + Apto / Nombre / Documento */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={filterAsistencia}
                  onChange={(e) => setFilterAsistencia(e.target.value)}
                  placeholder="Buscar Torre+Apto, Cédula o Nombre (ej. 1102, 2201)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {filterAsistencia && (
                <button
                  type="button"
                  onClick={() => setFilterAsistencia('')}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800 transition-colors"
                >
                  Limpiar Búsqueda
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Inmueble / Coeficiente</th>
                    <th className="py-3 px-4">Propietario / Asistente</th>
                    <th className="py-3 px-4">Cédula</th>
                    <th className="py-3 px-4">Contacto (Informativo)</th>
                    <th className="py-3 px-4">Estado del Poder</th>
                    <th className="py-3 px-4 text-center">Asistencia Presencial</th>
                    {!isGestor && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {unidades
                    .filter((u) => {
                      if (!filterAsistencia.trim()) return true;
                      const terms = filterAsistencia.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
                      if (terms.length === 0) return true;

                      const torre = String(u.torre || '').toLowerCase();
                      const apto = String(u.numeroUnidad || '').toLowerCase();
                      const concatenado = `${torre}${apto}`;
                      const propNombre = String(u.propietario?.nombreCompleto || '').toLowerCase();
                      const propCedula = String(u.propietario?.cedula || '').toLowerCase();
                      const apodNombre = String(u.apoderado?.nombreCompleto || '').toLowerCase();
                      const apodDoc = String(u.apoderado?.documento || '').toLowerCase();

                      return terms.some((term) => (
                        concatenado.includes(term) ||
                        torre.includes(term) ||
                        apto.includes(term) ||
                        propNombre.includes(term) ||
                        propCedula.includes(term) ||
                        apodNombre.includes(term) ||
                        apodDoc.includes(term)
                      ));
                    })
                    .map((u) => {
                      const asistencia = asistentes.find(a => a.unidadPrivada?.id === u.id);
                      const esApoderado = Boolean(u.apoderado);
                      const currentAsamblea = asambleas.find(a => a.id === currentAsambleaId);
                      const registroCerrado = currentAsamblea ? Boolean(currentAsamblea.registroCerrado) : false;

                      const emailContacto = esApoderado ? (u.apoderado.email || '-') : (u.propietario?.email || '-');
                      const telContacto = esApoderado ? (u.apoderado.telefono || '-') : (u.propietario?.telefono || '-');

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40">
                          {/* Inmueble */}
                          <td className="py-3 px-4 font-bold text-white">
                            Torre {u.torre} - Apt {u.numeroUnidad}
                            <span className="block text-[11px] font-mono font-normal text-indigo-300">
                              {(u.coeficiente || 0).toFixed(4)}% Coef.
                            </span>
                          </td>

                          {/* Propietario / Representante */}
                          <td className="py-3 px-4">
                            {esApoderado ? (
                              <div>
                                <span className="font-bold text-amber-300 flex items-center gap-1">
                                  👤 {u.apoderado.nombreCompleto}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  Prop: {u.propietario?.nombreCompleto || 'N/A'}
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-200">
                                {u.propietario?.nombreCompleto || 'N/A'}
                              </span>
                            )}
                          </td>

                          {/* Cédula */}
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {esApoderado ? u.apoderado.documento : (u.propietario?.cedula || '-')}
                          </td>

                          {/* Contacto (Correo y Teléfono Informativo) */}
                          <td className="py-3 px-4 text-xs space-y-0.5">
                            <span className="block text-indigo-300 font-mono text-[11px] truncate max-w-[150px]" title={emailContacto}>
                              ✉️ {emailContacto}
                            </span>
                            <span className="block text-slate-400 font-mono text-[11px]">
                              📞 {telContacto}
                            </span>
                          </td>

                          {/* Estado del Poder */}
                          <td className="py-3 px-4">
                            {!esApoderado ? (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-medium">
                                Directo (Propietario)
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${u.poderAprobado
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                                  }`}>
                                  {u.poderAprobado ? '✓ PODER APROBADO' : '⏳ PODER EN REVISIÓN'}
                                </span>
                                {!isGestor && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAprobarPoder(u.id, u.poderAprobado)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${u.poderAprobado
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-600 hover:text-white'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-500 border-transparent shadow-sm'
                                      }`}
                                  >
                                    {u.poderAprobado ? 'Revocar' : '✓ Aprobar'}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Asistencia Presencial */}
                          <td className="py-3 px-4 text-center">
                            {asistencia ? (
                              <button
                                type="button"
                                disabled={true}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 opacity-90 cursor-not-allowed inline-flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                {asistencia.asistenciaConfirmada ? 'PIN Validado' : 'PIN Enviado'}
                              </button>
                            ) : registroCerrado ? (
                              <button
                                type="button"
                                disabled={true}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed inline-flex items-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                Registro Cerrado
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRegistrarAsistenciaDirecta(u)}
                                disabled={actionLoading || (esApoderado && !u.poderAprobado)}
                                title={esApoderado && !u.poderAprobado ? "El poder del apoderado debe ser aprobado antes de tomar asistencia" : "Tomar asistencia presencial y enviar PIN"}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Registrar Asistencia
                              </button>
                            )}
                          </td>

                          {/* Acciones (Solo para Admin) */}
                          {!isGestor && (
                            <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setUnidadResidentesModal(u)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 hover:border-indigo-400 transition-all flex items-center gap-1 cursor-pointer"
                                title="Gestionar habitantes, integrantes y apoderado de la unidad"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Residentes</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAbrirEditarUnidad(u)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer"
                                title="Editar datos del inmueble, propietario o apoderado"
                              >
                                ✏️ Editar
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}

                  {unidades.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-xs text-slate-500">
                        No hay inmuebles registrados en la copropiedad. Puedes crearlos o realizar un cargue masivo desde Excel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Crear Nueva Asamblea */}
      {showCrearAsambleaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCrearAsambleaModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Crear Nueva Asamblea</h3>
                <p className="text-xs text-slate-400">Registra, programa y diligencia el Orden del Día obligatorio</p>
              </div>
            </div>

            <form onSubmit={handleCrearAsamblea} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título de la Asamblea *</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={tituloNuevaAsamblea}
                    onChange={(e) => setTituloNuevaAsamblea(e.target.value)}
                    placeholder="Ej. Asamblea Extraordinaria 2026"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Asamblea *</label>
                <select
                  value={tipoNuevaAsamblea}
                  onChange={(e) => setTipoNuevaAsamblea(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="ORDINARIA">Ordinaria (Ley 675)</option>
                  <option value="EXTRAORDINARIA">Extraordinaria (Ley 675)</option>
                </select>
              </div>

              {/* Diligenciamiento del Orden del Día */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-amber-400" />
                    Diligenciar Orden del Día *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPuntosOrdenDiaCreacion([...puntosOrdenDiaCreacion, ''])}
                    className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + Agregar Punto
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {puntosOrdenDiaCreacion.map((punto, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono font-bold text-xs text-indigo-400">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={punto}
                        onChange={(e) => {
                          const copia = [...puntosOrdenDiaCreacion];
                          copia[idx] = e.target.value;
                          setPuntosOrdenDiaCreacion(copia);
                        }}
                        placeholder={`Punto ${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {puntosOrdenDiaCreacion.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const copia = puntosOrdenDiaCreacion.filter((_, i) => i !== idx);
                            setPuntosOrdenDiaCreacion(copia);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar punto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCrearAsambleaModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearAsambleaLoading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all"
                >
                  {crearAsambleaLoading ? 'Guardando...' : 'Programar y Guardar Asamblea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Nuevo Inmueble / Unidad (Individual o Cargue Masivo) */}
      {showCrearUnidadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowCrearUnidadModal(false);
                setCargueMasivoResultado(null);
                setArchivoCargueMasivo(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registrar Inmuebles / Unidades</h3>
                <p className="text-xs text-slate-400">Registro individual o cargue masivo mediante Excel/CSV</p>
              </div>
            </div>

            {/* Pestañas / Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setTabRegistroUnidad('individual')}
                className={`py-2 px-4 text-xs font-bold transition-all border-b-2 ${tabRegistroUnidad === 'individual'
                  ? 'border-emerald-500 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-white'
                  }`}
              >
                👤 Registro Individual
              </button>
              <button
                type="button"
                onClick={() => setTabRegistroUnidad('masivo')}
                className={`py-2 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${tabRegistroUnidad === 'masivo'
                  ? 'border-emerald-500 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-white'
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                📥 Cargue Masivo Excel
              </button>
            </div>

            {tabRegistroUnidad === 'individual' ? (
              <form onSubmit={handleCrearUnidad} className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Torre</label>
                    <input
                      type="text"
                      required
                      value={torreNuevaUnidad}
                      onChange={(e) => setTorreNuevaUnidad(e.target.value)}
                      placeholder="Ej. 3"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Número Apto</label>
                    <input
                      type="text"
                      required
                      value={numeroNuevaUnidad}
                      onChange={(e) => setNumeroNuevaUnidad(e.target.value)}
                      placeholder="Ej. 302"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Coeficiente (%)</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={coeficienteNuevaUnidad}
                      onChange={(e) => setCoeficienteNuevaUnidad(e.target.value)}
                      placeholder="Ej. 5.0"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Datos del Propietario</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Cédula Propietario *</label>
                      <input
                        type="text"
                        required
                        value={cedulaPropietarioNuevaUnidad}
                        onChange={(e) => setCedulaPropietarioNuevaUnidad(e.target.value)}
                        placeholder="Ej. 10101010"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Nombre Completo Propietario</label>
                      <input
                        type="text"
                        value={nombrePropietarioNuevaUnidad}
                        onChange={(e) => setNombrePropietarioNuevaUnidad(e.target.value)}
                        placeholder="Ej. Carlos Pérez"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico Propietario</label>
                      <input
                        type="email"
                        value={emailPropietarioNuevaUnidad}
                        onChange={(e) => setEmailPropietarioNuevaUnidad(e.target.value)}
                        placeholder="ejemplo@gmail.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Teléfono Propietario</label>
                      <input
                        type="text"
                        value={telefonoPropietarioNuevaUnidad}
                        onChange={(e) => setTelefonoPropietarioNuevaUnidad(e.target.value)}
                        placeholder="3001112233"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-amber-500/30 rounded-xl space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowApoderadoCrear(!showApoderadoCrear)}
                    className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">Datos del Apoderado (Opcional)</h4>
                      {(documentoApoderadoNuevaUnidad || nombreApoderadoNuevaUnidad) ? (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-medium">
                          Asignado
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {showApoderadoCrear ? '(Clic para ocultar)' : '(Clic para desplegar)'}
                        </span>
                      )}
                    </div>
                    {showApoderadoCrear ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>

                  {showApoderadoCrear && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Cédula del Apoderado</label>
                        <input
                          type="text"
                          value={documentoApoderadoNuevaUnidad}
                          onChange={(e) => setDocumentoApoderadoNuevaUnidad(e.target.value)}
                          placeholder="Ej. 77777777"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Nombre Completo Apoderado</label>
                        <input
                          type="text"
                          value={nombreApoderadoNuevaUnidad}
                          onChange={(e) => setNombreApoderadoNuevaUnidad(e.target.value)}
                          placeholder="Ej. Pedro Apoderado"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico Apoderado</label>
                        <input
                          type="email"
                          value={emailApoderadoNuevaUnidad}
                          onChange={(e) => setEmailApoderadoNuevaUnidad(e.target.value)}
                          placeholder="apoderado@gmail.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Teléfono Apoderado</label>
                        <input
                          type="text"
                          value={telefonoApoderadoNuevaUnidad}
                          onChange={(e) => setTelefonoApoderadoNuevaUnidad(e.target.value)}
                          placeholder="3007778899"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCrearUnidadModal(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={crearUnidadLoading}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:brightness-110 transition-all"
                  >
                    {crearUnidadLoading ? 'Guardando...' : 'Registrar Inmueble'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCargueMasivo} className="space-y-4 pt-2">
                {/* Botón Descargar Plantilla */}
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Plantilla Oficial de Ejemplo
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Descarga la plantilla Excel/CSV estructurada con las columnas requeridas.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await api.get('/unidades/plantilla-excel', { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'plantilla_cargue_unidades.xlsx');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (err) {
                          console.warn("Falling back to static template download:", err);
                          const link = document.createElement('a');
                          link.href = '/plantillas/plantilla_cargue_unidades.xlsx';
                          link.setAttribute('download', 'plantilla_cargue_unidades.xlsx');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }
                      }}
                      className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      Descargar Plantilla Excel (.xlsx)
                    </button>
                  </div>
                </div>

                {/* Área de Cargar Archivo */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Seleccionar Archivo Excel (.xlsx) o CSV (.csv)
                  </label>
                  <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-900/40">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setArchivoCargueMasivo(e.target.files[0] || null)}
                      className="hidden"
                      id="excel-file-upload"
                    />
                    <label htmlFor="excel-file-upload" className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="text-xs text-slate-300 font-medium">
                        {archivoCargueMasivo ? (
                          <span className="text-emerald-400 font-bold">📄 {archivoCargueMasivo.name}</span>
                        ) : (
                          <span>Haz clic para seleccionar o arrastra tu archivo Excel / CSV aquí</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">Formatos soportados: .xlsx, .xls, .csv</p>
                    </label>
                  </div>
                </div>

                {/* Resumen de Resultado de Cargue Masivo */}
                {cargueMasivoResultado && (
                  <div className={`p-4 rounded-xl text-xs space-y-2 border ${cargueMasivoResultado.fallidos > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    }`}>
                    <p className="font-bold">{cargueMasivoResultado.mensaje}</p>
                    {cargueMasivoResultado.errores && cargueMasivoResultado.errores.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-300 max-h-28 overflow-y-auto">
                        {cargueMasivoResultado.errores.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCrearUnidadModal(false);
                      setCargueMasivoResultado(null);
                      setArchivoCargueMasivo(null);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargueMasivoLoading || !archivoCargueMasivo}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {cargueMasivoLoading ? 'Procesando...' : 'Procesar y Cargar Inmuebles'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Editar Inmueble, Propietario y Apoderado */}
      {showEditarUnidadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowEditarUnidadModal(false);
                setUnidadEditar(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Editar Inmueble, Propietario y Apoderado</h3>
                <p className="text-xs text-slate-400">Torre {unidadEditar?.torre} - Apt {unidadEditar?.numeroUnidad}</p>
              </div>
            </div>

            <form onSubmit={handleGuardarEditarUnidad} className="space-y-4 pt-2 text-xs">
              {/* Sección 1: Datos del Inmueble */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-indigo-300 text-xs uppercase tracking-wider">1. Datos del Inmueble</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Torre *</label>
                    <input
                      type="text"
                      required
                      value={editTorre}
                      onChange={(e) => setEditTorre(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Apto / Unidad *</label>
                    <input
                      type="text"
                      required
                      value={editNumeroUnidad}
                      onChange={(e) => setEditNumeroUnidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Coeficiente (%) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={editCoeficiente}
                      onChange={(e) => setEditCoeficiente(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Datos del Propietario */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">2. Propietario Registrado</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Cédula Propietario *</label>
                    <input
                      type="text"
                      required
                      value={editCedulaProp}
                      onChange={(e) => setEditCedulaProp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={editNombreProp}
                      onChange={(e) => setEditNombreProp(e.target.value)}
                      placeholder="Nombre del propietario"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmailProp}
                      onChange={(e) => setEditEmailProp(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={editTelProp}
                      onChange={(e) => setEditTelProp(e.target.value)}
                      placeholder="3001234567"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Representación / Apoderado */}
              <div className="p-3 bg-slate-950/60 border border-amber-500/30 rounded-xl space-y-2">
                <button
                  type="button"
                  onClick={() => setShowApoderadoEdit(!showApoderadoEdit)}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">3. Poder de Representación (Apoderado)</h4>
                    {(editDocApoderado || editNombreApoderado) ? (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-medium">
                        Asignado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {showApoderadoEdit ? '(Clic para ocultar)' : '(Clic para desplegar)'}
                      </span>
                    )}
                  </div>
                  {showApoderadoEdit ? (
                    <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </button>

                {showApoderadoEdit && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Cédula del Apoderado</label>
                        <input
                          type="text"
                          value={editDocApoderado}
                          onChange={(e) => setEditDocApoderado(e.target.value)}
                          placeholder="Dejar vacío si no aplica"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Nombre Completo Apoderado</label>
                        <input
                          type="text"
                          value={editNombreApoderado}
                          onChange={(e) => setEditNombreApoderado(e.target.value)}
                          placeholder="Nombre del apoderado"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico Apoderado</label>
                        <input
                          type="email"
                          value={editEmailApoderado}
                          onChange={(e) => setEditEmailApoderado(e.target.value)}
                          placeholder="apoderado@ejemplo.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Teléfono Apoderado</label>
                        <input
                          type="text"
                          value={editTelApoderado}
                          onChange={(e) => setEditTelApoderado(e.target.value)}
                          placeholder="3007778899"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      * Si asignas o cambias un apoderado, el poder quedará en estado <span className="text-amber-300 font-semibold">En Revisión / Pendiente</span> para ser verificado y aprobado por la administración.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditarUnidadModal(false);
                    setUnidadEditar(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editarUnidadLoading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editarUnidadLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Pregunta */}
      {showCrearPreguntaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Vote className="w-5 h-5 text-indigo-400" />
                {preguntaEditar ? `Editar Pregunta #${preguntaEditar.id}` : 'Crear Nueva Pregunta para la Asamblea'}
              </h3>
              <button
                onClick={() => {
                  setShowCrearPreguntaModal(false);
                  setPreguntaEditar(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPregunta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enunciado de la Pregunta / Moción *
                </label>
                <textarea
                  required
                  rows={3}
                  value={enunciadoNuevaPregunta}
                  onChange={(e) => setEnunciadoNuevaPregunta(e.target.value)}
                  placeholder="Ej. ¿Aprueba los Estados Financieros del período 2025 y el Presupuesto 2026?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Mayoría Requerida (Ley 675)
                </label>
                <select
                  value={tipoMayoriaNuevaPregunta}
                  onChange={(e) => setTipoMayoriaNuevaPregunta(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="MAYORIA_SIMPLE">Mayoría Simple (50% + 1 del coeficiente asistente)</option>
                  <option value="MAYORIA_CALIFICADA">Mayoría Calificada (70% del coeficiente total - Art 46)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Opciones de Respuesta
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpcionesNuevaPregunta([...opcionesNuevaPregunta, ''])}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Añadir Opción
                  </button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {opcionesNuevaPregunta.map((op, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={op}
                        onChange={(e) => {
                          const newOps = [...opcionesNuevaPregunta];
                          newOps[idx] = e.target.value;
                          setOpcionesNuevaPregunta(newOps);
                        }}
                        placeholder={`Opción ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {opcionesNuevaPregunta.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpcionesNuevaPregunta(opcionesNuevaPregunta.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCrearPreguntaModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearPreguntaLoading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {crearPreguntaLoading ? 'Guardando...' : preguntaEditar ? 'Guardar Cambios' : 'Crear Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Solicitar Duración al Abrir / Reabrir Votación */}
      {showAbrirPreguntaModal && preguntaParaAbrir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-emerald-500/40 shadow-2xl space-y-5 relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowAbrirPreguntaModal(false);
                setPreguntaParaAbrir(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Abrir Votación en Vivo</h3>
                <p className="text-xs text-slate-400">Configura el tiempo límite para los votantes</p>
              </div>
            </div>



            <form onSubmit={handleConfirmarAbrirVotacion} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Duración de la Votación (en minutos) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  required
                  value={duracionAperturaInput}
                  onChange={(e) => setDuracionAperturaInput(e.target.value)}
                  placeholder="Ej. 5"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ⏱️ El conteo regresivo iniciará inmediatamente al presionar abrir votación.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAbrirPreguntaModal(false);
                    setPreguntaParaAbrir(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {actionLoading ? 'Iniciando...' : '▶ Abrir Votación Ahora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestión de Usuarios Gestores de Registro */}
      {showGestoresModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-5 relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowGestoresModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Gestión de Usuarios Gestores de Registro</h3>
                <p className="text-xs text-slate-400">Crea gestores para la toma de asistencia y restablece su contraseña</p>
              </div>
            </div>

            {/* Formulario de Crear Nuevo Gestor */}
            <form onSubmit={handleCrearGestor} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-indigo-400" /> Registrar Nuevo Gestor
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    required
                    value={gestorCedula}
                    onChange={(e) => setGestorCedula(e.target.value)}
                    placeholder="Ej. 10203040"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={gestorNombre}
                    onChange={(e) => setGestorNombre(e.target.value)}
                    placeholder="Ej. Ana María Gestora"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={gestorEmail}
                    onChange={(e) => setGestorEmail(e.target.value)}
                    placeholder="gestor@ejemplo.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={gestorTelefono}
                    onChange={(e) => setGestorTelefono(e.target.value)}
                    placeholder="3001234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-amber-300 font-medium">
                  🔑 Contraseña por defecto: (el gestor la actualizará al ingresar).
                </span>
                <button
                  type="submit"
                  disabled={gestoresLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1"
                >
                  {gestoresLoading ? 'Guardando...' : '+ Crear Gestor'}
                </button>
              </div>
            </form>

            {/* Tabla de Gestores Registrados */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Gestores Registrados ({gestoresList.length})
              </h4>
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Gestor</th>
                      <th className="py-2.5 px-3">Usuario / Cédula</th>
                      <th className="py-2.5 px-3">Contacto</th>
                      <th className="py-2.5 px-3 text-right">Acción Clave</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {gestoresList.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">
                          {g.nombreCompleto}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div>{g.username}</div>
                          <div className="text-[10px] text-slate-400">Doc: {g.documento}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <div>{g.email || '-'}</div>
                          <div className="text-slate-400">{g.telefono || '-'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleResetearPasswordGestor(g.id, g.nombreCompleto)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm"
                            title="Restablecer contraseña"
                          >
                            🔑 Restablecer
                          </button>
                        </td>
                      </tr>
                    ))}
                    {gestoresList.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-500">
                          No hay gestores de registro adicionales creados para este conjunto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Orden del Día */}
      {showOrdenDiaModal && asambleaSeleccionada && (
        <OrdenDiaModal
          asamblea={asambleaSeleccionada}
          onClose={() => setShowOrdenDiaModal(false)}
          notifySuccess={notifySuccess}
          notifyError={notifyError}
          showConfirmDialog={showConfirmDialog}
          onUpdateAsamblea={fetchAsambleas}
        />
      )}

      {/* Modal de Residentes e Integrantes por Unidad Privada */}
      {unidadResidentesModal && (
        <HabitantesUnidadModal
          unidad={unidadResidentesModal}
          onClose={() => {
            setUnidadResidentesModal(null);
            fetchUnidades();
          }}
        />
      )}

      {/* Modal de Gestor de Plantillas HTML de Correo */}
      {showPlantillasModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-5xl p-6 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowPlantillasModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <GestorPlantillasEmail
              notifySuccess={notifySuccess}
              notifyError={notifyError}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      <ConfirmModal confirmConfig={confirmConfig} onClose={() => setConfirmConfig(null)} />
    </div>
  );
}
