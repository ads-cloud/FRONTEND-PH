import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CopropietarioVotingView from './components/CopropietarioVotingView';
import CambiarPasswordModal from './components/CambiarPasswordModal';
import ModuloGrid from './components/ModuloGrid';
import PerfilModulo from './components/PerfilModulo';
import GestionModulosModulo from './components/GestionModulosModulo';
import CopropiedadesModulo from './components/CopropiedadesModulo';
import MiInmuebleModulo from './components/MiInmuebleModulo';
import SuperAdminModulosModulo from './components/SuperAdminModulosModulo';
import ConfiguracionPhModulo from './components/ConfiguracionPhModulo';
import { ToastProvider } from './components/NotificationToast';
import api from './api/axiosClient';
import { Activity, Database, Radio, AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[FRONTEND ErrorBoundary] ❌ Excepción capturada en renderizado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-md mx-auto my-12 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-3 bg-rose-500/20 text-rose-400 rounded-full">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Error de Renderizado en Interfaz</h3>
          <p className="text-xs text-rose-300 font-mono bg-slate-950 p-3 rounded-xl overflow-x-auto text-left">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Recargar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getInitialUser = () => {
  try {
    const stored = sessionStorage.getItem('user_data') || localStorage.getItem('user_data');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const getInitialActiveView = (u) => {
  if (u?.roles?.includes('ROLE_SUPER_ADMIN')) return 'superadmin';
  if (u?.roles?.includes('ROLE_ADMIN') || u?.roles?.includes('ROLE_SECRETARIA') || u?.roles?.includes('ROLE_GESTOR')) return 'admin';
  return 'voter';
};

export default function App() {
  const initialUser = getInitialUser();
  const [user, setUser] = useState(initialUser);
  const [sessionLoading, setSessionLoading] = useState(!initialUser);
  const [activeView, setActiveView] = useState(() => getInitialActiveView(initialUser)); // 'superadmin' | 'admin' | 'voter'
  const [selectedModule, setSelectedModule] = useState(null); // null (Parrilla Principal) | 'asambleas' | 'perfil'
  const [searchTerm, setSearchTerm] = useState('');
  const [health, setHealth] = useState(null);
  const [showPerfilModal, setShowPerfilModal] = useState(false);

  // Restore user session on mount via HTTP-Only cookie /auth/me or stored session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          const fetchedUser = res.data;
          setUser(fetchedUser);
          sessionStorage.setItem('user_data', JSON.stringify(fetchedUser));
          if (fetchedUser.copropiedadId) {
            sessionStorage.setItem('active_copropiedad_id', fetchedUser.copropiedadId.toString());
          }

          if (fetchedUser.roles?.includes('ROLE_SUPER_ADMIN')) {
            setActiveView('superadmin');
          } else if (fetchedUser.roles?.includes('ROLE_ADMIN') || fetchedUser.roles?.includes('ROLE_SECRETARIA') || fetchedUser.roles?.includes('ROLE_GESTOR')) {
            setActiveView('admin');
          } else {
            setActiveView('voter');
          }
        }
      } catch (err) {
        if (!sessionStorage.getItem('jwt_token') && !localStorage.getItem('jwt_token')) {
          setUser(null);
          sessionStorage.clear();
        }
      } finally {
        setSessionLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Diagnóstico pasivo de salud del sistema (Sin setInterval recurrente)
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        setHealth({ status: 'DOWN', database: 'DOWN', rabbitmq: 'DOWN' });
      }
    };

    // Ejecutar chequeo inicial único al arrancar
    checkHealth();

    // Escuchador pasivo: Interceptar errores de red HTTP para diagnosticar automáticamente
    const interceptorId = api.interceptors.response.use(
      (response) => {
        if (health?.status === 'DOWN') {
          setHealth({ status: 'UP', database: 'UP', rabbitmq: 'UP' });
        }
        return response;
      },
      (error) => {
        if (error.code === 'ERR_NETWORK' || !error.response) {
          checkHealth();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setSelectedModule(null); // Siempre iniciar en la parrilla de módulos principal al hacer login
    if (userData.roles?.includes('ROLE_SUPER_ADMIN')) {
      setActiveView('superadmin');
    } else if (userData.roles?.includes('ROLE_ADMIN') || userData.roles?.includes('ROLE_SECRETARIA') || userData.roles?.includes('ROLE_GESTOR')) {
      setActiveView('admin');
    } else {
      setActiveView('voter');
    }
  };

  const handlePasswordChanged = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignorar errores al cerrar sesión
    }
    sessionStorage.clear();
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setSelectedModule(null); // Restablecer módulo seleccionado a la parrilla principal al cerrar sesión
    setUser(null);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-tech-gradient text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
        {/* Rayos decorativos en diagonal inspirados en la referencia */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Modal Obligatorio de Cambio de Contraseña en Primer Ingreso */}
        {user && user.debeCambiarPassword && (
          <CambiarPasswordModal user={user} onPasswordChanged={handlePasswordChanged} />
        )}

        {/* Top Navigation - Solo se muestra si el usuario ha iniciado sesión */}
        {user && (
          <Navbar
            activeView={activeView}
            setActiveView={setActiveView}
            user={user}
            onLogout={handleLogout}
            health={health}
            onUserUpdate={(updatedUser) => setUser(updatedUser)}
            selectedModule={selectedModule}
            onSelectModule={(mod) => setSelectedModule(mod)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {/* Main Container */}
        <main className={`flex-1 mx-auto relative z-0 ${!user ? 'w-full p-4 sm:p-6 lg:p-8' : 'w-[90%] max-w-[90%] pt-20 pb-8 px-2 sm:px-4 lg:px-6'}`}>

          {/* View Switch: Require Authentication */}
          <ErrorBoundary>
            {sessionLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 animate-fadeIn">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-slate-400">Verificando sesión activa...</p>
              </div>
            ) : !user ? (
              <div key="view-login-form">
                <LoginForm onLoginSuccess={handleLoginSuccess} health={health} />
              </div>
            ) : selectedModule === null ? (
              <div key={`view-grid-${user?.documento}`}>
                <ModuloGrid user={user} onSelectModule={(mod) => setSelectedModule(mod)} searchTerm={searchTerm} />
              </div>
            ) : selectedModule === 'perfil' ? (
              <div key={`view-perfil-${user?.documento}`}>
                <PerfilModulo
                  user={user}
                  onUserUpdate={(updatedUser) => setUser(updatedUser)}
                  onLogout={handleLogout}
                  health={health}
                />
              </div>
            ) : selectedModule === 'gestion_modulos' && user.roles?.includes('ROLE_SUPER_ADMIN') ? (
              <div key={`view-gestionmodulos-${user.documento}`}>
                <GestionModulosModulo user={user} onBack={() => setSelectedModule(null)} />
              </div>
            ) : selectedModule === 'copropiedades' && user.roles?.includes('ROLE_ADMIN') ? (
              <div key={`view-copropiedades-${user.documento}`}>
                <CopropiedadesModulo user={user} />
              </div>
            ) : selectedModule === 'mi_inmueble' ? (
              <div key={`view-mi-inmueble-${user?.documento}`}>
                <MiInmuebleModulo user={user} />
              </div>
            ) : (selectedModule === 'configuracion' || selectedModule === 'configuracion_ph') && user.roles?.includes('ROLE_ADMIN') ? (
              <div key={`view-configuracionph-${user.documento}`}>
                <ConfiguracionPhModulo user={user} />
              </div>
            ) : selectedModule === 'monitoreo' && user.roles?.includes('ROLE_SUPER_ADMIN') ? (
              <div key={`view-monitoreo-${user.documento}`}>
                <SuperAdminDashboard health={health} defaultTab="monitoreo" />
              </div>
            ) : selectedModule === 'admin_ph' && user.roles?.includes('ROLE_SUPER_ADMIN') ? (
              <div key={`view-adminph-${user.documento}`}>
                <SuperAdminDashboard health={health} defaultTab="ph" />
              </div>
            ) : (selectedModule === 'admin_modulos' || selectedModule === 'gestion_catalogo_modulos') && user.roles?.includes('ROLE_SUPER_ADMIN') ? (
              <div key={`view-superadminmodulos-${user.documento}`}>
                <SuperAdminModulosModulo user={user} />
              </div>
            ) : selectedModule === 'asambleas' ? (
              user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_SECRETARIA') || user.roles?.includes('ROLE_GESTOR') ? (
                <div key={`view-admin-${user.documento}`}>
                  <AdminDashboard user={user} asambleaId={1} />
                </div>
              ) : (
                <div key={`view-voter-${user?.documento || 'voter'}`}>
                  <CopropietarioVotingView user={user} />
                </div>
              )
            ) : activeView === 'superadmin' && user.roles?.includes('ROLE_SUPER_ADMIN') ? (
              <div key={`view-superadmin-${user.documento}`}>
                <SuperAdminDashboard health={health} defaultTab="monitoreo" />
              </div>
            ) : activeView === 'admin' && (user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_SECRETARIA') || user.roles?.includes('ROLE_GESTOR')) ? (
              <div key={`view-admin-${user.documento}`}>
                <AdminDashboard user={user} asambleaId={1} />
              </div>
            ) : (
              <div key={`view-voter-${user?.documento || 'voter'}`}>
                <CopropietarioVotingView user={user} />
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}
