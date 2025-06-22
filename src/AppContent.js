// AppContent.jsx
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { Toaster} from 'sonner';
import socket from './socket';



import Calendar from './components/interfaz_calendar/calendar';
import Reports from './components/interfaz_reports/reports';
import Login from './components/interfaz_login/login';
import Registro from './components/interfaz_login/registro';
import Crud from './components/interfaz_login/crud';
import AccountConfig from './components/AccountConfig';
import NavbarGlobal from './components/NavbarGlobal';
import { notifyTicket, notifyReserva } from './notificacions';

export default function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/registro'];
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  const superUserRoutes = ['/crud', '/registro'];
  const userRoutes = ['/crud', '/configuracion', '/registro', '/reportes'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
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
    const currentUser = localStorage.getItem('username');
    const onNewTicket = (ticket) => {
      // PARA QUE LO MUESTRE A TODOS MENOS A AL QUE CREÓ EL TICKET
      if (ticket.created_by !== currentUser) {
        notifyTicket(`🎟️ Nuevo ticket recibido`, ticket);
      }
      // QUITAR COMENTARIO PARA MOSTRAR A TODOS
      // notifyTicket(`🎟️ Nuevo ticket recibido`, ticket);
      console.log('🎟️ Nuevo ticket recibido:', ticket);
    };

    socket.on('new-ticket', onNewTicket);

    return () => {
      socket.off('new-ticket', onNewTicket);
    };
  }, []);


  /* SOCKET.io: RESERVAS */
  useEffect(() => {
    const handleNewReservation = (reservation) => {
      console.log('Reserva recibida por socket:', reservation); 
      notifyReserva(`✅ Nueva reserva`, reservation);
    };

    socket.on('new-reservation', handleNewReservation);

    return () => {
      socket.off('new-reservation', handleNewReservation);
    };
  }, []);


  // SOLO PARA DESARROLLO
  useEffect(() => {
    window.socket = socket;
  }, []);


  return (
    <>
      <div className="bg-gray-100 flex">
        {!shouldHideNavbar && <NavbarGlobal isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} userRole={userRole} setUserRole={setUserRole}/>}

        <div className="flex flex-col w-full">
          <Routes>
            <Route path='/' element={<Calendar />} />

            {isLoggedIn && (
              <>
                <Route path='/reportes' element={<Reports />} />
                <Route path='/crud' element={userRole === 'superuser' ? <Crud /> : <Navigate to="/" />} />
                <Route path='/registro' element={userRole === 'superuser' ? <Registro /> : <Navigate to="/" />} />
                <Route path='/configuracion' element={<AccountConfig />} />
              </>
            )}


            <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />}/>
            </Routes>
        </div>
      </div>
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
      position='bottom-right'
      duration={4000}
      expand
      />
    </>
  );
}
