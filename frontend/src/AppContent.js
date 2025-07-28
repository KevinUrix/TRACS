import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDecodedToken } from './utils/auth';
import { notifyTicket, notifyReserva } from './utils/notificacions';
import { toast } from 'react-toastify';
import { Toaster} from 'sonner';
import Loader from './utils/loader';
import socket from './utils/socket';
import './styles/toastColors.css';

import Calendar from './components/interfaz_calendar/calendar';
import Reports from './components/interfaz_reports/reports';
import Login from './components/interfaz_login/login';
import Registro from './components/interfaz_login/registro';
import Crud from './components/interfaz_login/crud';
import AccountConfig from './components/AccountConfig';
import NavbarGlobal from './components/NavbarGlobal';

export default function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/registro'];
  const decoded = getDecodedToken();
  
  const role = decoded?.role ?? null;
  const user = decoded?.username ?? null;
  const userId = decoded?.id ?? null;

  const [isLoggedIn, setIsLoggedIn] = useState(!!decoded);
  const [userRole, setUserRole] = useState(role);
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstRender = useRef(true);


  const superUserRoutes = ['/crud', '/registro'];
  const userRoutes = ['/crud', '/configuracion', '/registro', '/reportes'];
  

  useEffect(() => {
    if (decoded?.token) {
      try {

        const now = Date.now() / 1000; // en segundos

        if (decoded.exp < now) {
          localStorage.clear();
          toast.error('Tu sesión ha expirado. Inicia sesión otra vez.');
          setIsLoggedIn(false);
          setUserRole(null);
          navigate('/');
          return
        }
        setIsLoggedIn(true);
        setUserRole(decoded.role);

        if (superUserRoutes.includes(location.pathname) && decoded.role !== 'superuser') {
          toast.error(`Debes ser 'Super usuario' para acceder esta página.`);
          navigate('/');
        }
        else if (location.pathname === '/login') {
          toast.error('Tu sesión sigue activa.');
          navigate('/');
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.clear();
        toast.error('Sesión inválida. Vuelve a iniciar sesión.');
        setIsLoggedIn(false);
        setUserRole(null);
        navigate('/');
      }
    } else if (userRoutes.includes(location.pathname)) {
      setIsLoggedIn(false);
      setUserRole(null);
      toast.error('Debes iniciar sesión para acceder a esta página.');
      navigate('/');
    }
  }, [location.pathname, navigate]);


  /* SOCKET.io: TICKETS */
  useEffect(() => {
    if (!user) return;

    const onNewTicket = async (data) => {
      const { id, payload } = data;
      notifyTicket(`🎟️ Nuevo reporte`, payload, async () => {
        try {
          await fetch(`${process.env.REACT_APP_SOCKET_URL}/notifications/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ids: [id] }),
          });
        } catch (err) {
          console.error('Error al marcar notificación de reporte como leída:', err.message);
        }
      })
    };

    socket.on('new-ticket', onNewTicket);
    return () => socket.off('new-ticket', onNewTicket);
  }, [userId]);


  /* SOCKET.io: RESERVAS */
  useEffect(() => {
    if (!user) return;

    const handleNewReservation = async (data) => {
      const { id, payload } = data;
      notifyReserva(`✅ Nueva reserva`, payload, async () => {
        try {
          await fetch(`${process.env.REACT_APP_SOCKET_URL}/notifications/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ids: [id] }),
          });
        } catch (err) {
          console.error('Error al marcar notificación de reserva como leída:', err.message);
        }
      });
    };

    socket.on('new-reservation', handleNewReservation);
    return () => socket.off('new-reservation', handleNewReservation);
  }, [userId]);


  /* SOCKET.io: NOTIFICACIONES PERSISTENTES */
  useEffect(() => {
    if (!user) return;

    const fetchPersistentNotifications = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SOCKET_URL}/notifications?user=${userId}`);
        const notifications = await response.json();

        for (const noti of notifications) {
          if (noti.type === 'new-ticket') {
            notifyTicket(`🎟️ Nuevo reporte`, noti.payload);
          } else if (noti.type === 'new-reservation') {
            notifyReserva(`✅ Nueva reserva`, noti.payload);
          }
        }

        // Marca las notificaciones como vistas, así que ya no aparecerán a usuarios
        const ids = notifications.map(noti => noti.id);
        if (ids.length > 0) {
          await fetch(`${process.env.REACT_APP_SOCKET_URL}/notifications/mark-read`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId, ids }),
          });
        }

      } catch (err) {
        console.error('Error al obtener notificaciones persistentes:', err.message);
      }
    };

    fetchPersistentNotifications();
  }, [userId]);


  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setIsLoading(false); // Asegura que el primer render esté en false
      return;
    }

    setIsLoading(true);

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [location.pathname]);


  return (
  <>
    {/* Navbar siempre visible */}
    {!shouldHideNavbar && (
      <NavbarGlobal
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        userRole={userRole}
        setUserRole={setUserRole}
      />
    )}
    <div className="relative flex flex-col w-full bg-gray-100" style={{ minHeight: 'calc(100vh - NAVBAR_HEIGHT_PX)' }}>
      {isLoading && <Loader />}

      {/* Renderiza los Routes sólo si NO está cargando */}
        <Routes>
          <Route path="/" element={<Calendar />} />
          {isLoggedIn && (
            <>
              <Route path="/reportes" element={<Reports />} />
              <Route path="/crud" element={userRole === 'superuser' ? <Crud /> : <Navigate to="/" />} />
              <Route path="/registro" element={userRole === 'superuser' ? <Registro /> : <Navigate to="/" />} />
              <Route path="/configuracion" element={<AccountConfig />} />
            </>
          )}
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>

    {/* Toasts */}
    <ToastContainer
      position="top-right"
      autoClose={2600}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
    <Toaster
      richColors
      position="bottom-right"
      duration={6500}
      expand
    />
  </>
);
}
