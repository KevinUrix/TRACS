import { useState, useEffect } from 'react';
import Sidebar from '../sidebar';
import CalendarLogic from './calendarLogic';
import Navbar from './navbar_calendar'; // Importa el nuevo componente
import ReserveButton from './reserveButton';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function Calendar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [schedule, setSchedule] = useState([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const hours = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    return `${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });


  const handleSaveReservation = (reservationData) => {
    // Aquí puedes guardar la reserva en el estado o enviar los datos a un servidor
    console.log('Reserva guardada:', reservationData);
  };
  
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
    if (!selectedCycle || !selectedBuilding) return;
  
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/schedule?cycle=${selectedCycle}&buildingName=${selectedBuilding}`);

        const data = await response.json();
  
        if (data[selectedBuilding]) {
          setSchedule(data[selectedBuilding]);
        } else {
          console.error("No se encontró la clave para el edificio seleccionado.");
        }
      } catch (error) {
        console.error("Error cargando los horarios:", error);
      }
    };
  
    fetchSchedule();
  }, [selectedCycle, selectedBuilding]);
  

  return (
    <>
      <div className="calendar-container">
        <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
        <div className="main-content">
          <Navbar toggleSidebar={toggleSidebar} selectedCycle={selectedCycle} />
          <div className="select-content">
            <CalendarLogic
              onUpdateCicle={setSelectedCycle}
              onUpdateBuilding={setSelectedBuilding}
              onUpdateDay={setSelectedDay}
            />
          </div>
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

                        let hue = 0;

                        if (matchingCourse) {
                          hue = (
                            (matchingCourse.data.course.length +
                             matchingCourse.professor.length * 17 +
                             matchingCourse.data.nrc * 1) * 37
                          ) % 360;
                        
                          const forbiddenHueRanges = [
                            [45, 65],     // Amarillo
                            [66, 140],    // Verde lima
                            //[141, 169],   // Verde fuerte
                            //[170, 200],   // Aqua / Cyan
                            //[300, 345]    // Fucsia / Rosa
                          ];
                        
                          const isForbidden = (h) =>
                            forbiddenHueRanges.some(([min, max]) => h >= min && h <= max);
                        
                          while (isForbidden(hue)) {
                            hue = (hue + 31) % 360; // Desfasamos en pasos no múltiplos del rango para evitar bucles infinitos
                          }
                        }
                        
                        const backgroundColor = matchingCourse
                          ? `hsl(${hue}, 50%, 50%)` // Saturación alta y luminosidad más baja para evitar tonos pastel
                          : 'white';

                        return (
                          <td key={index} 
                            className={`table-cell ${matchingCourse ? `occupied-cell course-color-${(matchingCourse.data.course.length % 15) + 1}` : 'empty-cell'}`}
                            style={{ backgroundColor }}>
                            {matchingCourse ? (
                            <>
                              <div className="professor-name">{matchingCourse.professor}</div>
                              <div className="course-name">{matchingCourse.data.course}</div>
                              <div className="course-code">Clave: {matchingCourse.data.code}</div>
                              <div className="course-students">Alumnos: {matchingCourse.data.students}</div>
                              <div className="course-nrc">NRC: {matchingCourse.data.nrc}</div>
                            </>
                          ) : (
                            <ReserveButton
                              selectedCycle={selectedCycle}
                              selectedBuilding={selectedBuilding}
                              selectedDay={selectedDay}
                              selectedHour={hour}
                              classroom={classroom}
                              onSaveReservation={handleSaveReservation}
                            />
                          )}
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
