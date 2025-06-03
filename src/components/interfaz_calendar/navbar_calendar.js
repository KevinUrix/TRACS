import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorSchedule from './professorSchedule';
import './calendar.css'; // Importa el archivo de estilos CSS
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';


export default function Navbar({selectedCycle, selectedBuilding, selectedDay}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userRole = localStorage.getItem("role");

  const location = useLocation();

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
    sessionStorage.setItem('reservationState', JSON.stringify({
      selectedCycle,
      selectedBuilding,
      selectedDay,
    }));
    navigate('/login');
  };

  const handleSearch = async () => {
    if (!selectedBuilding || !selectedCycle) {
      toast.error('Debes seleccionar un ciclo y un edificio para realizar la búsqueda.');
      return;
    }
    if (!searchTerm.trim()) {
      setFilteredSchedule([]);
      setShowPopup(false);
      return;
    }
  
    try {
      if (!selectedCycle) {
        alert("Seleccione un ciclo para realizar una búsqueda.");
        return;
      }
      const response = await fetch(`/api/search?name=${encodeURIComponent(searchTerm)}&cycle=${selectedCycle}&buildingName=${encodeURIComponent(selectedBuilding)}&day=${encodeURIComponent(selectedDay)}`);

      if (!response.ok) {
        if (response.status === 400) {
          console.warn(`Error de parámetros: ${response.error}`);
          alert('Error de parámetros. Ingrese un valor valido para la busqueda.')
        } else {
          console.error(`Error del servidor: ${response.error}`);
        }
        setFilteredSchedule([]);
        setShowPopup(false);
        return;
      }

      const data = await response.json();
  
      if (data.length > 0) {
        setFilteredSchedule(data);
        setShowPopup(true);
      } else {
        setFilteredSchedule([]);
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error al buscar el profesor:", error);
      setFilteredSchedule([]);
      setShowPopup(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">Quill</Link>
        <div className='navbar-container'>
          {(userRole === 'superuser' || userRole === 'user' || userRole  === 'tecnico') && (
            <div className="nav-links">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Inicio</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reportes" className="nav-link">Reportes</Link>
              )}
              {(userRole === 'superuser') && (
                <Link to="/crud" className="nav-link">CRUD</Link>
              )}
            </div>
          )}
        </div>
          <div className="search-container flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar maestro..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="search-button p-2 rounded bg-[#1e293b] hover:bg-[#506d9d] text-white"
              title="Buscar"
            >
              <img
                src="/lupa.webp"
                alt="Buscar"
                className="w-8 h-8"
              />
            </button>
          </div>
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

      {/* Popup de horarios */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content relative p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowPopup(false)}>✖</button>
            <ProfessorSchedule professorSchedule={filteredSchedule} selectedCycle={selectedCycle}/>
          </div>
        </div>
      )}
    </>
  );
}