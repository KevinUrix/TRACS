import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../interfaz_reports/reports.css';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import LoginLogoutButton from '../LoginLogoutButton';

export default function NavbarCrud({}) {
  const navigate = useNavigate();
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
    navigate('/login');
  };

  return (
    <nav className="navbar-reports">
      <Link to="/" className="navbar-brand-reports">Quill</Link>
      <div className='navbar-container-reports'>
        {(userRole === 'superuser' || userRole === 'user' || userRole  === 'tecnico') && (
            <div className="nav-reports-links">
              <Link to="/" className="nav-reports-link">Inicio</Link>
              {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
                <Link to="/reportes" className="nav-reports-link">Reportes</Link>
              )}
              {(userRole === 'superuser') && (
                <Link to="/crud" className={`nav-reports-link ${location.pathname === '/crud' ? 'active' : ''}`}>CRUD</Link>
              )}
            </div>
          )}
      </div>
        <LoginLogoutButton
                isLoggedIn={isLoggedIn}
                handleLogout={handleLogout}
                handleLoginRedirect={handleLoginRedirect}
              />
    </nav>
  );
}
