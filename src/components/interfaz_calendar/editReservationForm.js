import React, { useState, useEffect } from 'react';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function EditReservationForm({ reservation, onSave, onCancel, selectedBuilding }) {
  const [course, setCourse] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState('');
  const [code, setCode] = useState('');
  const [days, setDays] = useState('');
  const [schedule, setSchedule] = useState('');
  const [building, setBuilding] = useState('');
  const [classroom, setClassroom] = useState('');
  const [duration, setDuration] = useState('');
  const [editInGoogleCalendar, setEditInGoogleCalendar] = useState('Sí');

  useEffect(() => {
    if (reservation) {
      setCourse(reservation.course);
      setCode(reservation.code);
      setProfessor(reservation.professor);
      setDate(reservation.date);
      setDays(reservation.days);
      setSchedule(reservation.schedule);
      setBuilding(reservation.building)
      setClassroom(reservation.classroom);
      setDuration(reservation.duration || 'Temporal');
    }
  }, [reservation]);

  const handleSave = () => {
    const updatedReservation = { professor, course, date, days, schedule,classroom, duration, building: selectedBuilding, code};
    onSave(updatedReservation);
  };

  const dayLetterMap = {
    L: 0, // Lunes
    M: 1, // Martes
    I: 2, // Miércoles
    J: 3, // Jueves
    V: 4, // Viernes
    S: 5, // Sábado
  };

  // Función para encontrar la próxima fecha válida para el día esperado
  const findNextValidDate = (baseDate, expectedDay) => {
    const date = new Date(baseDate);
  
    // Verificar si baseDate es una fecha válida
    if (isNaN(date.getTime())) {
      console.error("Fecha base inválida:", baseDate);
      return null; // O alguna fecha predeterminada como 'Invalid date'
    }
  
    // Asegurarse de que expectedDay es un valor válido (0-6)
    if (expectedDay < 0 || expectedDay > 6) {
      console.error("Día esperado inválido:", expectedDay);
      return null; // O una fecha predeterminada
    }
  
    // Ajuste de fecha al día esperado
    while (date.getDay() !== expectedDay) {
      date.setDate(date.getDate() + 1);
    }
  
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const selectedDateDay = selectedDate.getDay(); // número del 0 al 6
    const expectedDay = dayLetterMap[days]; // Por ejemplo, "L" = 1

    if (expectedDay === undefined) {
      alert(`El día seleccionado (${days}) no es válido.`);
      setDate('');
      return;
    }

    if (selectedDateDay !== expectedDay) {
      const correctedDate = findNextValidDate(selectedDate, expectedDay);
      alert(`La fecha ha sido ajustada al próximo ${days}: ${correctedDate}`);
      setDate(correctedDate);
    } else {
      setDate(e.target.value);
    }
  };

  const isFormIncomplete = !professor || !course || !code || !date;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Modificar reserva</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label>Profesor:</label>
            <input
              type="text"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            />
          </div>
          <div>
            <label>Materia:</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
          </div>
          <label>
            Clave:
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <div>
            <label>Fecha:</label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
            />
          </div>
          <div className='select-container'>
            <label>Día:</label>
            <select className="day-select2" value={days} onChange={(e) => setDays(e.target.value)} disabled>
                <option value="">Selecciona un día</option>
                <option value="L">Lunes</option>
                <option value="M">Martes</option>
                <option value="I">Miércoles</option>
                <option value="J">Jueves</option>
                <option value="V">Viernes</option>
                <option value="S">Sábado</option>
            </select>
            </div>
          <div>
            <label>Horario:</label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              disabled
            />
          </div>
          <div>
            <label>Edificio:</label>
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              disabled
            />
          </div>
          <div>
            <label>Salón:</label>
            <input
              type="text"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              disabled
            />
          </div>
          <div className="flex flex-col items-start gap-2 mb-4">
            <span className="font-semibold">Duración de la reserva:</span>
            <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    Siempre:
                    <input
                      type="radio"
                      name="tipoReserva"
                      value="Siempre"
                      checked={duration === "Siempre"}
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
                      checked={editInGoogleCalendar === 'Sí'}
                      onChange={(e) => setEditInGoogleCalendar(e.target.value)}
                      className="translate-y-[1px]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2">
                    No:
                    <input
                      type="radio"
                      name="googleCalendar"
                      value="No"
                      checked={editInGoogleCalendar === 'No'}
                      onChange={(e) => setEditInGoogleCalendar(e.target.value)}
                      className="translate-y-[1px]"
                    />
                  </label>
                </div>
              </div>
          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isFormIncomplete}
              className={`save-button ${isFormIncomplete ? 'disabled' : ''}`}
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}