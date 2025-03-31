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
  const [schedule, setSchedule] = useState([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const hours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });


  useEffect(() => {
    if (selectedBuilding) {
      // Nombre del JSON dinámico según el edificio seleccionado
      const buildingFile = `data/classrooms/${selectedBuilding}.json`;
  
      fetch(buildingFile)
        .then(response => response.json())
        .then(data => setClassrooms(data))
        .catch(error => console.error("Error cargando los salones:", error));
    }
  }, [selectedBuilding]);


  useEffect(() => {
    const buildingFile = `data/buildings/${selectedBuilding}.json`;

    fetch(buildingFile)
      .then(response => response.json())
      .then(data => {
        if (data[selectedBuilding]) {
          setSchedule(data[selectedBuilding]);
        } else {
          console.error("No se encontró la clave para el edificio seleccionado.");
        }
      })
      .catch(error => console.error("Error cargando los horarios:", error));
  }, [selectedBuilding]);

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
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => {
                  // Convertir la hora de la tabla a formato de 24 horas
                  const [hourPart, period] = hour.split(' ');
                  let currentHour = parseInt(hourPart.split(':')[0], 10);

                  if (period === 'PM' && currentHour !== 12) currentHour += 12;
                  if (period === 'AM' && currentHour === 12) currentHour = 0;

                  return (
                    <tr key={hour} className="table-row">
                      <td className="table-cell font-semibold">{hour}</td>
                      {classrooms.map((classroom, index) => {
                        // Filtrar cursos según el día seleccionado
                        const matchingCourse = schedule.find(scheduleItem => {
                          const [startTime, endTime] = scheduleItem.data.schedule.split('-');
                          const startHour = parseInt(startTime.substring(0, 2), 10);
                          const endHour = parseInt(endTime.substring(0, 2), 10);

                          // Verificar si el curso está en el día seleccionado
                          const days = scheduleItem.data.days.split(' ');
                          const isCourseOnSelectedDay = days.includes(selectedDay); 

                          return (
                            currentHour >= startHour &&
                            currentHour <= endHour &&
                            scheduleItem.data.classroom === classroom &&
                            isCourseOnSelectedDay
                          );
                        });

                        const backgroundColor = matchingCourse
                        ? `hsl(${(matchingCourse.data.course.length * 37) % 360}, 80%, 75%)`
                        : 'white';

                        return (
                          <td key={index} 
                          className={`table-cell ${matchingCourse ? 'occupied-cell' : ''}`}
                          style={{ backgroundColor }}>
                            {matchingCourse ? matchingCourse.data.course : ""}
                            <br/>
                            {matchingCourse ? matchingCourse.professor : ""}
                            <br/>
                            {matchingCourse ? `Aula: ${matchingCourse.data.classroom}` : ""}
                            <br/>
                            {matchingCourse ? `Horario: ${matchingCourse.data.schedule.replace(
                              /(\d{2})(\d{2})-(\d{2})(\d{2})/, "$1:$2-$3:$4")}`: ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
