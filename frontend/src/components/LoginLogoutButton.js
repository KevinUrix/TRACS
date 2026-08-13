import { useState, useEffect } from 'react';
import './interfaz_calendar/calendar.css';

const LoginLogoutButton = ({ isLoggedIn, handleLogout, handleLoginRedirect }) => {
  const [scaleFix, setScaleFix] = useState(1);

  useEffect(() => {
    const adjustScale = () => {
      const zoomLevel = window.devicePixelRatio || 1;
      setScaleFix(zoomLevel < 1 ? 1 / zoomLevel : 1);
    };
    adjustScale();
    window.addEventListener('resize', adjustScale);
    return () => window.removeEventListener('resize', adjustScale);
  }, []);

  const handleClick = () => {
    if (isLoggedIn) {
      const confirmLogout = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirmLogout) {
        handleLogout();
      }
    } else {
      handleLoginRedirect();
    }
  };

  const dynamicTop = scaleFix > 1.3 ? 'top-8' : 'top-0';

  return (
    <button
      onClick={handleClick}
      className="logout-button flex items-center justify-center gap-2 text-white transition relative group"
    >
      {isLoggedIn ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-11 h-11 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-label="Cerrar sesión"
        >
          <g transform="translate(1.2 0) scale(1.05)">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </g>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-11 h-11 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-label="Iniciar sesión"
        >
          <g transform="translate(1.2 0) scale(1.05)">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </g>
        </svg>
      )}
      
      <span 
        className={`absolute right-12 ${dynamicTop} mb-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none origin-bottom-right`}
        style={{ transform: `scale(${scaleFix})` }}
      >
        {isLoggedIn ? 'Cerrar sesión.' : 'Iniciar sesión.'}
      </span>
    </button>
  );
};

export default LoginLogoutButton;