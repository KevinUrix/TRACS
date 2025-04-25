import React, { useState, useEffect } from 'react';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function EditReservationForm({ reservation, onSave, onCancel, selectedBuilding }) {
  const [course, setCourse] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState('');
  const [code, setCode] = useState('');
  const [days, setDays] = useState('');
  const [schedule, setSchedule] = useState('');
  const [classroom, setClassroom] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (reservation) {
      setCourse(reservation.course);
      setCode(reservation.code);
      setProfessor(reservation.professor);
      setDate(reservation.date);
      setDays(reservation.days);
      setSchedule(reservation.schedule);
      setClassroom(reservation.classroom);
      setDuration(reservation.duration || 'Temporal');
    }
  }, [reservation]);

  const handleSave = () => {
    const updatedReservation = { professor, course, date, days, schedule, classroom, duration, building: selectedBuilding, code};
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

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const selectedDateDay = selectedDate.getDay(); // número del 0 al 6
    const expectedDay = dayLetterMap[days]; // Por ejemplo, "L" = 1

    if (selectedDateDay !== expectedDay) {
      alert(`Por favor selecciona una fecha que caiga en el día correspondiente (${days}).`);
      setDate(reservation.date); // Restablecer la fecha a la original si la validación falla
    } else {
      setDate(e.target.value);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2><strong>Modificar reserva</strong></h2>
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
            <label>Salón:</label>
            <input
              type="text"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              disabled
            />
          </div>
          <div className="flex items-center gap-4">
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
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={handleSave}
            >
              Guardar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded-md"
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
