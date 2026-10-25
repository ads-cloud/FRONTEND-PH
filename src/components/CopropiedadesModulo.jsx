import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Car,
  Dog,
  PlusCircle,
  Upload,
  Download,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Crown,
  UserPlus,
  Mail,
  Phone,
  Trash2,
  Star,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  Pencil,
  HelpCircle,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import api from '../api/axiosClient';
import { ConfirmModal, useToast } from './NotificationToast';
import PaginationControls from './PaginationControls';

export default function CopropiedadesModulo({ user }) {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notif, setNotif] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Estados de Paginación
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Vista activa: null = Lista de Inmuebles, u = Detalle del Inmueble Seleccionado
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [activeTabDetail, setActiveTabDetail] = useState('inmueble'); // 'inmueble' | 'residentes' | 'vehiculos' | 'mascotas'

  // Estados del Formulario de Edición de Datos del Inmueble
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
  const [showApoderadoEdit, setShowApoderadoEdit] = useState(false);
  const [savingInmueble, setSavingInmueble] = useState(false);

  // Modal / Form Crear Inmueble Individual
  const [showCrearUnidadForm, setShowCrearUnidadForm] = useState(false);
  const [nuevaTorre, setNuevaTorre] = useState('');
  const [nuevoNumeroUnidad, setNuevoNumeroUnidad] = useState('');
  const [nuevoCoeficiente, setNuevoCoeficiente] = useState('');
  const [propCedula, setPropCedula] = useState('');
  const [propNombre, setPropNombre] = useState('');
  const [propEmail, setPropEmail] = useState('');
  const [propTel, setPropTel] = useState('');
  const [submittingUnidad, setSubmittingUnidad] = useState(false);

  // Cargue Masivo Excel
  const [showCargueMasivo, setShowCargueMasivo] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cargueResult, setCargueResult] = useState(null);

  // Estado de habitantes para el detalle del inmueble
  const [habitantes, setHabitantes] = useState([]);
  const [loadingHabitantes, setLoadingHabitantes] = useState(false);
  const [editingHabitanteId, setEditingHabitanteId] = useState(null);
  const [resCedula, setResCedula] = useState('');
  const [resNombre, setResNombre] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resTel, setResTel] = useState('');
  const [resParentesco, setResParentesco] = useState('PROPIETARIO');
  const [resPropietarioPrincipal, setResPropietarioPrincipal] = useState(false);
  const [resArrendatario, setResArrendatario] = useState(false);
  const [resApoderado, setResApoderado] = useState(false);
  const [submittingHabitante, setSubmittingHabitante] = useState(false);

  // Estado de vehículos para el detalle del inmueble
  const [vehiculos, setVehiculos] = useState([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [vPlaca, setVPlaca] = useState('');
  const [vTipo, setVTipo] = useState('CARRO');
  const [vMarca, setVMarca] = useState('');
  const [vColor, setVColor] = useState('');
  const [vCelda, setVCelda] = useState('');
  const [vObs, setVObs] = useState('');
  const [submittingVehiculo, setSubmittingVehiculo] = useState(false);

  // Estado de mascotas para el detalle del inmueble
  const [mascotas, setMascotas] = useState([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);
  const [mNombre, setMNombre] = useState('');
  const [mTipo, setMTipo] = useState('PERRO');
  const [mRaza, setMRaza] = useState('');
  const [mColor, setMColor] = useState('');
  const [mVacunas, setMVacunas] = useState(true);
  const [mObs, setMObs] = useState('');
  const [submittingMascota, setSubmittingMascota] = useState(false);

  const toast = useToast();
  const showNotif = (type, text) => {
    if (type === 'success') toast.success(text);
    else if (type === 'error') toast.error(text);
    else if (type === 'warning') toast.warning(text);
    else toast.info(text);
  };

  const fetchUnidades = async (pageTarget = page, sizeTarget = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/unidades?page=${pageTarget}&size=${sizeTarget}`);
      if (res.data && res.data.content) {
        setUnidades(res.data.content);
        setPage(res.data.page);
        setPageSize(res.data.size);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      } else if (Array.isArray(res.data)) {
        setUnidades(res.data);
        setTotalElements(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error al cargar inmuebles:", err);
      showNotif('error', 'Error al cargar el directorio de inmuebles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades(page, pageSize);
  }, [page, pageSize]);

  const fetchHabitantesUnidad = async (unidadId) => {
    try {
      setLoadingHabitantes(true);
      const res = await api.get(`/unidades/${unidadId}/habitantes`);
      setHabitantes(res.data);
    } catch (err) {
      console.error("Error al cargar habitantes:", err);
      showNotif('error', 'Error al cargar residentes del inmueble.');
    } finally {
      setLoadingHabitantes(false);
    }
  };

  const fetchVehiculosUnidad = async (unidadId) => {
    try {
      setLoadingVehiculos(true);
      const res = await api.get(`/unidades/${unidadId}/vehiculos`);
      setVehiculos(res.data);
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const fetchMascotasUnidad = async (unidadId) => {
    try {
      setLoadingMascotas(true);
      const res = await api.get(`/unidades/${unidadId}/mascotas`);
      setMascotas(res.data);
    } catch (err) {
      console.error("Error al cargar mascotas:", err);
    } finally {
      setLoadingMascotas(false);
    }
  };

  const cargarDatosInmuebleForm = (u) => {
    if (!u) return;
    setEditTorre(u.torre || '');
    setEditNumeroUnidad(u.numeroUnidad || '');
    setEditCoeficiente(u.coeficiente !== undefined && u.coeficiente !== null ? u.coeficiente : '');
    setEditCedulaProp(u.propietario?.cedula || u.propietarioCedula || '');
    setEditNombreProp(u.propietario?.nombreCompleto || u.propietarioNombre || '');
    setEditEmailProp(u.propietario?.email || u.propietarioEmail || '');
    setEditTelProp(u.propietario?.telefono || u.propietarioTelefono || '');
    setEditDocApoderado(u.apoderado?.documento || u.apoderadoDocumento || '');
    setEditNombreApoderado(u.apoderado?.nombreCompleto || u.apoderadoNombre || '');
    setEditEmailApoderado(u.apoderado?.email || u.apoderadoEmail || '');
    setEditTelApoderado(u.apoderado?.telefono || u.apoderadoTelefono || '');
    setShowApoderadoEdit(Boolean(u.apoderado?.documento || u.apoderadoDocumento || u.apoderado?.nombreCompleto || u.apoderadoNombre));
  };

  useEffect(() => {
    if (selectedUnidad?.id) {
      cargarDatosInmuebleForm(selectedUnidad);
      fetchHabitantesUnidad(selectedUnidad.id);
      fetchVehiculosUnidad(selectedUnidad.id);
      fetchMascotasUnidad(selectedUnidad.id);
    }
  }, [selectedUnidad?.id]);

  const handleGuardarInmueble = async (e) => {
    e.preventDefault();
    if (!selectedUnidad) return;

    if (!editTorre.trim() || !editNumeroUnidad.trim()) {
      showNotif('error', 'La torre y el apartamento son obligatorios.');
      return;
    }
    if (!editCedulaProp.trim()) {
      showNotif('error', 'La cédula del propietario es obligatoria.');
      return;
    }

    try {
      setSavingInmueble(true);
      const payload = {
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
      };

      const res = await api.put(`/unidades/${selectedUnidad.id}`, payload);
      const unidadActualizada = res.data;

      const unidadFusionada = {
        ...selectedUnidad,
        ...unidadActualizada,
        torre: editTorre.trim(),
        numeroUnidad: editNumeroUnidad.trim(),
        coeficiente: parseFloat(editCoeficiente) || 0,
        propietarioCedula: editCedulaProp.trim(),
        propietarioNombre: editNombreProp.trim(),
        propietarioEmail: editEmailProp.trim(),
        propietarioTelefono: editTelProp.trim(),
        propietario: {
          ...(selectedUnidad.propietario || {}),
          cedula: editCedulaProp.trim(),
          nombreCompleto: editNombreProp.trim(),
          email: editEmailProp.trim(),
          telefono: editTelProp.trim()
        },
        apoderadoDocumento: editDocApoderado.trim(),
        apoderadoNombre: editNombreApoderado.trim(),
        apoderadoEmail: editEmailApoderado.trim(),
        apoderadoTelefono: editTelApoderado.trim(),
      };

      setSelectedUnidad(unidadFusionada);
      cargarDatosInmuebleForm(unidadFusionada);

      // Actualizar lista en pantalla
      setUnidades((prev) =>
        prev.map((u) => (u.id === selectedUnidad.id ? { ...u, ...unidadFusionada } : u))
      );

      showNotif('success', `Inmueble Torre ${unidadFusionada.torre} - Apt ${unidadFusionada.numeroUnidad} actualizado exitosamente.`);
    } catch (err) {
      console.error("Error al actualizar inmueble:", err);
      showNotif('error', err.response?.data?.message || 'Error al guardar cambios del inmueble.');
    } finally {
      setSavingInmueble(false);
    }
  };

  const handleCrearUnidad = async (e) => {
    e.preventDefault();
    if (!nuevaTorre.trim() || !nuevoNumeroUnidad.trim() || !nuevoCoeficiente) {
      showNotif('error', 'Torre, Apartamento y Coeficiente son obligatorios.');
      return;
    }

    try {
      setSubmittingUnidad(true);
      const payload = {
        torre: nuevaTorre.trim(),
        numeroUnidad: nuevoNumeroUnidad.trim(),
        coeficiente: parseFloat(nuevoCoeficiente),
        cedulaPropietario: propCedula.trim() || null,
        nombrePropietario: propNombre.trim() || null,
        emailPropietario: propEmail.trim() || null,
        telefonoPropietario: propTel.trim() || null,
        // Compatibilidad adicional
        propietarioCedula: propCedula.trim() || null,
        propietarioNombre: propNombre.trim() || null,
        propietarioEmail: propEmail.trim() || null,
        propietarioTelefono: propTel.trim() || null
      };

      await api.post('/unidades', payload);
      showNotif('success', `Inmueble Torre ${nuevaTorre} Apt ${nuevoNumeroUnidad} creado correctamente.`);

      setNuevaTorre('');
      setNuevoNumeroUnidad('');
      setNuevoCoeficiente('');
      setPropCedula('');
      setPropNombre('');
      setPropEmail('');
      setPropTel('');
      setShowCrearUnidadForm(false);
      fetchUnidades();
    } catch (err) {
      console.error("Error al crear inmueble:", err);
      showNotif('error', err.response?.data?.message || 'Error al guardar inmueble.');
    } finally {
      setSubmittingUnidad(false);
    }
  };

  const handleCargueMasivoExcel = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      showNotif('error', 'Por favor selecciona un archivo Excel (.xlsx / .xls).');
      return;
    }

    try {
      setUploadingExcel(true);
      setCargueResult(null);
      const formData = new FormData();
      formData.append('file', excelFile);

      const res = await api.post('/unidades/cargue-masivo', formData);
      setCargueResult(res.data);

      if (res.data.fallidos === 0) {
        showNotif('success', res.data.mensaje || `¡Cargue masivo completado! (${res.data.exitosos} inmuebles procesados exitosamente)`);
      } else {
        showNotif('warning', `Cargue procesado: ${res.data.exitosos} exitosos, ${res.data.fallidos} con errores.`);
      }

      setExcelFile(null);
      fetchUnidades();
    } catch (err) {
      console.error("Error en cargue masivo:", err);
      showNotif('error', err.response?.data?.message || 'Error al procesar archivo de inmuebles.');
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleDescargarPlantilla = async () => {
    try {
      const response = await api.get('/unidades/plantilla-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_cargue_unidades.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      showNotif('error', 'No se pudo descargar la plantilla Excel.');
    }
  };

  const handleAgregarHabitanteInPage = async (e, confirmar = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!resCedula.trim() || !resNombre.trim()) {
      showNotif('error', 'Identificación y Nombre Completo son obligatorios.');
      return;
    }

    try {
      setSubmittingHabitante(true);
      const payload = {
        cedula: resCedula.trim(),
        nombreCompleto: resNombre.trim(),
        email: resEmail.trim() || null,
        telefono: resTel.trim() || null,
        parentesco: resParentesco || 'HABITANTE',
        esPropietarioPrincipal: resPropietarioPrincipal,
        esArrendatario: resArrendatario,
        esApoderadoDesignado: resApoderado,
        confirmarCambioPropietario: confirmar,
        confirmarCambioApoderado: confirmar,
        confirmarCambio: confirmar
      };

      const res = await api.post(`/unidades/${selectedUnidad.id}/habitantes`, payload);

      if (res.data?.status === 'REQUIERE_CONFIRMACION' || res.data?.requiereConfirmacion) {
        const isApoderado = Boolean(res.data?.requiereConfirmacionApoderado);

        setConfirmConfig({
          title: isApoderado ? '⚠️ Confirmar Reemplazo de Apoderado' : '⚠️ Transferencia de Propietario Titular',
          type: 'warning',
          message: res.data.message,
          confirmText: isApoderado ? 'Sí, Transferir Apoderado' : 'Sí, Transferir Propietario',
          cancelText: 'Cancelar',
          onConfirm: () => handleAgregarHabitanteInPage(null, true)
        });
        return;
      }

      showNotif('success', editingHabitanteId ? `Integrante "${resNombre}" actualizado exitosamente.` : `Integrante "${resNombre}" registrado en el inmueble.`);

      handleCancelarEdicionHabitante();
      fetchHabitantesUnidad(selectedUnidad.id);
    } catch (err) {
      const data = err.response?.data;
      const isConfirmationRequired = err.response?.status === 409 || data?.requiereConfirmacion;
      const warningMessage = data?.message || err.message;
      const isApoderado = Boolean(data?.requiereConfirmacionApoderado);

      if (isConfirmationRequired) {
        setConfirmConfig({
          title: isApoderado ? '⚠️ Confirmar Reemplazo de Apoderado' : '⚠️ Transferencia de Propietario Titular',
          type: 'warning',
          message: warningMessage,
          confirmText: isApoderado ? 'Sí, Transferir Apoderado' : 'Sí, Transferir Propietario',
          cancelText: 'Cancelar',
          onConfirm: () => handleAgregarHabitanteInPage(null, true)
        });
      } else {
        showNotif('error', warningMessage || 'Error al guardar integrante.');
      }
    } finally {
      setSubmittingHabitante(false);
    }
  };

  const handleIniciarEdicionHabitante = (h) => {
    setEditingHabitanteId(h.id);
    setResCedula(h.persona?.cedula || '');
    setResNombre(h.persona?.nombreCompleto || '');
    setResEmail(h.persona?.email || '');
    setResTel(h.persona?.telefono || '');
    setResParentesco(h.parentesco || 'PROPIETARIO');
    setResPropietarioPrincipal(Boolean(h.esPropietarioPrincipal));
    setResArrendatario(Boolean(h.esArrendatario));
    setResApoderado(Boolean(h.esApoderadoDesignado));

    const formElem = document.getElementById('form-habitante-inmueble');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelarEdicionHabitante = () => {
    setEditingHabitanteId(null);
    setResCedula('');
    setResNombre('');
    setResEmail('');
    setResTel('');
    setResParentesco('PROPIETARIO');
    setResPropietarioPrincipal(false);
    setResArrendatario(false);
    setResApoderado(false);
  };

  const handleToggleApoderadoInPage = async (habitante, confirmar = false) => {
    const nuevoEstado = !habitante.esApoderadoDesignado || confirmar;
    try {
      const url = `/unidades/${selectedUnidad.id}/habitantes/${habitante.id}/apoderado?esApoderado=${nuevoEstado}${confirmar ? '&confirmarCambio=true' : ''}`;
      const res = await api.patch(url);

      if (res.data?.status === 'REQUIERE_CONFIRMACION' || res.data?.requiereConfirmacion) {
        setConfirmConfig({
          title: '⚠️ Confirmar Reemplazo de Apoderado',
          type: 'warning',
          message: res.data.message,
          confirmText: 'Sí, Transferir Apoderado',
          cancelText: 'Cancelar',
          onConfirm: async () => {
            await handleToggleApoderadoInPage(habitante, true);
          }
        });
        return;
      }

      showNotif('success', `Apoderado ${nuevoEstado ? 'activado' : 'desactivado'} para ${habitante.persona?.nombreCompleto || 'integrante'}.`);
      fetchHabitantesUnidad(selectedUnidad.id);
    } catch (err) {
      const data = err.response?.data;
      const is409 = err.response?.status === 409;
      const isConfirmNeeded = is409 || data?.requiereConfirmacion || data?.requiereConfirmacionApoderado || (data?.message && data.message.includes('Apoderado'));

      if (isConfirmNeeded) {
        const cleanMsg = (data?.message || err.message || '').replace(/^REQUIERE_CONFIRMACION_APODERADO:\s*/, '').replace(/^REQUIERE_CONFIRMACION:\s*/, '');
        setConfirmConfig({
          title: '⚠️ Confirmar Reemplazo de Apoderado',
          type: 'warning',
          message: cleanMsg,
          confirmText: 'Sí, Transferir Apoderado',
          cancelText: 'Cancelar',
          onConfirm: async () => {
            await handleToggleApoderadoInPage(habitante, true);
          }
        });
        return;
      }
      showNotif('error', data?.message || 'Error al cambiar designación de apoderado.');
    }
  };

  const handleEliminarHabitanteInPage = (habitanteId, nombre) => {
    setConfirmConfig({
      title: 'Retirar Integrante',
      type: 'danger',
      message: `¿Estás seguro de retirar a "${nombre}" del censo de este inmueble?`,
      confirmText: 'Sí, Retirar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await api.delete(`/unidades/${selectedUnidad.id}/habitantes/${habitanteId}`);
          showNotif('success', 'Habitante retirado exitosamente.');
          fetchHabitantesUnidad(selectedUnidad.id);
        } catch (err) {
          showNotif('error', 'Error al retirar integrante.');
        }
      }
    });
  };

  const handleAgregarVehiculo = async (e) => {
    e.preventDefault();
    if (!vPlaca.trim()) {
      showNotif('error', 'La placa del vehículo es obligatoria.');
      return;
    }
    try {
      setSubmittingVehiculo(true);
      await api.post(`/unidades/${selectedUnidad.id}/vehiculos`, {
        placa: vPlaca.trim().toUpperCase(),
        tipo: vTipo,
        marcaModelo: vMarca.trim() || null,
        color: vColor.trim() || null,
        parqueadero: vCelda.trim() || null,
        observaciones: vObs.trim() || null
      });
      showNotif('success', `Vehículo ${vPlaca.toUpperCase()} registrado exitosamente.`);
      setVPlaca('');
      setVMarca('');
      setVColor('');
      setVCelda('');
      setVObs('');
      fetchVehiculosUnidad(selectedUnidad.id);
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Error al guardar vehículo.');
    } finally {
      setSubmittingVehiculo(false);
    }
  };

  const handleEliminarVehiculo = (vehiculoId, placa) => {
    setConfirmConfig({
      title: 'Eliminar Vehículo',
      type: 'danger',
      message: `¿Estás seguro de eliminar el vehículo con placa ${placa}?`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await api.delete(`/unidades/${selectedUnidad.id}/vehiculos/${vehiculoId}`);
          showNotif('success', 'Vehículo eliminado correctamente.');
          fetchVehiculosUnidad(selectedUnidad.id);
        } catch (err) {
          showNotif('error', 'Error al eliminar vehículo.');
        }
      }
    });
  };

  const handleAgregarMascota = async (e) => {
    e.preventDefault();
    if (!mNombre.trim()) {
      showNotif('error', 'El nombre de la mascota es obligatorio.');
      return;
    }
    try {
      setSubmittingMascota(true);
      await api.post(`/unidades/${selectedUnidad.id}/mascotas`, {
        nombre: mNombre.trim(),
        tipo: mTipo,
        raza: mRaza.trim() || null,
        color: mColor.trim() || null,
        vacunasAlDia: mVacunas,
        observaciones: mObs.trim() || null
      });
      showNotif('success', `Mascota "${mNombre}" registrada exitosamente.`);
      setMNombre('');
      setMRaza('');
      setMColor('');
      setMObs('');
      setMVacunas(true);
      fetchMascotasUnidad(selectedUnidad.id);
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Error al guardar mascota.');
    } finally {
      setSubmittingMascota(false);
    }
  };

  const handleEliminarMascota = (mascotaId, nombre) => {
    setConfirmConfig({
      title: 'Eliminar Mascota',
      type: 'danger',
      message: `¿Estás seguro de eliminar la mascota "${nombre}" del censo?`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await api.delete(`/unidades/${selectedUnidad.id}/mascotas/${mascotaId}`);
          showNotif('success', 'Mascota eliminada del censo.');
          fetchMascotasUnidad(selectedUnidad.id);
        } catch (err) {
          showNotif('error', 'Error al eliminar mascota.');
        }
      }
    });
  };

  const unidadesFiltradas = unidades.filter(u => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const concatenado = `${u.torre}${u.numeroUnidad}`.toLowerCase();
    const propNombre = String(u.propietario?.nombreCompleto || '').toLowerCase();
    const propCedula = String(u.propietario?.cedula || '').toLowerCase();
    return (
      concatenado.includes(term) ||
      String(u.torre).toLowerCase().includes(term) ||
      String(u.numeroUnidad).toLowerCase().includes(term) ||
      propNombre.includes(term) ||
      propCedula.includes(term)
    );
  });

  const totalCoeficiente = unidades.reduce((acc, curr) => acc + (curr.coeficiente || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-12">

      {/* Modal de Confirmación Estilizado */}
      <ConfirmModal confirmConfig={confirmConfig} onClose={() => setConfirmConfig(null)} />

      {/* Notificaciones Flotantes */}
      {notif && (
        <div className={`p-4 rounded-2xl border text-xs font-bold animate-fadeIn flex items-center gap-2.5 ${notif.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
          {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{notif.text}</span>
        </div>
      )}

      {/* VISTA 1: DIRECTORIO GENERAL DE INMUEBLES (selectedUnidad === null) */}
      {!selectedUnidad ? (
        <div className="space-y-6">

          {/* Encabezado del Módulo */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Building className="w-6 h-6" />
                </div>
                Copropiedades e Inmuebles
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Directorio integral de unidades privadas, coeficientes, censo de residentes, apoderados, vehículos y mascotas.
              </p>
            </div>

            {/* Barra de Métricas Principales */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inmuebles</span>
                <span className="text-base font-extrabold text-white">{unidades.length}</span>
              </div>
              <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Coeficiente Total</span>
                <span className="text-base font-extrabold text-emerald-300">{totalCoeficiente.toFixed(4)}%</span>
              </div>
            </div>
          </div>

          {/* Botones de Acción y Buscador */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por Torre, Apt o Propietario..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 focus:border-emerald-500 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowCrearUnidadForm(!showCrearUnidadForm)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Inmueble</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCargueMasivo(!showCargueMasivo)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Cargue Excel</span>
              </button>

              <button
                type="button"
                onClick={handleDescargarPlantilla}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Descargar Plantilla Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FORMULARIO CREAR INMUEBLE INDIVIDUAL */}
          {showCrearUnidadForm && (
            <form onSubmit={handleCrearUnidad} className="p-5 bg-slate-950/90 border border-emerald-500/30 rounded-3xl space-y-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Registrar Nuevo Inmueble / Unidad Privada
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Torre / Bloque *</label>
                  <input
                    type="text"
                    required
                    value={nuevaTorre}
                    onChange={(e) => setNuevaTorre(e.target.value)}
                    placeholder="Ej: 1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Número de Apt / Casa *</label>
                  <input
                    type="text"
                    required
                    value={nuevoNumeroUnidad}
                    onChange={(e) => setNuevoNumeroUnidad(e.target.value)}
                    placeholder="Ej: 101"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Coeficiente (%) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={nuevoCoeficiente}
                    onChange={(e) => setNuevoCoeficiente(e.target.value)}
                    placeholder="Ej: 1.2500"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Cédula Propietario</label>
                  <input
                    type="text"
                    value={propCedula}
                    onChange={(e) => setPropCedula(e.target.value)}
                    placeholder="Ej: 1018420"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Nombre Propietario</label>
                  <input
                    type="text"
                    value={propNombre}
                    onChange={(e) => setPropNombre(e.target.value)}
                    placeholder="Ej: Carlos Pérez"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={propEmail}
                    onChange={(e) => setPropEmail(e.target.value)}
                    placeholder="carlos@ejemplo.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={propTel}
                    onChange={(e) => setPropTel(e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrearUnidadForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingUnidad}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {submittingUnidad ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Guardar Inmueble</span>
                </button>
              </div>
            </form>
          )}

          {/* CARGUE MASIVO EXCEL */}
          {showCargueMasivo && (
            <form
              onSubmit={handleCargueMasivoExcel}
              className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/40 rounded-3xl space-y-6 shadow-2xl animate-fadeIn relative overflow-hidden"
            >
              {/* Glow decorativo de fondo */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header de la tarjeta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-inner">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Cargue Masivo de Inmuebles desde Excel
                      <span className="text-[10px] font-mono px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold">
                        .xlsx / .xls
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Importa el censo de inmuebles y propietarios titulares de forma rápida y automatizada.
                    </p>
                  </div>
                </div>

                {/* Botón Descargar Plantilla */}
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer group"
                  title="Descargar plantilla oficial estructurada en formato Excel"
                >
                  <Download className="w-4 h-4 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
                  <span>Descargar Plantilla Excel</span>
                </button>
              </div>

              {/* Pasos de guía */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">1</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-200">1. Descarga la Plantilla</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Obtén el formato oficial con la estructura de columnas requerida.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-purple-500/30">2</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-200">2. Diligencia los Datos</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Completa número de unidad, bloque, coeficiente y datos del propietario.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">3</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-200">3. Sube e Importa</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Arrastra tu archivo listo para validar y registrar el censo masivo.</p>
                  </div>
                </div>
              </div>

              {/* Zona de Dropzone (Arrastrar y Soltar / Seleccionar) */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                      setExcelFile(file);
                    } else {
                      showNotif('error', 'Por favor selecciona un archivo con extensión .xlsx o .xls');
                    }
                  }
                }}
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${isDragging
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                  : excelFile
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-950/80 hover:border-indigo-500/50 hover:bg-slate-900/60'
                  }`}
                onClick={() => document.getElementById('excelFileInput')?.click()}
              >
                <input
                  id="excelFileInput"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="hidden"
                />

                {excelFile ? (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="inline-flex p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-emerald-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {excelFile.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Tamaño: {(excelFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExcelFile(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold transition-colors pt-1 inline-block cursor-pointer"
                    >
                      Cambiar o remover archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Arrastra y suelta tu archivo Excel (.xlsx) aquí o <span className="text-indigo-400 underline">haz clic para examinar</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Formatos aceptados: Microsoft Excel (.xlsx, .xls) hasta 10 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción inferior */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Columnas de la plantilla: Número Unidad, Bloque/Torre, Coeficiente, Cédula, Nombre, Correo, Teléfono.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCargueMasivo(false);
                      setExcelFile(null);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={uploadingExcel || !excelFile}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadingExcel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{uploadingExcel ? 'Procesando e Importando...' : 'Iniciar Cargue Masivo'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* REPORTE DE RESULTADOS DEL CARGUE MASIVO */}
          {cargueResult && (
            <div className="p-6 bg-slate-900 border border-indigo-500/40 rounded-3xl space-y-5 shadow-2xl animate-fadeIn relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${cargueResult.fallidos === 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    {cargueResult.fallidos === 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Informe del Cargue Masivo
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${cargueResult.fallidos === 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                        {cargueResult.fallidos === 0 ? '¡Completado con Éxito!' : 'Con Observaciones'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{cargueResult.mensaje || 'Procesamiento de archivo Excel finalizado.'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCargueResult(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar informe"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Indicadores cuantitativos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Filas Procesadas</span>
                  <span className="text-2xl font-extrabold text-white font-mono block">{cargueResult.totalProcesados}</span>
                </div>

                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Inmuebles Creados / Exitosos</span>
                  <span className="text-2xl font-extrabold text-emerald-300 font-mono block">✓ {cargueResult.exitosos}</span>
                </div>

                <div className={`p-4 rounded-2xl text-center space-y-1 border ${cargueResult.fallidos > 0 ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-slate-950/80 border-slate-800 text-slate-500'}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">Filas con Error / Inconsistencias</span>
                  <span className="text-2xl font-extrabold font-mono block">{cargueResult.fallidos > 0 ? `⚠ ${cargueResult.fallidos}` : '0'}</span>
                </div>
              </div>

              {/* Detalle de Errores Encontrados */}
              {cargueResult.errores && cargueResult.errores.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Detalle de Registro de Errores ({cargueResult.errores.length})
                  </h4>

                  <div className="max-h-56 overflow-y-auto p-4 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-2 font-mono text-xs text-rose-300/90 leading-relaxed shadow-inner">
                    {cargueResult.errores.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 border-b border-rose-950/60 pb-2 last:border-0 last:pb-0">
                        <span className="text-rose-500 font-bold shrink-0">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCargueResult(null);
                    setShowCargueMasivo(false);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Entendido / Finalizar
                </button>
              </div>
            </div>
          )}

          {/* TABLA / GRILLA DE INMUEBLES */}
          {loading ? (
            <div className="p-12 glass-panel border border-slate-800 rounded-3xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-300">Cargando unidades privadas...</p>
            </div>
          ) : unidadesFiltradas.length === 0 ? (
            <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-3xl text-center space-y-2">
              <p className="text-sm font-bold text-slate-300">No se encontraron unidades registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unidadesFiltradas.map((u) => {
                const tieneApoderado = Boolean(u.apoderado);
                return (
                  <div
                    key={u.id}
                    className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 bg-slate-900/80 group"
                  >
                    <div className="space-y-3">
                      {/* Cabecera Inmueble */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-white text-base">Torre {u.torre} - Apt {u.numeroUnidad}</h3>
                            <span className="text-[11px] text-slate-400">Coeficiente: <strong className="text-emerald-300">{(u.coeficiente || 0).toFixed(4)}%</strong></span>
                          </div>
                        </div>

                        {tieneApoderado && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Poder Aprobado
                          </span>
                        )}
                      </div>

                      {/* Datos Propietario / Titular */}
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Propietario / Titular</span>
                        <p className="font-bold text-slate-200">{u.propietario?.nombreCompleto || 'Sin registrar'}</p>
                        {u.propietario?.cedula && <p className="text-[11px] text-slate-400 font-mono">Doc: {u.propietario.cedula}</p>}
                      </div>
                    </div>

                    {/* Botón Ir al Detalle en Pantalla Completa */}
                    <div className="pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUnidad(u);
                          setActiveTabDetail('inmueble');
                          cargarDatosInmuebleForm(u);
                        }}
                        className="w-full py-2 px-3 bg-slate-950 hover:bg-emerald-950/60 text-emerald-300 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group-hover:bg-emerald-950/40"
                      >
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          Gestionar Inmueble (Ficha, Residentes, Vehículos)
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Controles de Paginación */}
          {!loading && totalElements > 0 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              pageSizeOptions={[12, 24, 48, 96]}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
              itemName="inmuebles"
            />
          )}
        </div>
      ) : (

        /* VISTA 2: DETALLE DEL INMUEBLE SELECCIONADO EN MISMA PANTALLA (NO MODAL) */
        <div className="space-y-6 animate-fadeIn">

          {/* Cabecera y Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedUnidad(null);
                fetchUnidades();
              }}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Volver a la Lista de Inmuebles</span>
            </button>

            <div className="text-right">
              <h2 className="text-xl font-extrabold text-white">
                Torre {selectedUnidad.torre} — Apartamento {selectedUnidad.numeroUnidad}
              </h2>
              <p className="text-xs text-slate-400">
                Coeficiente de participación: <strong className="text-emerald-300">{(selectedUnidad.coeficiente || 0).toFixed(4)}%</strong>
              </p>
            </div>
          </div>

          {/* Menú de Pestañas en la Misma Pantalla */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTabDetail('inmueble')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTabDetail === 'inmueble'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Datos del Inmueble</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabDetail('residentes')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTabDetail === 'residentes'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Integrantes y Residentes ({habitantes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabDetail('vehiculos')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTabDetail === 'vehiculos'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Car className="w-4 h-4 text-indigo-400" />
              <span>Vehículos & Parqueaderos ({vehiculos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabDetail('mascotas')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${activeTabDetail === 'mascotas'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Dog className="w-4 h-4 text-amber-400" />
              <span>Mascotas ({mascotas.length})</span>
            </button>
          </div>

          {/* CONTENIDO PESTAÑA 0 (PRIMERA PESTAÑA): DATOS Y EDICIÓN DEL INMUEBLE */}
          {activeTabDetail === 'inmueble' && (
            <div className="space-y-6 animate-fadeIn">
              <form onSubmit={handleGuardarInmueble} className="space-y-6">
                
                {/* Cabecera Informativa con Resumen Rápido */}
                <div className="p-5 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        Ficha Técnica del Inmueble
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                          ID #{selectedUnidad.id}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Edita la nomenclatura, alícuota de copropiedad, datos de contacto del propietario titular y apoderado.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => cargarDatosInmuebleForm(selectedUnidad)}
                      disabled={savingInmueble}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Revertir cambios a los valores guardados"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revertir</span>
                    </button>
                    <button
                      type="submit"
                      disabled={savingInmueble}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingInmueble ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Bloque 1: Nomenclatura y Coeficiente */}
                  <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                      <Building className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
                        1. Identificación y Coeficiente
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Torre / Bloque <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editTorre}
                          onChange={(e) => setEditTorre(e.target.value)}
                          placeholder="Ej: 1, A, Torre 2"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Apartamento / Unidad <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editNumeroUnidad}
                          onChange={(e) => setEditNumeroUnidad(e.target.value)}
                          placeholder="Ej: 101, 502"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Coeficiente (%) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={editCoeficiente}
                          onChange={(e) => setEditCoeficiente(e.target.value)}
                          placeholder="Ej: 1.2500"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-emerald-300 font-mono font-bold text-xs focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        El coeficiente determina el peso de voto en las asambleas generales y el porcentaje de participación del inmueble sobre las áreas comunes.
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Propietario Titular */}
                  <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                      <Crown className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
                        2. Propietario Titular Registrado
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Cédula / Documento <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editCedulaProp}
                          onChange={(e) => setEditCedulaProp(e.target.value)}
                          placeholder="Número de cédula"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white font-mono text-xs focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={editNombreProp}
                          onChange={(e) => setEditNombreProp(e.target.value)}
                          placeholder="Nombre y apellidos"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          value={editEmailProp}
                          onChange={(e) => setEditEmailProp(e.target.value)}
                          placeholder="propietario@ejemplo.com"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Teléfono / Celular
                        </label>
                        <input
                          type="text"
                          value={editTelProp}
                          onChange={(e) => setEditTelProp(e.target.value)}
                          placeholder="300 123 4567"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bloque 3: Representación / Apoderado */}
                <div className="p-5 bg-slate-950/80 border border-amber-500/20 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                        3. Poder de Representación y Apoderado (Opcional)
                      </h4>
                      {(editDocApoderado || editNombreApoderado) && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          {selectedUnidad.poderAprobado ? 'Poder Aprobado' : 'Poder Pendiente'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowApoderadoEdit(!showApoderadoEdit)}
                      className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showApoderadoEdit ? 'Ocultar campos' : 'Configurar apoderado'}</span>
                      {showApoderadoEdit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {showApoderadoEdit && (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Cédula Apoderado
                          </label>
                          <input
                            type="text"
                            value={editDocApoderado}
                            onChange={(e) => setEditDocApoderado(e.target.value)}
                            placeholder="Dejar vacío si no aplica"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-white font-mono text-xs focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Nombre Apoderado
                          </label>
                          <input
                            type="text"
                            value={editNombreApoderado}
                            onChange={(e) => setEditNombreApoderado(e.target.value)}
                            placeholder="Nombre del apoderado"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Correo Electrónico
                          </label>
                          <input
                            type="email"
                            value={editEmailApoderado}
                            onChange={(e) => setEditEmailApoderado(e.target.value)}
                            placeholder="apoderado@ejemplo.com"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Teléfono
                          </label>
                          <input
                            type="text"
                            value={editTelApoderado}
                            onChange={(e) => setEditTelApoderado(e.target.value)}
                            placeholder="300 777 8899"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 border border-amber-500/20 rounded-2xl">
                        <p className="text-[11px] text-slate-400">
                          {selectedUnidad.poderAprobado
                            ? 'Este apoderado cuenta con el poder verificado y aprobado para ejercer voz y voto en las asambleas.'
                            : 'Al asignar o cambiar un apoderado, el poder queda en revisión hasta ser aprobado por la administración.'}
                        </p>

                        {(editDocApoderado?.trim() && selectedUnidad.id) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const nuevoEstado = !selectedUnidad.poderAprobado;
                                await api.patch(`/unidades/${selectedUnidad.id}/aprobar-poder?aprobado=${nuevoEstado}`);
                                setSelectedUnidad(prev => ({ ...prev, poderAprobado: nuevoEstado }));
                                setUnidades(prev => prev.map(u => u.id === selectedUnidad.id ? { ...u, poderAprobado: nuevoEstado } : u));
                                showNotif('success', `Poder ${nuevoEstado ? 'Aprobado' : 'Revocado'} exitosamente.`);
                              } catch (err) {
                                showNotif('error', err.response?.data?.message || 'Error al cambiar estado del poder.');
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                              selectedUnidad.poderAprobado
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{selectedUnidad.poderAprobado ? 'Revocar Aprobación' : 'Aprobar Poder Ahora'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </form>
            </div>
          )}

          {/* CONTENIDO PESTAÑA 2: INTEGRANTES Y RESIDENTES */}
          {activeTabDetail === 'residentes' && (
            <div className="space-y-6">

              {/* Formulario Agregar/Editar Residente */}
              <form id="form-habitante-inmueble" onSubmit={handleAgregarHabitanteInPage} className={`p-5 border rounded-3xl space-y-4 transition-all ${editingHabitanteId ? 'bg-slate-950 border-amber-500/50 ring-1 ring-amber-500/30' : 'bg-slate-950/80 border-slate-800'}`}>
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  {editingHabitanteId ? (
                    <>
                      <Pencil className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">Editar Integrante / Residente ({resNombre || 'Seleccionado'})</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      Registrar Integrante / Residente en Torre {selectedUnidad.torre} - Apt {selectedUnidad.numeroUnidad}
                    </>
                  )}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Identificación / Cédula *</label>
                    <input
                      type="text"
                      required
                      value={resCedula}
                      onChange={(e) => setResCedula(e.target.value)}
                      placeholder="Ej: 101842011"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={resNombre}
                      onChange={(e) => setResNombre(e.target.value)}
                      placeholder="Ej: María José Linares"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Email (Opcional)</label>
                    <input
                      type="email"
                      value={resEmail}
                      onChange={(e) => setResEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Teléfono (Opcional)</label>
                    <input
                      type="text"
                      value={resTel}
                      onChange={(e) => setResTel(e.target.value)}
                      placeholder="300 123 4567"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resPropietarioPrincipal}
                        onChange={(e) => setResPropietarioPrincipal(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-700 bg-slate-900 cursor-pointer"
                      />
                      <span>Propietario Titular (Usuario Acceso)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resArrendatario}
                        onChange={(e) => setResArrendatario(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 border-slate-700 bg-slate-900 cursor-pointer"
                      />
                      <span>Arrendatario / Inquilino</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resApoderado}
                        onChange={(e) => setResApoderado(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 border-slate-700 bg-slate-900 cursor-pointer"
                      />
                      <span>Apoderado de Asamblea</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingHabitanteId && (
                      <button
                        type="button"
                        onClick={handleCancelarEdicionHabitante}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={submittingHabitante}
                      className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${editingHabitanteId
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                    >
                      {submittingHabitante ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : editingHabitanteId ? <Pencil className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                      <span>{editingHabitanteId ? 'Guardar Cambios' : 'Guardar Residente'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Listado de Residentes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Censo de Integrantes Registrados ({habitantes.length})
                </h3>

                {loadingHabitantes ? (
                  <div className="p-8 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Cargando integrantes...</p>
                  </div>
                ) : habitantes.length === 0 ? (
                  <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                    No hay integrantes registrados aún en este inmueble.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {habitantes.map((h) => {
                      const p = h.persona;
                      return (
                        <div key={h.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-extrabold text-white text-sm">{p.nombreCompleto}</h4>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">Doc: {p.cedula}</p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleIniciarEdicionHabitante(h)}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${editingHabitanteId === h.id
                                  ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40'
                                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                  }`}
                                title="Editar Integrante"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEliminarHabitanteInPage(h.id, p.nombreCompleto)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                title="Retirar Integrante"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {(p.email || p.telefono) && (
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                              {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" />{p.email}</span>}
                              {p.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" />{p.telefono}</span>}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                            {h.esPropietarioPrincipal && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-emerald-400" /> Propietario Titular
                              </span>
                            )}

                            {h.esArrendatario && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                Inquilino / Arrendatario
                              </span>
                            )}

                            {!h.esPropietarioPrincipal && (
                              <button
                                type="button"
                                onClick={() => handleToggleApoderadoInPage(h)}
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${h.esApoderadoDesignado
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-amber-500/40'
                                  }`}
                              >
                                <Star className={`w-3 h-3 ${h.esApoderadoDesignado ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                                <span>{h.esApoderadoDesignado ? 'Apoderado Asamblea' : 'Marcar Apoderado'}</span>
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
          )}

          {/* CONTENIDO PESTAÑA 2: VEHÍCULOS */}
          {activeTabDetail === 'vehiculos' && (
            <div className="space-y-6">
              {/* Formulario Registrar Vehículo */}
              <form onSubmit={handleAgregarVehiculo} className="p-5 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" />
                  Registrar Vehículo en Torre {selectedUnidad.torre} - Apt {selectedUnidad.numeroUnidad}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Placa *</label>
                    <input
                      type="text"
                      required
                      value={vPlaca}
                      onChange={(e) => setVPlaca(e.target.value.toUpperCase())}
                      placeholder="Ej: ABC-123"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Tipo *</label>
                    <select
                      value={vTipo}
                      onChange={(e) => setVTipo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs"
                    >
                      <option value="CARRO">Carro / Automóvil</option>
                      <option value="MOTO">Motocicleta</option>
                      <option value="BICICLETA">Bicicleta</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Marca / Modelo</label>
                    <input
                      type="text"
                      value={vMarca}
                      onChange={(e) => setVMarca(e.target.value)}
                      placeholder="Ej: Mazda 3 / Yamaha"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Color</label>
                    <input
                      type="text"
                      value={vColor}
                      onChange={(e) => setVColor(e.target.value)}
                      placeholder="Ej: Gris Metalizado"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Celda / Parqueadero Asignado</label>
                    <input
                      type="text"
                      value={vCelda}
                      onChange={(e) => setVCelda(e.target.value)}
                      placeholder="Ej: Celda 102 / Sótano 1"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Observaciones</label>
                    <input
                      type="text"
                      value={vObs}
                      onChange={(e) => setVObs(e.target.value)}
                      placeholder="Notas adicionales..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingVehiculo}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingVehiculo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>Guardar Vehículo</span>
                  </button>
                </div>
              </form>

              {/* Lista de Vehículos */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Vehículos Registrados ({vehiculos.length})
                </h3>

                {loadingVehiculos ? (
                  <div className="p-8 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Cargando vehículos...</p>
                  </div>
                ) : vehiculos.length === 0 ? (
                  <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                    No hay vehículos registrados para este inmueble.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehiculos.map((v) => (
                      <div key={v.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-mono">
                              {v.placa}
                            </span>
                            <span className="text-xs font-extrabold text-white">{v.marcaModelo || 'Vehículo'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEliminarVehiculo(v.id, v.placa)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Eliminar Vehículo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/60">
                          <div>Tipo: <strong className="text-slate-200">{v.tipo}</strong> {v.color ? `• ${v.color}` : ''}</div>
                          {v.parqueadero && <div>Celda: <strong className="text-emerald-400">{v.parqueadero}</strong></div>}
                          {v.observaciones && <p className="text-[10px] text-slate-500 italic">"{v.observaciones}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTENIDO PESTAÑA 3: MASCOTAS */}
          {activeTabDetail === 'mascotas' && (
            <div className="space-y-6">
              {/* Formulario Registrar Mascota */}
              <form onSubmit={handleAgregarMascota} className="p-5 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Dog className="w-4 h-4 text-amber-400" />
                  Registrar Mascota en Torre {selectedUnidad.torre} - Apt {selectedUnidad.numeroUnidad}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={mNombre}
                      onChange={(e) => setMNombre(e.target.value)}
                      placeholder="Ej: Max / Firulais"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Especie / Tipo *</label>
                    <select
                      value={mTipo}
                      onChange={(e) => setMTipo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs"
                    >
                      <option value="PERRO">Perro</option>
                      <option value="GATO">Gato</option>
                      <option value="AVE">Ave</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Raza</label>
                    <input
                      type="text"
                      value={mRaza}
                      onChange={(e) => setMRaza(e.target.value)}
                      placeholder="Ej: Criollo / Labrador"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Color</label>
                    <input
                      type="text"
                      value={mColor}
                      onChange={(e) => setMColor(e.target.value)}
                      placeholder="Ej: Manchado / Dorado"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mVacunas}
                      onChange={(e) => setMVacunas(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 border-slate-700 bg-slate-900 cursor-pointer"
                    />
                    <span>Vacunas al día / Carné oficial presentado</span>
                  </label>

                  <button
                    type="submit"
                    disabled={submittingMascota}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingMascota ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>Guardar Mascota</span>
                  </button>
                </div>
              </form>

              {/* Lista de Mascotas */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Censo de Mascotas ({mascotas.length})
                </h3>

                {loadingMascotas ? (
                  <div className="p-8 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Cargando censo de mascotas...</p>
                  </div>
                ) : mascotas.length === 0 ? (
                  <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                    No hay mascotas registradas para este inmueble.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mascotas.map((m) => (
                      <div key={m.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-extrabold text-white text-sm">{m.nombre}</h4>
                            <p className="text-xs text-slate-400">{m.tipo} {m.raza ? `• ${m.raza}` : ''}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEliminarMascota(m.id, m.nombre)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Eliminar Mascota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                          <span>Vacunación:</span>
                          <span className={`font-bold ${m.vacunasAlDia ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.vacunasAlDia ? 'Al día' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
