import { getDecodedToken } from '../../utils/auth';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { pastelColors } from './utils';
import API_URL from '../../config/api';
import SelectsLogic from './selectsLogic';
import ReserveButton from './reserveButton';
import './calendar.css'; 

export default function Calendar() {
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isStatisticMode, setIsStatisticMode] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [fullSchedule, setFullSchedule] = useState({});
  const [isRestored, setIsRestored] = useState(false);
  
  const cellColorMapRef = useRef({});
  const renderedCells = {}; 
  const today = new Date();
  const decoded = getDecodedToken();
  const user = decoded?.username ?? null;

  /* ---------- LIMPIAR COLORES ---------- */
  useEffect(() => {
    cellColorMapRef.current = {};
  }, []);

  /* ---------- LIMPIEZA DE SESSION STORAGE ---------- */
  useEffect(() => {
    const handleRefresh = () => {
      const existingKeys = Object.keys(sessionStorage).filter(key => key.startsWith("full_schedule_"));
      existingKeys.forEach(key => sessionStorage.removeItem(key));
      
      sessionStorage.removeItem('cached_cycles');
    };

    window.addEventListener('beforeunload', handleRefresh);

    return () => {
      window.removeEventListener('beforeunload', handleRefresh);
    };
  }, []);

  /* ---------- RECUPERACIÓN DE ESTADO ---------- */
  useEffect(() => {
    const savedState = sessionStorage.getItem('reservationState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setSelectedCycle(parsed.selectedCycle);
      setSelectedBuilding(parsed.selectedBuilding);
    }
    setIsRestored(true); 
  }, []);

  /* ---------- GUARDADO DE ESTADO ---------- */
  useEffect(() => {
    if (selectedCycle && selectedBuilding) {
      sessionStorage.setItem('reservationState', JSON.stringify({
        selectedCycle,
        selectedBuilding,
      }));
    }
  }, [selectedCycle, selectedBuilding]);
  
  const saveReservationState = () => {
    if (selectedCycle && selectedBuilding) {
      sessionStorage.setItem('reservationState', JSON.stringify({ selectedCycle, selectedBuilding }));
    }
  };

  /* ---------- LÓGICA DE FECHAS ---------- */
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); 

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); 

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

  /* ---------- CARGA DE EDIFICIOS ---------- */
  useEffect(() => {
    fetch(`${API_URL}/api/buildings`)
      .then(response => response.json())
      .then(data => {
        const buildingsData = data.edifp || [];
        const filteredBuildings = buildingsData.filter(b => b.value !== "DESV1" && b.value !== "DESV2");
        const prioritized = filteredBuildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = filteredBuildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");

        setBuildings([...prioritized, ...rest]); 
      })
      .catch(error => {
        toast.error("Se ha detectado un error en el servidor.");
      });
  }, []);

  /* ---------- CARGA DE SALONES ---------- */
  useEffect(() => {
    if (selectedBuilding) {
      fetch(`${API_URL}/api/classrooms?buildingName=${selectedBuilding}`)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then(data => {
          const normalized = Array.isArray(data)
            ? data.map(item => typeof item === 'string' ? { name: item, capacity: null } : item)
            : [];
          setClassrooms(normalized.map(x => x.name));
          const capMap = {};
          for (const x of normalized) capMap[x.name] = x.capacity ?? null;
          setCapacities(capMap);
        })
        .catch(error => {
          toast.error("No se encontraron salones. Por favor, reinicia la página.");
        });
    }
  }, [selectedBuilding]);

  /* ---------- CARGA DE RESERVAS ---------- */
  const fetchReservations = async () => {
    if (!selectedCycle || !selectedBuilding) return;
    try {
      const response = await fetch(`${API_URL}/api/reservations?cycle=${selectedCycle}&buildingName=${selectedBuilding}`);
      if (!response.ok) {
        setReservations([]);
        return;
      }
      const json = await response.json();
      setReservations(json.data || []);
    } catch (err) {
      setReservations([]);
    }  
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedCycle, selectedBuilding]);


  /* ---------- CARGA DE HORARIOS ---------- */
  useEffect(() => {
    if (!selectedCycle) return; 

    setFullSchedule({});

    const cacheKey = `full_schedule_${selectedCycle}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (Object.keys(parsedCache).length > 0) {
          setFullSchedule(parsedCache);
          console.log("Horario recuperado instantáneamente desde sessionStorage.");
          return;
        }
      } catch (e) {
        console.warn("Caché corrupto, descargando nuevamente...");
      }
    }

    const fetchGlobalSchedule = async () => {
      try {
        const response = await fetch(`${API_URL}/api/schedule?cycle=${selectedCycle}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const result = await response.json();
        const globalData = result.data || result; 

        setFullSchedule(globalData);

        sessionStorage.setItem(cacheKey, JSON.stringify(globalData));

        const existingKeys = Object.keys(sessionStorage).filter(key => key.startsWith("full_schedule_"));
        if (existingKeys.length > 1) {
          existingKeys.forEach(key => {
            if (key !== cacheKey) sessionStorage.removeItem(key);
          });
        }

      } catch (error) {
        try {
          toast.error("Fallo en SIIAU, iniciando descarga de archivos locales...", { autoClose: 2000 });
          
          const res = await fetch(`${API_URL}/api/local-schedule?cycle=${selectedCycle}`);
          if (!res.ok) throw new Error("Fallo al obtener respaldo local");

          const fallbackData = await res.json();

          setFullSchedule(fallbackData);
          sessionStorage.setItem(cacheKey, JSON.stringify(fallbackData));

          const existingKeys = Object.keys(sessionStorage).filter(key => key.startsWith("full_schedule_"));
          if (existingKeys.length > 1) {
            existingKeys.forEach(key => {
              if (key !== cacheKey) sessionStorage.removeItem(key);
            });
          }

          console.log("Horario ensamblado desde archivos locales y guardado en Caché.");

        } catch (localErr) {
          toast.error("Error crítico al obtener los horarios de todos los servidores.");
          setFullSchedule({});
        }
      }
    };

    fetchGlobalSchedule();
  }, [selectedCycle]);


  /* ---------- FILTRADO ---------- */
  useEffect(() => {
    if (!selectedBuilding || !fullSchedule || Object.keys(fullSchedule).length === 0) {
      setSchedule([]);
      return;
    }
    const buildingData = fullSchedule[selectedBuilding] || [];
    setSchedule(buildingData);
  }, [selectedBuilding, fullSchedule]);

  /* ---------- CREAR RESERVA ---------- */
  const handleSaveReservation = async (reservationData) => {
    try {
      if (String(reservationData.createInGoogleCalendar) === 'true') {
        const authStatusRes = await fetch(`${API_URL}/api/google/status?user=${user}`);
        const authStatus = await authStatusRes.json();
  
        if (!authStatus.authenticated) {
          toast.info('Redirigiéndote para iniciar sesión en Google...', { autoClose: 1000, closeOnClick: true });
          saveReservationState();
          setTimeout(() => { window.location.href = `${API_URL}/api/google/auth?user=${user}`; }, 1300);
          return;
        }
      }
  
      const response = await fetch(`${API_URL}/api/reservations?cycle=${selectedCycle}&buildingName=${selectedBuilding}&user=${user}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(reservationData),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        if (response.status === 409) alert('Ya existe una reserva para esta fecha, horario y aula.');
        else if (response.status === 500) {
            toast.info('Tokens invalidos.\nRedirigiéndote para iniciar sesión en Google...', { autoClose: 1000, closeOnClick: true });
            saveReservationState();
            setTimeout(() => { window.location.href = `${API_URL}/api/google/reauth?user=${user}`; }, 1300);
        }
        else if (response.status === 403 || response.status === 401) {
          localStorage.clear();
          toast.error("Su sesión expiró. Inicie sesión nuevamente.",  {autoClose: 500});
          setTimeout(() => { window.location.href = `/login`; }, 1000);
        }
        else alert(`Error al guardar la reserva: ${result.error || 'Error desconocido'}`);
        return;
      }
  
      alert('Reserva guardada con éxito');
      fetchReservations();
    } catch (err) {
      alert('Ocurrió un error al guardar la reserva. Revisa la consola.');
    }
  };

  useEffect(() => {
    if (isStatisticMode) document.title = "TRACS - Conteo de Alumnos";
    else if (selectedBuilding) {
      const displayName = { DUCT1: "ALPHA", DUCT2: "BETA", DBETA: "CISCO" }[selectedBuilding] || selectedBuilding;
      document.title = `TRACS - ${displayName}`;
    } else document.title = "TRACS";
  }, [isStatisticMode, selectedBuilding]);

  return (
    <>
      <div className="calendar-container">
        <div className="main-content background-image-container">
          <div className="select-content">
            <div className="background-Selects shadow-md z-2">
              <SelectsLogic
                onUpdateCycle={setSelectedCycle}
                onUpdateBuilding={setSelectedBuilding}
                onUpdateDay={setSelectedDay}
                fetchReservations={fetchReservations}
                reservations={reservations}
                isStatisticMode={isStatisticMode}
                setIsStatisticMode={setIsStatisticMode}
                isPrintMode={isPrintMode}
                setIsPrintMode={setIsPrintMode}
                fullSchedule={fullSchedule}
              />
            </div>
          </div>
          <div className="table-container">
            <table className="schedule-table" id="schedule-table">
              <thead>
                <tr className="table-header">
                  <th className="table-cell">Hora</th>
                  {isStatisticMode
                    ? (
                      <>
                        {buildings.map((building, index) => (
                          <th key={index} className="table-cell">{building.value}</th>
                        ))}
                        <th className="table-cell" title='Número de alumnos por hora.'>Total por hora</th>
                      </>
                    )
                    : 
                  classrooms.map((classroom, index) => {
                    const cap = capacities?.[classroom];
                    return (
                      <th
                        key={index}
                        className={`table-cell print-col-${Math.floor(index / 9)}`}
                        title={cap != null ? `Capacidad: ${cap} estudiantes` : 'Capacidad no definida'}
                      >
                        {cap != null ? (
                          <>
                            {classroom}
                            <br />
                            <span style={{ fontWeight: 'normal' }}>
                              Capacidad: {cap} estudiantes
                            </span>
                          </>
                        ) : (
                          classroom
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {isStatisticMode ? (
                  <>
                  {hours.map((hour) => {
                    const [hourPart, period] = hour.split(' ');
                    let currentHour = parseInt(hourPart.split(':')[0], 10);
                    if (period === 'PM' && currentHour !== 12) currentHour += 12;
                    if (period === 'AM' && currentHour === 12) currentHour = 0;

                    let  totalForHour = 0;
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
                          
                          totalForHour += studentCount;
                          return (
                            <td key={building.value} className={`table-cell font-bold text-4l text-blue-600 ${colorClass}`}>
                              {studentCount}
                            </td>
                          );
                        })}
                        <td className={`table-cell font-bold text-4l text-green-600 bg-gray-200`}>{totalForHour}</td>
                      </tr>
                    );
                  })}
                  <tr key="total-row">
                    <td className="table-cell font-bold" title='Número total de alumnos multiplicado por las horas de sus clases. No representa alumnos únicos.'>Total por día</td>
                    {buildings.map((building, index) => {
                      const scheduleForBuilding = fullSchedule[building.value] || [];
                      const seen = new Set();

                      const totalForBuilding = scheduleForBuilding.reduce((total, course) => {
                        const key = JSON.stringify(course.data);
                        if (seen.has(key)) return total;
                        seen.add(key);

                        const courseDays = course.data.days.split(' ');
                        const isCourseOnDay = courseDays.includes(selectedDay);

                        if (isCourseOnDay) {
                          const [start, end] = course.data.schedule.split('-');
                          const startHour = parseInt(start.substring(0, 2), 10);
                          const endHour = parseInt(end.substring(0, 2), 10);
                          const hourSpan = endHour - startHour + 1;

                          return total + (parseInt(course.data.students || 0, 10) * hourSpan);
                        }
                        return total;
                      }, 0);

                      return (
                        <td
                          key={building.value}
                          className={`table-cell font-bold text-green-600 bg-gray-200`}
                        >
                          {totalForBuilding}
                        </td>
                      );
                    })}
                    {/* Total general del día */}
                    <td className="table-cell font-bold text-green-700 bg-gray-300">
                      {buildings.reduce((grandTotal, building) => {
                        const schedule = fullSchedule[building.value] || [];
                        const seen = new Set();

                        const buildingTotal = schedule.reduce((total, course) => {
                          const key = JSON.stringify(course.data);
                          if (seen.has(key)) return total;
                          seen.add(key);

                          const courseDays = course.data.days.split(' ');
                          const isCourseOnDay = courseDays.includes(selectedDay);

                          if (isCourseOnDay) {
                            const [start, end] = course.data.schedule.split('-');
                            const startHour = parseInt(start.substring(0, 2), 10);
                            const endHour = parseInt(end.substring(0, 2), 10);
                            const hourSpan = endHour - startHour + 1;

                            return total + (parseInt(course.data.students || 0, 10) * hourSpan);
                          }
                          return total;
                        }, 0);

                        return grandTotal + buildingTotal;
                      }, 0)}
                    </td>
                  </tr>
                  </>

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
                        if (!isPrintMode && renderedCells[cellKey]) return null;

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
                        
                        /* --------------- Coloreado de celdas ---------------- */
                        const forbiddenHueRanges = [
                          [40, 150],
                          [200, 210],
                        ];
                        const isForbidden = (h) => forbiddenHueRanges.some(([min, max]) => h >= min && h <= max);
                        const goldenAngle = 137.508;
                        let hue = 0;

                        if (matchingCourse) {
                          const key = `${matchingCourse?.data?.course}|${matchingCourse?.professor}|${matchingCourse?.data?.nrc}|${matchingCourse?.data?.classroom}`;

                          if (cellColorMapRef.current[key]) {
                            hue = cellColorMapRef.current[key];
                          } else {
                            const seed =
                              matchingCourse.data.course.length +
                              matchingCourse.professor.length * 17 +
                              matchingCourse.data.nrc * 1 +
                              Date.now() * 1000;

                            hue = seed % 360;

                            let attempts = 0;
                            while (isForbidden(hue) && attempts < 10) {
                              hue = (hue + goldenAngle) % 360;
                              attempts++;
                            }
                            cellColorMapRef.current[key] = hue;
                          }
                        }

                        let rowspan = 1;
                        let showReservation = false;

                        if (matchingCourse) {
                          const [start, end] = matchingCourse.data.schedule.split('-');
                          const startHour = parseInt(start.substring(0, 2), 10);
                          const endHour = parseInt(end.substring(0, 2), 10);
                          
                          if (!isPrintMode) rowspan = endHour - startHour + 1;

                          for (let h = startHour; h <= endHour; h++) {
                            renderedCells[`${h}-${classroom}`] = true;
                          }
                        } else if (matchingReservation) {
                          const [resStart, resEnd] = matchingReservation.schedule.split('-');
                          const resStartHour = parseInt(resStart.substring(0, 2), 10);
                          const resEndHour = parseInt(resEnd.substring(0, 2), 10);
                          
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
                            style={{
                              backgroundColor: matchingCourse
                                ? `hsl(${hue}, 50%, 46%)`
                                : showReservation
                                  ? '#0a304b'
                                  : 'white'
                            }}
                            {...(!isPrintMode && rowspan > 1 ? { rowSpan: rowspan } : {})}
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
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <footer className="w-full bg-gray-100 text-white footer-calendar fixed bottom-0 left-0">
        <div className="flex justify-between items-center px-6 w-full text-sm md:text-base">
          <div className="flex space-x-4">
            <a href={`/privacy`} className="hover:underline text-sm md:text-lg font-medium" target="_blank">Política de privacidad</a>
            <a href={`/terms`} className="hover:underline text-sm md:text-lg font-medium" target="_blank">Términos y condiciones</a>
          </div>
          <div className="hidden md:block text-right text-sm md:text-lg font-medium">
            © {new Date().getFullYear()} TRACS - Licenciado bajo MIT.
          </div>
        </div>
      </footer>
    </>
  );
}