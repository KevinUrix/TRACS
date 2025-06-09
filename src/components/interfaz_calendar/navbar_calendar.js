import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProfessorSchedule from './professorSchedule';
import '../interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS
import { toast } from 'react-toastify';
import LoginLogoutButton from '../LoginLogoutButton';

export default function Navbar({selectedCycle, selectedBuilding, selectedDay}) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userRole = localStorage.getItem("role");
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoadingPopup, setIsLoadingPopup] = useState(false);


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
      setIsLoadingPopup(true);
      
      const response = await fetch(`/api/search?name=${encodeURIComponent(searchTerm)}&cycle=${selectedCycle}&buildingName=${encodeURIComponent(selectedBuilding)}&day=${encodeURIComponent(selectedDay)}`);

      setIsLoadingPopup(false);

      if (!response.ok) {
        if (response.status === 400) {
          alert('Error de parámetros. Ingrese un valor válido para la búsqueda.');
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
      setIsLoadingPopup(false);
      setShowPopup(false);
    }
  };

  return (
    <>
      <nav className="navbar flex items-center justify-between px-6 bg-white shadow relative">
        {/* Logo Quill a la izquierda */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="navbar-brand">Quill</Link>
        </div>

        {/* Botón hamburguesa para pantallas pequeñas */}
        <button
          className="hamburger md:hidden focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        {/* Contenedor central y derecho - oculto en móvil */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-8">
          {/* Links centrados */}
          {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
            <div className="flex gap-6">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Inicio</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reportes" className="nav-link">Reportes</Link>
              )}
              {userRole === 'superuser' && (
                <Link to="/crud" className="nav-link">CRUD</Link>
              )}
            </div>
          )}

          {/* Buscador justo a la derecha de los links */}
        <div className="search-container">
            <input
              type="text"
              placeholder="Buscar maestro..."
              className="search-input px-3 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="search-button ml-2 p-2 rounded bg-[#1e293b] hover:bg-[#506d9d] text-black"
              title="Buscar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </button>
        </div>

        </div>

        {/* Botón login/logout a la derecha extrema (oculto en móvil) */}
        <div className="hidden md:flex flex-shrink-0">
          <LoginLogoutButton
            isLoggedIn={isLoggedIn}
            handleLogout={handleLogout}
            handleLoginRedirect={handleLoginRedirect}
          />
        </div>

        {/* Menú hamburguesa desplegado en móvil */}
        {menuOpen && (
          <div className="mobile-menu">
            {/* Links y botón logout/login */}
            {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
              <>
                <div className="menu-row">
                  <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    Inicio
                  </Link>

                  <LoginLogoutButton
                    isLoggedIn={isLoggedIn}
                    handleLogout={() => { handleLogout(); setMenuOpen(false); }}
                    handleLoginRedirect={() => { handleLoginRedirect(); setMenuOpen(false); }}
                  />
                </div>
                {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                  <Link to="/reportes" className="nav-link" onClick={() => setMenuOpen(false)}>Reportes</Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/crud" className="nav-link" onClick={() => setMenuOpen(false)}>CRUD</Link>
                )}
              </>
            )}

            {/* Input y botón búsqueda en menú vertical */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Buscar maestro..."
                className="search-input flex-grow px-3 border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (handleSearch(), setMenuOpen(false))}
              />
               <button
                  onClick={handleSearch}
                  className="search-button ml-2 p-2 rounded bg-[#1e293b] hover:bg-[#506d9d] text-black"
                  title="Buscar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                    />
                  </svg>
                </button>
                {!isLoggedIn && (
                  <div className="flex gap-6 pl-16">
                    <LoginLogoutButton
                      isLoggedIn={isLoggedIn}
                      handleLogout={() => { handleLogout(); setMenuOpen(false); }}
                      handleLoginRedirect={() => { handleLoginRedirect(); setMenuOpen(false); }}
                    />
                  </div>
                )}
            </div>
          </div>
        )}
      </nav>

      {/* Popup de horarios */}
      {(isLoadingPopup || showPopup) && (
        <div className="popup-overlay" onClick={() => {if (!isLoadingPopup) setShowPopup(false);}}>
          <div className="popup-content relative p-6 bg-white border border-gray-300 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            {isLoadingPopup ? (
              <p className="text-lg font-semibold text-center">Espere un momento . . . ⏳</p>
            ) : (
              <>
                <button className="close-popup" onClick={() => setShowPopup(false)}>✖</button>
                <ProfessorSchedule professorSchedule={filteredSchedule} selectedCycle={selectedCycle} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
