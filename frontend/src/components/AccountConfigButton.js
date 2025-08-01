// src/components/AccountConfigButton.js
import { useNavigate, useLocation } from 'react-router-dom';

import './interfaz_calendar/calendar.css';

export default function AccountConfigButton({ className = '' }) {

  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (location.pathname === '/config') {
      navigate('/calendar');
    } else {
      navigate('/config');
    }
  };

  const isInConfig = location.pathname === '/config';
  
  return (
    <button
      onClick={handleClick}
      className={`config-button mt-1 mr-7 text-white transition ${className}`}
      title={isInConfig ? "Ir a inicio" : "Configuración de cuenta"}
    >
      {isInConfig ? (
        // Ícono de inicio 🏠
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 26 26"
          stroke="currentColor"
          strokeWidth={2.3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9.75L12 3l9 6.75M4.5 10.5V21h15V10.5"
          />
        </svg>
      ) : (
        // Ícono de configuración ⚙️
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.516.947 1.724 1.724 0 012.296.488c.33.456.453 1.036.326 1.586a1.724 1.724 0 00.947 2.516c.921.3.921 1.603 0 1.902a1.724 1.724 0 00-.947 2.516 1.724 1.724 0 01-.326 1.586 1.724 1.724 0 01-2.296.488 1.724 1.724 0 00-2.516.947c-.3.921-1.603.921-1.902 0a1.724 1.724 0 00-2.516-.947 1.724 1.724 0 01-2.296-.488 1.724 1.724 0 01-.326-1.586 1.724 1.724 0 00-.947-2.516c-.921-.3-.921-1.603 0-1.902a1.724 1.724 0 00.947-2.516 1.724 1.724 0 01.326-1.586 1.724 1.724 0 012.296-.488 1.724 1.724 0 002.516-.947z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
}
