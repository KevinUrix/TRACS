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
  const [createInGoogleCalendar, setCreateInGoogleCalendar] = useState('');
  const [googleEventId, setGoogleEventId] = useState('');

  const [isLoading, setIsLoading] = useState(true);

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
      setCreateInGoogleCalendar(reservation.createInGoogleCalendar);

      setIsLoading(false); // Ya cargó

    }
    if (reservation.googleEventId)
      setGoogleEventId(reservation.googleEventId);
  }, [reservation]);

  const handleSave = () => {
    const updatedReservation = { professor, course, date, days, schedule, classroom, duration, building: selectedBuilding, code, createInGoogleCalendar};
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

  const handleInputChange = (setter) => (e) => {
    const value = e.target.value;
    const valid = /^[\w\sáéíóúÁÉÍÓÚñÑ]*$/; // Acepta letras, números, espacios y acentos
    if (valid.test(value)) setter(value);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Modificar reserva</h2>
        {isLoading ? (
          <div className="modal"><p>Cargando...</p></div>
        ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="font-semibold">Profesor:</label>
            <input
              type="text"
              value={professor}
              onChange={handleInputChange(setProfessor)}
              className="w-64 p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="font-semibold">Materia:</label>
            <input
              type="text"
              value={course}
              onChange={handleInputChange(setCourse)}
              className="w-64 p-2 border border-gray-300 rounded"
            />
          </div>
          <label className="font-semibold">
            Clave:
            <input
              type="text"
              value={code}
              onChange={handleInputChange(setCode)}
              required
              className="w-48 p-2 border border-gray-300 rounded" // ancho de 16rem
            />
          </label>
          <div>
            <label className="font-semibold">Fecha:</label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
            />
          </div>
          <div className='select-container-d'>
            <label className="font-semibold">Día:</label>
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
            <label className="font-semibold" >Horario:</label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              disabled
            />
          </div>
          <div>
            <label className="font-semibold">Edificio:</label>
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              disabled
            />
          </div>
          <div>
            <label className="font-semibold">Salón:</label>
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
                    Siempre
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
                  <label> | </label>
                  <label className="inline-flex items-center gap-2">
                    Temporal
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
        )}
      </div>
    </div>
  );
}