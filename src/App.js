import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Calendar from './components/interfaz_calendar/calendar';  // Importamos Calendar
import Reports from './components/interfaz_reports/reports';    // Importamos Reports

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Función para mostrar/ocultar la barra lateral
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
    <head>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
    </head>
    <Router>
      <div className="bg-gray-100 flex">

        {/* Contenido principal */}
        <div className="flex flex-col w-full">
          {/* Rutas */}
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/reportes" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </Router>
  </>
  );
}
