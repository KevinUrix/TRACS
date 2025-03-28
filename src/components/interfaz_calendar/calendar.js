import { useState } from 'react';
import Sidebar from '../sidebar';
import CalendarLogic from './calendarLogic';

export default function Calendar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCicle, setSelectedCicle] = useState('Cicle 1');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedBuilding, setSelectedBuilding] = useState('Edificio 1');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const hours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });

  return (
    <>
      <div className="calendar-container">
        {/* Sidebar: se pasa el estado y el manejador de eventos */}
        <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div className="main-content">
          <nav className="navbar">
            <button onClick={toggleSidebar} className="sidebar-toggle">
              ☰
            </button>
            <h1 className="navbar-title">Calendario de Edificios</h1>
            <input
              type="text"
              placeholder="Buscar..."
              className="search-input"
            />
          </nav>

          <CalendarLogic
            onUpdateCicle={setSelectedCicle}
            onUpdateBuilding={setSelectedBuilding}
            onUpdateDay={setSelectedDay}
          />

          <div className="table-container">
            <table className="schedule-table">
              <thead>
                <tr className="table-header">
                  <th className="table-cell">Hora</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="table-cell">Salón {i + 1}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="table-row">
                    <td className="table-cell font-semibold">{hour}</td>
                    {Array.from({ length: 10 }, (_, i) => (
                      <td key={i} className="table-cell text-gray-700"></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
