import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, onToggleSidebar }) {
  const userRole = localStorage.getItem("role"); // Para obtener el rol de la cuenta.

  return (
    <div
      className={`w-64 bg-blue-600 text-white h-screen p-4 transition-transform transform fixed top-16 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <ul>
        <li className="p-2 hover:bg-blue-500 cursor-pointer">
          <Link to="/calendario" className="block w-full h-full">Inicio</Link>
        </li>
        {(userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') && (
        <li className="p-2 hover:bg-blue-500 cursor-pointer">
          <Link to="/reportes" className="block w-full h-full">Reportes</Link>
        </li>
        )}
        {(userRole === 'superuser') && (
        <li className="p-2 hover:bg-blue-500 cursor-pointer">
          <Link to="/crud" className="block w-full h-full">CRUD</Link>
        </li>
        )}
        {(userRole === 'superuser') && (
        <li className="p-2 hover:bg-blue-500 cursor-pointer">
          <span className="block w-full h-full">Configuración</span>
        </li>
        )}
      </ul>
    </div>
  );
}
