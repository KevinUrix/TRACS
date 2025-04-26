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
  const [reservations, setReservations] = useState([]);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const hours = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    return `${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });

  const fetchReservations = async () => {
    if (!selectedCycle || !selectedBuilding) return;
  
    const path = `/api/reservations?cycle=${selectedCycle}&buildingName=${selectedBuilding}`;
  
    try {
      const response = await fetch(path);
    
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`No hay reservas guardadas para ${selectedBuilding} en el ciclo ${selectedCycle}.`);
        } else if (response.status === 400) {
          console.warn(`Error de parámetros: ${response.error}`);
        } else {
          console.error(`Error del servidor: ${response.error}`);
        }
    
        setReservations([]);
        return;
      }
    
      const json = await response.json();
      setReservations(json.data || []);
    } catch (err) {
      console.error("Error de red o formato:", err);
      setReservations([]);
    }  
  };


  const handleSaveReservation = async (reservationData) => {
    console.log('Reserva guardada:', reservationData);
  
    try {
      const response = await fetch(`/api/reservations?cycle=${selectedCycle}&buildingName=${selectedBuilding}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });
  
      if (!response.ok) throw new Error('Error al guardar la reserva');
      alert('Reserva guardada con éxito');
      fetchReservations();
    } catch (error) {
      console.error(error);
      alert('Hubo un problema al guardar la reserva');
    }
  };
  
  
  useEffect(() => {
    if (selectedBuilding) {
      // Nombre del JSON dinámico según el edificio seleccionado
      const buildingFile = `/api/classrooms?buildingName=${selectedBuilding}`;
  
      fetch(buildingFile)
        .then(response => response.json())
        .then(data => setClassrooms(data))
        .catch(error => console.error("Error cargando los salones:", error));
    }
  }, [selectedBuilding]);


  useEffect(() => {
    if (!selectedCycle || !selectedBuilding) return;
  
    const cacheKey = `schedule_${selectedCycle}_${selectedBuilding}`;
  
    const loadLocalSchedule = async () => {
      try {
        const localResponse = await fetch(`/api/local-schedule?cycle=${selectedCycle}&buildingName=${selectedBuilding}`);
        if (!localResponse.ok) throw new Error(`Archivo local no encontrado: ${localResponse.status}`);
  
        const localData = await localResponse.json();
  
        if (Array.isArray(localData)) {
          setSchedule(localData);
          sessionStorage.setItem(cacheKey, JSON.stringify(localData));
          console.warn("Horario cargado desde archivo local.");
        } else {
          console.error("El archivo local no contiene un array válido:", localData);
        }
      } catch (error) {
        console.error("Error al cargar archivo local de respaldo:", error);
        setSchedule([]);
      }
    };
  
    const fetchSchedule = async () => {
      // Intentar obtener del caché
      const cachedSchedule = sessionStorage.getItem(cacheKey);
  
      if (cachedSchedule) {
        try {
          const cachedData = JSON.parse(cachedSchedule);
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            console.log("Usando caché para el horario");
            setSchedule(cachedData);
            return;
          } else {
            console.warn("El caché está vacío o no es un array, recargando datos...");
          }
        } catch (error) {
          console.error("Error al parsear datos del caché:", error);
        }
      }
  
      // Intentar obtener desde el backend
      try {
        const response = await fetch(`/api/schedule?cycle=${selectedCycle}&buildingName=${selectedBuilding}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  
        const data = await response.json();
        const scheduleData = data[selectedBuilding];
  
        if (Array.isArray(scheduleData) && scheduleData.length > 0) {
          setSchedule(scheduleData);
          sessionStorage.setItem(cacheKey, JSON.stringify(scheduleData));
          console.log("Horario cargado desde el backend.");
        } else {
          console.warn("Respuesta vacía del backend. Cargando desde archivo local...");
          await loadLocalSchedule();
        }
      } catch (error) {
        console.error("Error al obtener datos desde el backend:", error);
        await loadLocalSchedule();
      }
    };
  
    fetchSchedule();
  }, [selectedCycle, selectedBuilding]);


    useEffect(() => {
      if (!selectedCycle || !selectedBuilding) return;
      fetchReservations();
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
              fetchReservations={fetchReservations}
              reservations={reservations}
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
                      <td className="table-cell">{hour}</td>
                      {classrooms.map((classroom, index) => {


                        // Primero buscar si hay una reserva
                        const matchingReservation = reservations.find(res => {
                          const [startTime, endTime] = res.schedule.split('-');
                          const startHour = parseInt(startTime.substring(0, 2), 10);
                          const endHour = parseInt(endTime.substring(0, 2), 10);
                          const days = res.days.split(' ');

                          const isOnDay = days.includes(selectedDay.charAt(0)); // solo usa la inicial (e.g. 'Lunes' -> 'L')
                          return (
                            currentHour >= startHour &&
                            currentHour <= endHour &&
                            res.classroom === classroom &&
                            isOnDay
                          );
                        });
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
                          :  matchingReservation
                            ? '#0a304b' // azul tailwind 500
                            : 'white';


                        return (
                          <td key={index} 
                            className={`table-cell font-semibold ${matchingReservation ? 'reserved-cell' : (matchingCourse ? `occupied-cell course-color-${(matchingCourse.data.course.length % 15) + 1}` : 'empty-cell')}`}
                            style={{ backgroundColor }}>
                            {matchingReservation ? (
                                          <>
                                            <div className="professor-name">{matchingReservation.professor}</div>
                                            <div className="course-name">{matchingReservation.course}</div>
                                            <div className="course-code">Clave: {matchingReservation.code}</div>
                                            <div className="course-date">Fecha: {matchingReservation.date}</div>
                                          </>
                                        ) : matchingCourse ? (
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
