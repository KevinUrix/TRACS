import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ProfessorSchedule from '../components/interfaz_calendar/professorSchedule';
import '../components/interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS
import { toast } from 'react-toastify';
import LoginLogoutButton from './LoginLogoutButton';
import AccountConfigButton from './AccountConfigButton';

export default function NavbarGlobal({selectedCycle, selectedBuilding, selectedDay}) {
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
          {isLoggedIn && <AccountConfigButton className="hidden md:flex"/>}
          <Link to="/" className="navbar-brand">Quill</Link>
        </div>

        {/* Botón hamburguesa para pantallas pequeñas */}
        {isLoggedIn ? (
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
        ) : (
          // Mostrar botón de login directamente si no está logueado
          <div className="md:hidden">
            <LoginLogoutButton
              isLoggedIn={false}
              handleLogout={handleLogout}
              handleLoginRedirect={handleLoginRedirect}
            />
          </div>
        )}

        {/* Contenedor central y derecho - oculto en móvil */}
        <div className="mr-28 hidden md:flex flex-1 justify-center items-center gap-8">
          {/* Links centrados */}
          {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
            <div className="flex gap-6">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Inicio</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reportes" className={`nav-link ${location.pathname === '/reportes' ? 'active' : ''}`}>Reportes</Link>
              )}
              {userRole === 'superuser' && (
                <Link to="/crud" className={`nav-link ${location.pathname === '/crud' ? 'active' : ''}`}>CRUD</Link>
              )}
            </div>
          )}
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
                  <Link to="/reportes" className={`nav-link ${location.pathname === '/reportes' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Reportes</Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/crud" className={`nav-link ${location.pathname === '/crud' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>CRUD</Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/configuracion" className={`nav-link ${location.pathname === '/configuracion' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Configuración</Link>
                )}
              </>
            )}
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
        )}
      </nav>
    </>
  );
}
