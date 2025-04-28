import { useState } from 'react';
import './calendar.css'; 

export default function ReserveButton({
  selectedCycle,
  selectedBuilding,
  selectedDay,
  selectedHour,
  classroom,
  onSaveReservation
}) {
  // Función para convertir la hora en formato de 12 horas (AM/PM) a formato de 24 horas
  const convertTo24HourFormat = (time) => {
    const [hour, minutePeriod] = time.split(':');
    const [minute, period] = minutePeriod.split(' ');
    let hour24 = parseInt(hour, 10);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  // Función para sumar minutos a una hora
  const addMinutes = (time, minutesToAdd) => {
    const [hour, minute] = time.split(':').map(num => parseInt(num, 10));
    const newTime = new Date(0, 0, 0, hour, minute + minutesToAdd);
    const newHour = newTime.getHours().toString().padStart(2, '0');
    const newMinute = newTime.getMinutes().toString().padStart(2, '0');
    return `${newHour}:${newMinute}`;
  };

  // Obtener fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [course, setCourse] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [startTime, setStartTime] = useState(convertTo24HourFormat(selectedHour));
  const [endTime, setEndTime] = useState(addMinutes(startTime, 55));
  const [reservationDate, setReservationDate] = useState(getTodayDate());
  const [duration, setDuration] = useState('Temporal');
  const [createInGoogleCalendar, setCreateInGoogleCalendar] = useState('Sí');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  
  const handleSave = () => {
    const schedule = `${startTime.replace(':', '')}-${endTime.replace(':', '')}`;
    const reservationData = {
      schedule,
      days: selectedDay,
      building: selectedBuilding,
      classroom,
      code,
      course,
      date: reservationDate,
      duration,
      professor,
      createInGoogleCalendar, // <-- Aquí agregamos la opción
    };
    
    onSaveReservation(reservationData);

    // Resetear los estados después de guardar
    setCourse('');
    setCode('');
    setProfessor('');
    setDuration('');
    setStartTime(convertTo24HourFormat(selectedHour));
    setEndTime(addMinutes(startTime, 55));
    setReservationDate(getTodayDate());
    handleCloseModal();
  };

  const dayLetterMap = {
    L: 0,
    M: 1,
    I: 2,
    J: 3,
    V: 4,
    S: 5,
  };

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const selectedDateDay = selectedDate.getDay(); // 0 (Dom) a 6 (Sáb)
    const expectedDay = dayLetterMap[selectedDay];
  
    // Si la letra del día no está en el mapa
    if (expectedDay === undefined) {
      alert(`El día seleccionado (${selectedDay}) no es válido.`);
      setReservationDate(getTodayDate());
      return;
    }
  
    // Mostrar en consola para depuración
    console.log("Letra seleccionada:", selectedDay);
    console.log("Día esperado (num):", expectedDay);
    console.log("Día de la fecha elegida:", selectedDateDay);
  
    // Validar
    if (selectedDateDay !== expectedDay) {
      alert(`Por favor selecciona una fecha que caiga en el día correspondiente (${selectedDay}).`);
      setReservationDate(getTodayDate());
    } else {
      setReservationDate(e.target.value);
    }
  };

  return (
    <>
      <button className="reserve-button" onClick={handleOpenModal}>
        R
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Reservar Aula</h2>
            <form>
              <label>
                Maestro:
                <input
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  required
                />
              </label>
              <label>
                Materia:
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </label>
              <label>
                Clave:
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </label>
              <label>
                Salón:
                <input
                  type="text"
                  value={classroom}
                  disabled
                />
              </label>
              <label>
                Día/s:
                <input
                  type="text"
                  value={selectedDay}
                  disabled
                />
              </label>
              <label>
                Fecha:
                <input
                  type="date"
                  value={reservationDate}
                  onChange={handleDateChange}
                  required
                />
              </label>
              <label>
                Hora de inicio:
                <input
                  type="time"
                  value={startTime}
                  disabled
                />
              </label>
              <label>
                Hora de finalización:
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled
                />
              </label>
              <div className="flex flex-col items-start gap-2 mb-4">
                <span className="font-semibold">Duración de la reserva:</span>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    Siempre:
                    <input
                      type="radio"
                      name="tipoReserva"
                      value="Siempre"
                      checked={duration === 'Siempre'}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="translate-y-[1px]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2">
                    Temporal:
                    <input
                      type="radio"
                      name="tipoReserva"
                      value="Temporal"
                      checked={duration === 'Temporal'}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="translate-y-[1px]"
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 mb-4">
                <span className="font-semibold">Crear reserva en Google Calendar:</span>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    Sí:
                    <input
                      type="radio"
                      name="googleCalendar"
                      value="Sí"
                      checked={createInGoogleCalendar === 'Sí'}
                      onChange={(e) => setCreateInGoogleCalendar(e.target.value)}
                      className="translate-y-[1px]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2">
                    No:
                    <input
                      type="radio"
                      name="googleCalendar"
                      value="No"
                      checked={createInGoogleCalendar === 'No'}
                      onChange={(e) => setCreateInGoogleCalendar(e.target.value)}
                      className="translate-y-[1px]"
                    />
                  </label>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="cancel-button" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button className="submit-button" onClick={handleSave}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
