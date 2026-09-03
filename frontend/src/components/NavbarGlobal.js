import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './interfaz_calendar/calendar.css';
import { toast } from 'react-toastify';
import LoginLogoutButton from './LoginLogoutButton';
import AccountConfigButton from './AccountConfigButton';
import ReloadPage from './ReloadPage';
import CreditsButton from './CreditsButton';

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

  const normalizePath = (s) => {
    const cleaned = (s || '/').replace(/\/+$/, '');
    return cleaned === '' ? '/' : cleaned;
  };

  const isActive = (target) => {
    const cur = normalizePath(location.pathname);
    const base = normalizePath(target);
    return cur === base || cur.startsWith(base + '/');
  };

  return (
    <>
      <nav className="navbar flex items-center justify-between px-6 bg-white shadow relative">
        
        {/* Logo TRACS a la izquierda */}
        <div className="flex items-center flex-shrink-0">
          <Link to={linkTarget} className="navbar-brand">TRACS</Link>
        </div>

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
          <div className="md:hidden flex items-center gap-4">
            <CreditsButton />
            <LoginLogoutButton
              isLoggedIn={false}
              handleLogout={handleLogout}
              handleLoginRedirect={handleLoginRedirect}
            />
          </div>
        )}

        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
          {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
            <div className="flex gap-6">
              <Link to="/calendar" className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}>Calendario</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reports" className={`nav-link ${isActive('/reports') ? 'active' : ''}`}>Reportes</Link>
              )}
              {userRole === 'superuser' && (
                <Link to="/crud" className={`nav-link ${isActive('/crud') ? 'active' : ''}`}>CRUD</Link>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-shrink-0 items-center">
          <ReloadPage/>

          <CreditsButton />
          
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
            {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
              <>
                <div className="menu-row">
                  <Link to="/calendar" className={`nav-link ${isActive('/calendar') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    Calendario
                  </Link>

                  <LoginLogoutButton
                    isLoggedIn={isLoggedIn}
                    handleLogout={() => { handleLogout(); setMenuOpen(false); }}
                    handleLoginRedirect={() => { handleLoginRedirect(); setMenuOpen(false); }}
                  />
                </div>
                {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                  <Link to="/reports" className={`nav-link ${isActive('/reports') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    Reportes
                  </Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/crud" className={`nav-link ${isActive('/crud') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    CRUD
                  </Link>
                )}
                {userRole === 'superuser' && (
                  <Link to="/config" className={`nav-link ${isActive('/config') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    Configuración
                  </Link>
                )}

                <CreditsButton variant="navLink" onClickCallback={() => setMenuOpen(false)} />
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