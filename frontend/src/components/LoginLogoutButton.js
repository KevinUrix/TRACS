// src/components/LoginLogoutButton.jsx
import React from 'react';
import './interfaz_calendar/calendar.css';

const LoginLogoutButton = ({ isLoggedIn, handleLogout, handleLoginRedirect }) => {
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

  return (
    <button
      onClick={handleClick}
      className="logout-button flex items-center gap-2"
      title={isLoggedIn ? 'Cerrar sesión' : 'Iniciar sesión'}
    >
      <img
        src={isLoggedIn ? '/cerrar-sesion.svg' : '/iniciar-sesion.svg'}
        alt={isLoggedIn ? 'Cerrar sesión' : 'Iniciar sesión'}
        className="w-10 h-10"
      />
    </button>
  );
};

export default LoginLogoutButton;
