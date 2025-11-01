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
import { NormalizeURL } from './utils/normalizeURL';
import './styles/toastColors.css';

import LandingPage from './components/interfaz_calendar/LandingPage';
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
  const hideNavbarRoutes = ['/login', '/signup'];
  const decoded = getDecodedToken();
  
  const role = decoded?.role ?? null;
  const user = decoded?.username ?? null;
  const userId = decoded?.id ?? null;

  const [isLoggedIn, setIsLoggedIn] = useState(!!decoded);
  const [userRole, setUserRole] = useState(role);
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstRender = useRef(true);


  const superUserRoutes = ['/crud', '/signup'];
  const userRoutes = ['/crud', '/config', '/signup', '/reports'];
  

  useEffect(() => {
    if (decoded?.token) {
      try {

        const now = Date.now() / 1000; // en segundos

        if (decoded.exp < now) {
          localStorage.clear();
          toast.error('Tu sesión ha expirado. Inicia sesión otra vez.');
          setIsLoggedIn(false);
          setUserRole(null);
          navigate('/calendar');
          return
        }
        setIsLoggedIn(true);
        setUserRole(decoded.role);

        if (superUserRoutes.includes(location.pathname) && decoded.role !== 'superuser') {
          toast.error(`Debes ser 'Super usuario' para acceder esta página.`);
          navigate('/calendar');
        }
        else if (location.pathname === '/login') {
          toast.error('Tu sesión sigue activa.');
          navigate('/calendar');
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.clear();
        toast.error('Sesión inválida. Vuelve a iniciar sesión.');
        setIsLoggedIn(false);
        setUserRole(null);
        navigate('/calendar');
      }
    } else if (userRoutes.includes(location.pathname)) {
      setIsLoggedIn(false);
      setUserRole(null);
      toast.error('Debes iniciar sesión para acceder a esta página.');
      navigate('/calendar');
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

    const markSeen = async (ids) => {
      if (!ids?.length) return;
      await fetch(`${process.env.REACT_APP_SOCKET_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ids }),
      });
    };

    const fetchPersistentNotifications = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SOCKET_URL}/notifications?user=${userId}`);
        const notifications = await response.json();

        const BATCH = 3;
        for (let i = 0; i < notifications.length; i += BATCH) {
          const batch = notifications.slice(i, i + BATCH);

          await Promise.all(
            batch.map((noti) => new Promise((resolve) => {
              const onSeen = async () => {
                await markSeen([noti.id]);
                resolve();
              };

              if (noti.type === 'new-ticket') {
                notifyTicket('🎟️ Nuevo reporte', noti.payload, onSeen);
              } else if (noti.type === 'new-reservation') {
                notifyReserva('✅ Nueva reserva', noti.payload, onSeen);
              } else {
                // No bloquea el lote
                resolve();
              }
            }))
          );
          await new Promise(r => setTimeout(r, 150));
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
    }, Math.floor(Math.random() * (900 - 800 + 1)) + 800);

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

      <NormalizeURL />
    
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/calendar" replace /> : <LandingPage /> }/>
        <Route path="/calendar" element={<Calendar />} />
        {isLoggedIn && (
          <>
            <Route path="/reports" element={<Reports />} />
            <Route path="/crud" element={userRole === 'superuser' ? <Crud /> : <Navigate to="/calendar" />} />
            <Route path="/signup" element={userRole === 'superuser' ? <Registro /> : <Navigate to="/calendar" />} />
            <Route path="/config" element={<AccountConfig />} />
          </>
        )}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/calendar" replace /> : <Login />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </div>

{/*     {!shouldHideFooter && (
      <Footer />
    )}
 */}
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
      duration={7000}
      expand
    />
  </>
);
}
