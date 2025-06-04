import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './reports.css'; // Importa el archivo de estilos CSS
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import LoginLogoutButton from '../LoginLogoutButton';

export default function NavbarReports({}) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userRole = localStorage.getItem("role");
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
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
                <Link to="/" className="nav-link">Inicio</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reportes" className={`nav-link ${location.pathname === '/reportes' ? 'active' : ''}`}>Reportes</Link>
              )}
              {userRole === 'superuser' && (
                <Link to="/crud" className="nav-link">CRUD</Link>
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
                  <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
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
                  <Link to="/crud" className="nav-link" onClick={() => setMenuOpen(false)}>CRUD</Link>
                )}
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
