import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Calendar from './components/interfaz_calendar/calendar';  // Importamos Calendar
import Reports from './components/interfaz_reports/reports';    // Importamos Reports
import Login from './components/interfaz_login/login';
import Registro from './components/interfaz_login/registro';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Función para mostrar/ocultar la barra lateral
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
    <head>
    </head>
    <Router>
      <div className="bg-gray-100 flex">

        {/* Contenido principal */}
        <div className="flex flex-col w-full">
          {/* Rutas */}
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/registro' element={<Registro />}/>
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/reportes" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </Router>
  </>
  );
}
