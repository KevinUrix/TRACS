// AppContent.jsx
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import socket from './socket';



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
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000; // en segundos

        if (decoded.exp < now) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('role');
          toast.error('Tu sesión ha expirado. Inicia sesión otra vez.');
          setIsLoggedIn(false);
          setUserRole(null);
          navigate('/');
        }
        else {
          setIsLoggedIn(true);
          setUserRole(localStorage.getItem('role'));
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        toast.error('Sesión inválida. Vuelve a iniciar sesión.');
        setIsLoggedIn(false);
        setUserRole(null);
        navigate('/login');
      }
    } else if (!hideNavbarRoutes.includes(location.pathname) && (location.pathname !== '/' && location.pathname !== '/calendario') ) {
      setIsLoggedIn(false);
      setUserRole(null);
      toast.error('Debes está logeado para entrar a esta página.');
      navigate('/login');
    }
  }, [location.pathname, navigate]);


  /* SOCKET.io: TICKETS */
  useEffect(() => {
    const currentUser = localStorage.getItem('username');
    const onNewTicket = (ticket) => {
      // PARA QUE LO MUESTRE A TODOS MENOS A AL QUE CREÓ EL TICKET
      if (ticket.created_by !== currentUser) {
      console.log('🎟️ Nuevo ticket recibido:', ticket);
      toast.success(`🎟️ Nuevo ticket en ${ticket.building} creado por ${ticket.created_by}`);
      }
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
      toast.success(`Nueva reserva en ${reservation.building} (${reservation.classroom})`);
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
            <Route path='/registro' element={<Registro />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path='/crud' element={<Crud />} />
            <Route path="/login" element={<Login />} />
            <Route path="/configuracion" element={<AccountConfig />} />
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
    </>
  );
}
