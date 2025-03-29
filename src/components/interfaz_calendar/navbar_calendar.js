import { useNavigate } from 'react-router-dom';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <nav className="navbar">
      <button onClick={toggleSidebar} className="sidebar-toggle">
        ☰
      </button>
      <h1 className="navbar-title">Calendario de Edificios</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar..."
          className="search-input"
        />
      </div>
      <button onClick={handleLogout} className="logout-button">
        <img src='/iniciar-sesion.png' alt="Cerrar sesión" className="w-8 h-8" />
      </button>
    </nav>
  );
}
