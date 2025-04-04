import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorSchedule from './profesorSchedule';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function Navbar({ toggleSidebar, schedule }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredSchedule([]);
      setShowPopup(false);
      return;
    }

    const filtered = schedule.filter((item) =>
      item.professor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredSchedule(filtered);
    setShowPopup(filtered.length > 0);
  };

  return (
    <>
      <nav className="navbar">
        <button onClick={toggleSidebar} className="sidebar-toggle">☰</button>
        <h1 className="navbar-title">Calendario de Edificios</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar maestro..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleLogout} className="logout-button">
          <img src="/iniciar-sesion.png" alt="Cerrar sesión" className="w-8 h-8" />
        </button>
      </nav>

      {/* Popup de horarios */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowPopup(false)}>✖</button>
            <ProfessorSchedule professorSchedule={filteredSchedule} />
          </div>
        </div>
      )}
    </>
  );
}
