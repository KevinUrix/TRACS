import { useNavigate } from 'react-router-dom';
import '../interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS

export default function NavbarReports({ toggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <nav className="navbar navbar-reports"> {/* Agrega la clase navbar-reports */}
      <button onClick={toggleSidebar} className="sidebar-toggle">
        ☰
      </button>
      <h1 className="navbar-title">Reportes / tickets</h1>
      <button onClick={handleLogout} className="logout-button">
        <img src='/iniciar-sesion.png' alt="Cerrar sesión" className="w-8 h-8" />
      </button>
    </nav>
  );
}
