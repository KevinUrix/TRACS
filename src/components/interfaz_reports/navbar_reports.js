import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS
import { toast } from 'react-toastify';


export default function NavbarReports({ toggleSidebar }) {
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
      navigate('/login');
    };

  return (
    <nav className="navbar navbar-reports"> {/* Agrega la clase navbar-reports */}
      <button onClick={toggleSidebar} className="sidebar-toggle">
        ☰
      </button>
      <h1 className="navbar-title">Reportes / tickets</h1>

      {isLoggedIn ? (
        <button onClick={handleLogout} className="logout-button flex items-center gap-2" title="Cerrar sesión">
          <img src="/cerrar-sesion.png" alt="Cerrar sesión" className="w-8 h-8" />
        </button>
      ) : (
        <button onClick={handleLoginRedirect} className="logout-button flex items-center gap-2" title="Iniciar sesión">
          <img src="/iniciar-sesion.png" alt="Iniciar sesión" className="w-8 h-8" />
        </button>
      )}
    </nav>
  );
}
