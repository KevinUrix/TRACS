import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../interfaz_calendar/calendar.css';
import { toast } from 'react-toastify';

export default function NavbarCrud({ toggleSidebar, selectedCycle, selectedBuilding, selectedDay }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verifica si hay sesión activa al montar el componente
  useEffect(() => {
    const role = localStorage.getItem('role');
    setIsLoggedIn(!!role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    toast.success('Se ha cerrado la sesión.');
    navigate('/');
  };

  const handleLoginRedirect = () => {
    // sessionStorage.setItem('reservationState', JSON.stringify({
    //   selectedCycle,
    //   selectedBuilding,
    //   selectedDay,
    // }));
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-reports">
      <button onClick={toggleSidebar} className="sidebar-toggle">☰</button>
      <h1 className="navbar-title">CRUD</h1>

      {isLoggedIn ? (
        <button onClick={handleLogout} className="logout-button flex items-center gap-2" title="Cerrar sesión">
          <img src="/cerrar-sesion.webp" alt="Cerrar sesión" className="w-8 h-8" />
        </button>
      ) : (
        <button onClick={handleLoginRedirect} className="logout-button flex items-center gap-2" title="Iniciar sesión">
          <img src="/iniciar-sesion.webp" alt="Iniciar sesión" className="w-8 h-8" />
        </button>
      )}
    </nav>
  );
}
