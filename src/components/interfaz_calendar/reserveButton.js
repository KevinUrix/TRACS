import { use, useState } from 'react';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function ReserveButton({
  selectedBuilding,
  selectedDay,
  selectedHour,
  classroom,
  onSaveReservation,
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
  const [clave, setClave] = useState('');
  const [professor, setProfessor] = useState('');
  const [startTime, setStartTime] = useState(convertTo24HourFormat(selectedHour));
  const [endTime, setEndTime] = useState(addMinutes(startTime, 55));
  const [reservationDate, setReservationDate] = useState(getTodayDate());

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = () => {
    const reservationData = {
      course,
      clave,
      professor,
      building: selectedBuilding,
      classroom,
      day: selectedDay,
      date: reservationDate,
      startTime,
      endTime,
    };

    onSaveReservation(reservationData);
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
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                />
              </label>
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
