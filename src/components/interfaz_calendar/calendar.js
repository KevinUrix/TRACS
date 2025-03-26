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
      <div className="bg-gray-100 flex">
        {/* Sidebar: se pasa el estado y el manejador de eventos */}
        <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div className="flex flex-col w-full">
          <nav className="w-full bg-blue-600 p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-10">
            <button onClick={toggleSidebar} className="text-white text-2xl font-bold">☰</button>
            <h1 className="text-white text-xl font-bold">Calendario de Edificios</h1>
            <input
              type="text"
              placeholder="Buscar..."
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </nav>

          <CalendarLogic
            onUpdateCicle={setSelectedCicle}
            onUpdateBuilding={setSelectedBuilding}
            onUpdateDay={setSelectedDay}
          />

          {/*<h2 className="text-2xl font-bold my-4 text-center">
            Horario de {selectedBuilding} - {selectedDay}
          </h2>*/}

          <div className="overflow-x-auto w-full px-6">
            <table className="w-full border border-gray-300 bg-white shadow-lg">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Hora</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="border border-gray-300 px-4 py-2">Salón {i + 1}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 font-semibold">{hour}</td>
                    {Array.from({ length: 10 }, (_, i) => (
                      <td key={i} className="border border-gray-300 px-4 py-2 text-gray-700"></td>
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
