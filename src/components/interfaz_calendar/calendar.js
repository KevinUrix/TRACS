import { useState, useEffect } from 'react';
import Sidebar from '../sidebar';
import CalendarLogic from './calendarLogic';
import Navbar from './navbar_calendar'; // Importa el nuevo componente
import './calendar.css'; // Importa el archivo de estilos CSS

export default function Calendar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCicle, setSelectedCicle] = useState('Cicle 1');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedBuilding, setSelectedBuilding] = useState('Edificio 1');
  const [classrooms, setClassrooms] = useState([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const hours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });


  useEffect(() => {
    //  
    // SALONES
    // 
    // MODIFICAR ESTE FETCH SI QUIERES OBTENER OTROS SALONES
    fetch("data/classrooms/DUCT1.json")
        .then(response => response.json())
        .then(data => setClassrooms(data))
        .catch(error => console.error("Error cargando los salones:", error));
  }, []);

  return (
    <>
      <div className="calendar-container">
        <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
        <div className="main-content">
          <Navbar toggleSidebar={toggleSidebar} />
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
                  {classrooms.map((classroom, index) => (
                    <th key={index} className="table-cell">{classroom}</th>
                  ))}
                  {/* {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="table-cell">Salón {i + 1}</th>
                  ))} */}
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
