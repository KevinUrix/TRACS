import { useState} from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS
import { toast } from 'react-toastify';
import LoginLogoutButton from './LoginLogoutButton';
import AccountConfigButton from './AccountConfigButton';

export default function NavbarGlobal({ isLoggedIn, setIsLoggedIn, userRole, setUserRole}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const linkTarget = isLoggedIn ? '/calendar' : '/';

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    toast.success('Se ha cerrado la sesión.');
    navigate('/calendar');
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar flex items-center justify-between px-6 bg-white shadow relative">
        {/* Logo TRACS a la izquierda */}
        <div className="flex items-center flex-shrink-0">
          <Link to={linkTarget} className="navbar-brand">TRACS</Link>
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
        <div className="mr-15 hidden md:flex flex-1 justify-center items-center gap-8">
          {/* Links centrados */}
          {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
            <div className="flex gap-6">
              <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}>Calendario</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>Reportes</Link>
              )}
              {userRole === 'superuser' && (
                <Link to="/crud" className={`nav-link ${location.pathname === '/crud' ? 'active' : ''}`}>CRUD</Link>
              )}
            </div>
          )}
        </div>

        {/* Botón login/logout a la derecha extrema (oculto en móvil) */}
        <div className="hidden md:flex flex-shrink-0 items-center">
          {isLoggedIn && <AccountConfigButton className="hidden md:flex" />}

          <LoginLogoutButton
            isLoggedIn={isLoggedIn}
            handleLogout={handleLogout}
            handleLoginRedirect={handleLoginRedirect}
          />
        </div>


        {/* Menú hamburguesa desplegado en móvil */}
        {menuOpen && (
          <div className="mobile-menu background-Selects">
            {/* Links y botón logout/login */}
            {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
              <>
                <div className="menu-row">
                  <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    Calendario
                  </Link>

                  <LoginLogoutButton
                    isLoggedIn={isLoggedIn}
                    handleLogout={() => { handleLogout(); setMenuOpen(false); }}
                    handleLoginRedirect={() => { handleLoginRedirect(); setMenuOpen(false); }}
                  />
                </div>
                {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                  <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Reportes</Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/crud" className={`nav-link ${location.pathname === '/crud' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>CRUD</Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/config" className={`nav-link ${location.pathname === '/config' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Configuración</Link>
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
