import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { pastelColors } from './utils';
import SelectsLogic from './selectsLogic';
//import Navbar from './navbar_calendar'; // Importa el nuevo componente
import NavbarGlobal from '../NavbarGlobal';
import ReserveButton2 from './reserveButton2';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function Calendar() {
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isStatisticMode, setIsStatisticMode] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [fullSchedule, setFullSchedule] = useState({});


  const renderedCells = {}; // <<< Registra qué (hora, salón) ya se pintó
  const today = new Date();
  const location = useLocation();
  const user = localStorage.getItem("username"); // Para obtener el usuario de la cuenta.

  /* ---------- OBTENER ESTADOS LUEGO DE SER REDIRIGIDO ---------- */
  useEffect(() => {
    if (location.state) {
      setSelectedCycle(location.state.selectedCycle);
      setSelectedBuilding(location.state.selectedBuilding);
      setSelectedDay(location.state.selectedDay);
    }
  }, [location.state]);

  useEffect(() => {
    const savedState = sessionStorage.getItem('reservationState');
    if (savedState) {
      const { selectedCycle, selectedBuilding, selectedDay } = JSON.parse(savedState);
  
      setSelectedCycle(selectedCycle);
      setSelectedBuilding(selectedBuilding);
      setSelectedDay(selectedDay);

      // Limpiar sessionStorage después de usarlo
      sessionStorage.removeItem('reservationState');
    }
  }, []); // Se ejecuta solo una vez cuando el componente se monta

  useEffect(() => {
    // Verifica si en la URL está el parámetro "fromGoogle"
    const params = new URLSearchParams(location.search);
    if (params.get('fromGoogle') === 'true') {
      toast.success('¡Sesión iniciada con Google! Ya puedes realizar tu reserva en Google Calendar.');
      
      // Limpia el parámetro de la URL para que no aparezca siempre
      params.delete('fromGoogle');
      window.history.replaceState({}, '', `${location.pathname}`);
    }
  }, [location]);
  

  // Obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Domingo anterior

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); // Domingo siguiente

  // Formatear a YYYY-MM-DD
  const startDateString = startOfWeek.toISOString().split('T')[0];
  const endDateString = endOfWeek.toISOString().split('T')[0];

  function isInThisWeek(dateString) {
    return dateString >= startDateString && dateString <= endDateString;
  }

  function isSameOrBeforeWeekStart(dateString) {
    return dateString <= endDateString;
  }

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
    try {
      // Verificación de autenticación, solo si se requiere Google Calendar
      if (String(reservationData.createInGoogleCalendar) === 'true') {
        console.log('>> Se decidió CREAR evento en Google Calendar');
  
        const authStatusRes = await fetch(`/api/google/status?user=${user}`);
        const authStatus = await authStatusRes.json();
  
        if (!authStatus.authenticated) {
          toast.info('Redirigiéndote para iniciar sesión en Google...', {
            autoClose: 1000,
            closeOnClick: true,
          });
          sessionStorage.setItem('reservationState', JSON.stringify({
            selectedCycle,
            selectedBuilding,
            selectedDay,
          }));
          setTimeout(() => {
            window.location.href = `http://localhost:3001/api/google/auth?user=${user}`;
          }, 1300);
          return;
        }
      } else {
        console.log('>> NO se debe crear evento en Google Calendar');
      }
  
      // Envío de reserva
      const response = await fetch(`/api/reservations?cycle=${selectedCycle}&buildingName=${selectedBuilding}&user=${user}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        if (response.status === 409) {
          alert('⚠️ Ya existe una reserva para esta fecha, horario y aula.');
        } else if (response.status === 500) {
            toast.info('Tokens invalidos.\nRedirigiéndote para iniciar sesión en Google...', {
            autoClose: 1000,
            closeOnClick: true,
          });
          sessionStorage.setItem('reservationState', JSON.stringify({
            selectedCycle,
            selectedBuilding,
            selectedDay,
          }));
          setTimeout(() => {
            window.location.href = `http://localhost:3001/api/google/reauth?user=${user}`;
          }, 1300);
        } 
        else {
          console.error('Error desde el servidor:', result.error || 'Error desconocido');
          alert(`❌ Error al guardar la reserva: ${result.error || 'Error desconocido'}`);
        }
        return;
      }
  
      console.log('>> Reserva guardada con éxito:', result);
      alert('Reserva guardada con éxito');
  
      // Refrescar reservas después del guardado
      fetchReservations();
    } catch (err) {
      console.error('Error en el proceso de guardar reserva:', err);
      alert('Ocurrió un error al guardar la reserva. Revisa la consola.');
    }
  };

  useEffect(() => {
  fetch("/api/buildings")
    .then(response => response.json())
    .then(data => {
      const buildings = data.edifp || [];
      const prioritized = buildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
      const rest = buildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");

      const newBuildingsOrder = [...prioritized, ...rest];
      setBuildings(newBuildingsOrder); // Aquí cambias
    })
    .catch(error => console.error("Error cargando los edificios:", error));
}, []);



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
        alert("PRUEBA")
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
          setSchedule([]);
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


  //
  // Fetch para obtener el número de alumnos
  //
  useEffect(() => {
  if (!selectedCycle || !isStatisticMode || !selectedBuilding) return;

  const cacheKey = `full_schedule_${selectedCycle}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      console.log("Usando caché para todos los edificios");
      setFullSchedule(parsed);
      return;
    } catch (error) {
      console.warn("Error al parsear caché de todos los edificios, recargando...");
    }
  }

  const fetchAllBuildingsSchedules = async () => {
    try {
      const buildingValues = buildings.map(b => b.value);

      const fetches = buildingValues.map(async (buildingName) => {
        const response = await fetch(`/api/schedule?cycle=${selectedCycle}&buildingName=${buildingName}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        return { buildingName, data: data[buildingName] || [] };
      });

      const results = await Promise.all(fetches);

      const allSchedules = results.reduce((acc, { buildingName, data }) => {
        acc[buildingName] = data;
        return acc;
      }, {});

      setFullSchedule(allSchedules);
      sessionStorage.setItem(cacheKey, JSON.stringify(allSchedules));
      console.log("Horario cargado y guardado en caché");

    } catch (error) {
      console.error("Error al obtener horarios para todos los edificios:", error);
      setFullSchedule({});
    }
  };

  fetchAllBuildingsSchedules();

  }, [selectedCycle, isStatisticMode, selectedBuilding, buildings]);

  useEffect(() => {
    if (isStatisticMode) {
      document.title = "Quill - Conteo de Alumnos";
    }
    else if (selectedBuilding) {
      const displayName = {
        DUCT1: "Alfa",
        DUCT2: "Beta",
        DBETA: "CISCO"
      }[selectedBuilding] || selectedBuilding;

      document.title = `Quill - ${displayName}`;
    } else {
      document.title = "Quill";
    }
  }, [isStatisticMode, selectedBuilding]);


  return (
    <>
      <div className="calendar-container">
        <div className="main-content">
          {/*<NavbarGlobal selectedCycle={selectedCycle} selectedBuilding={selectedBuilding} selectedDay={selectedDay}/>*/}
          <div className="select-content">
            <div className="bg-gray-200 rounded-lg shadow-md z-2">
              <SelectsLogic
                onUpdateCycle={setSelectedCycle}
                onUpdateBuilding={setSelectedBuilding}
                onUpdateDay={setSelectedDay}
                fetchReservations={fetchReservations}
                reservations={reservations}
                isStatisticMode={isStatisticMode}
                setIsStatisticMode={setIsStatisticMode}
              />
            </div>
          </div>
          <div className="table-container mt-1">
            <table className="schedule-table" id="schedule-table">
              <thead>
                <tr className="table-header">
                  <th className="table-cell">Hora</th>
                  {isStatisticMode
                    ? buildings.map((building, index) => (
                        <th key={index} className="table-cell">{building.value}</th>
                      ))
                    : 
                  classrooms.map((classroom, index) => (
                    <th key={index} className={`table-cell print-col-${Math.floor(index / 9)}`}>{classroom}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isStatisticMode ? (
                  hours.map((hour) => {
                    const [hourPart, period] = hour.split(' ');
                    let currentHour = parseInt(hourPart.split(':')[0], 10);
                    if (period === 'PM' && currentHour !== 12) currentHour += 12;
                    if (period === 'AM' && currentHour === 12) currentHour = 0;

                    return (
                      <tr key={`stat-${hour}`}>
                        <td className="table-cell">{hour}</td>
                        {buildings.map((building, index) => {
                          const colorClass = pastelColors[index % pastelColors.length];
                          const scheduleForBuilding = fullSchedule[building.value] || [];
                          const seen = new Set();

                          const studentCount = scheduleForBuilding.reduce((total, course) => {
                            const key = JSON.stringify(course.data);
                            if (seen.has(key)) return total;
                            seen.add(key);
                            
                            const [start, end] = course.data.schedule.split('-');
                            const startHour = parseInt(start.substring(0, 2), 10);
                            const endHour = parseInt(end.substring(0, 2), 10);
                            const courseDays = course.data.days.split(' ');
                            const isCourseOnDay = courseDays.includes(selectedDay);
                            
                            const isDuringHour = currentHour >= startHour && currentHour <= endHour;

                            if (isDuringHour && isCourseOnDay) {
                              return total + parseInt(course.data.students || 0, 10);
                            }
                            return total;
                          }, 0);

                          return (
                            <td key={building.value} className={`table-cell font-bold text-4l text-blue-600 ${colorClass}`}>
                              {studentCount}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) :
                (
                hours.map((hour) => {
                  const [hourPart, period] = hour.split(' ');
                  let currentHour = parseInt(hourPart.split(':')[0], 10);

                  if (period === 'PM' && currentHour !== 12) currentHour += 12;
                  if (period === 'AM' && currentHour === 12) currentHour = 0;

                  return (
                    <tr key={hour} className="table-row">
                      <td className="table-cell">{hour}</td>
                      
                      {classrooms.map((classroom, index) => {
                        const cellKey = `${currentHour}-${classroom}`;

                        // No renderizar si ya se pintó por rowspan
                        if (renderedCells[cellKey]) return null;

                        // Buscar si hay reserva
                        const hasClassThisHour = schedule.some(course => {
                          const [courseStart, courseEnd] = course.data.schedule.split('-');
                          const courseStartHour = parseInt(courseStart.substring(0, 2), 10);
                          const courseEndHour = parseInt(courseEnd.substring(0, 2), 10);
                          const courseDays = course.data.days.split(' ');
                          const isCourseOnSelectedDay = courseDays.includes(selectedDay);

                          return (
                            isCourseOnSelectedDay &&
                            course.data.classroom === classroom &&
                            currentHour >= courseStartHour &&
                            currentHour <= courseEndHour
                          );
                        });

                        // Buscar reservas que aplican a esta hora (sin clases)
                        const matchingReservation = !hasClassThisHour ? reservations.find(res => {
                          const [startTime, endTime] = res.schedule.split('-');
                          const startHour = parseInt(startTime.substring(0, 2), 10);
                          const endHour = parseInt(endTime.substring(0, 2), 10);
                          const days = res.days.split(' ');

                          const isOnDay = days.includes(selectedDay.charAt(0));
                          const isTemporalValid = res.duration === "Temporal" && isInThisWeek(res.date);
                          const isSiempreValid = res.duration === "Siempre" && isSameOrBeforeWeekStart(res.date);

                          return (
                            currentHour >= startHour &&
                            currentHour <= endHour &&
                            res.classroom === classroom &&
                            isOnDay &&
                            (isTemporalValid || isSiempreValid)
                          );
                        }) : null;
                        // Buscar si hay curso
                        const matchingCourse = schedule.find(scheduleItem => {
                          const [startTime, endTime] = scheduleItem.data.schedule.split('-');
                          const startHour = parseInt(startTime.substring(0, 2), 10);
                          const endHour = parseInt(endTime.substring(0, 2), 10);

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
                            [45, 65],
                            [66, 140],
                          ];
                          const isForbidden = (h) =>
                            forbiddenHueRanges.some(([min, max]) => h >= min && h <= max);

                          while (isForbidden(hue)) {
                            hue = (hue + 31) % 360;
                          }
                        }

                        const backgroundColor = matchingCourse
                          ? `hsl(${hue}, 50%, 50%)`
                          : matchingReservation && !matchingCourse
                            ? '#0a304b'
                            : 'white';

                        let rowspan = 1;
                        let showReservation = false;

                        // Solo cursos pueden tener rowspan > 1
                        if (matchingCourse) {
                          const [start, end] = matchingCourse.data.schedule.split('-');
                          const startHour = parseInt(start.substring(0, 2), 10);
                          const endHour = parseInt(end.substring(0, 2), 10);
                          rowspan = endHour - startHour + 1;

                          // Marcar horas ya renderizadas
                          for (let h = startHour; h <= endHour; h++) {
                            renderedCells[`${h}-${classroom}`] = true;
                          }
                        } else if (matchingReservation) {
                          // Para reservas, verificar que no haya clase en ninguna hora del rango
                          const [resStart, resEnd] = matchingReservation.schedule.split('-');
                          const resStartHour = parseInt(resStart.substring(0, 2), 10);
                          const resEndHour = parseInt(resEnd.substring(0, 2), 10);
                          
                          // Verificar que no haya clases en todo el rango de la reserva
                          const hasAnyClassInRange = schedule.some(course => {
                            const [courseStart, courseEnd] = course.data.schedule.split('-');
                            const courseStartHour = parseInt(courseStart.substring(0, 2), 10);
                            const courseEndHour = parseInt(courseEnd.substring(0, 2), 10);
                            const courseDays = course.data.days.split(' ');
                            const isCourseOnSelectedDay = courseDays.includes(selectedDay);

                            return (
                              isCourseOnSelectedDay &&
                              course.data.classroom === classroom &&
                              ((courseStartHour >= resStartHour && courseStartHour <= resEndHour) ||
                              (courseEndHour >= resStartHour && courseEndHour <= resEndHour) ||
                              (resStartHour >= courseStartHour && resEndHour <= courseEndHour))
                            );
                          });

                          showReservation = !hasAnyClassInRange;
                        }

                        return (

                          <td
                            key={index}
                            className={`table-cell font-semibold ${
                              showReservation ? 'reserved-cell' : (
                                matchingCourse ? `occupied-cell course-color-${(matchingCourse.data.course.length % 15) + 1}` : 'empty-cell'
                              )}`}
                            style={{ backgroundColor: matchingCourse ? `hsl(${hue}, 50%, 50%)` : showReservation ? '#0a304b' : 'white' }}
                            rowSpan={rowspan}
                          >
                            {showReservation ? (
                              <>
                                <div className="professor-name">{matchingReservation.professor}</div>
                                <div className="course-name">{matchingReservation.code} {matchingReservation.course}</div>
                                <div className="course-date">Fecha: {matchingReservation.date}</div>
                              </>
                            ) : matchingCourse ? (
                              <>
                                <div className="professor-name">{matchingCourse.professor}</div>
                                <div className="course-name">{matchingCourse.data.code} {matchingCourse.data.course}</div>
                                <div className="course-students">Alumnos: {matchingCourse.data.students}</div>
                              </>
                            ) : (
                              <ReserveButton2
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
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
