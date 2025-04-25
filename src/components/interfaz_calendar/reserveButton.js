import { useState } from 'react';
import './calendar.css'; 

export default function ReserveButton({
  selectedCycle,
  selectedBuilding,
  selectedDay,
  selectedHour,
  classroom,
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
  const [duration, setDuration] = useState('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const onSaveReservation = async (reservationData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/reservations?cycle=${selectedCycle}&buildingName=${selectedBuilding}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });
  
      if (!response.ok) throw new Error('Error al guardar la reserva');
      alert('Reserva guardada con éxito');
    } catch (error) {
      console.error(error);
      alert('Hubo un problema al guardar la reserva');
    }
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
                Edificio:
                <input
                  type="text"
                  value={selectedBuilding}
                  disabled
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
                  onChange={(e) => setReservationDate(e.target.value)}
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
                  required
                />
              </label>
              <div className="flex items-center gap-4">
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
