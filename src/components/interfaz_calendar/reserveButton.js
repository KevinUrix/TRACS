import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
    return ''; // Regresa una cadena vacía si no deseas una fecha predeterminada
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [course, setCourse] = useState('');
  const [code, setCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [startTime, setStartTime] = useState(convertTo24HourFormat(selectedHour));
  const [endTime, setEndTime] = useState(addMinutes(startTime, 55));
  const [reservationDate, setReservationDate] = useState(getTodayDate()); /* Para poner la fecha en automatico*/
  const [duration, setDuration] = useState('Temporal');
  const [createInGoogleCalendar, setCreateInGoogleCalendar] = useState('true');

  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");

    // Verificación de permisos al abrir la modal
  const handleOpenModal = () => {
    if (userRole === 'superuser' || userRole === 'user' || userRole === 'tecnico') {
      setIsModalOpen(true);
    } else {
      toast.error('Necesitas iniciar sesión para realizar una reserva.');
      if (selectedCycle && selectedBuilding) {
        sessionStorage.setItem('reservationState', JSON.stringify({
          selectedCycle,
          selectedBuilding,
        }));
      }
      navigate('/login');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('focus', () => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  
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
    setStartTime(convertTo24HourFormat(selectedHour));
    setEndTime(addMinutes(startTime, 55));
    setReservationDate(getTodayDate()); /* Anteriormente para poner la fecha en automatico */
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
    const selectedDateDay = selectedDate.getDay();
    const expectedDay = dayLetterMap[selectedDay];

    // Si la letra del día no está en el mapa
    if (expectedDay === undefined) {
      alert(`El día seleccionado (${selectedDay}) no es válido.`);
      setReservationDate(getTodayDate());
      return;
    }
  
    // Validar
    /*if (selectedDateDay !== expectedDay) {
      alert(`Por favor selecciona una fecha que caiga en el día correspondiente (${selectedDay}).`); // Anteriormente para regresarte al día si no escogias el mismo.
      setReservationDate(getTodayDate());
    } else {
      setReservationDate(e.target.value);
    }*/

    if (selectedDateDay !== expectedDay) { //Corrige la fecha a la mas cercana con el día corres pondiente.
      const correctedDate = findNextValidDate(selectedDate, expectedDay);
      alert(`La fecha ha sido ajustada al próximo ${selectedDay}: ${correctedDate}`);
      setReservationDate(correctedDate);
    } else {
      setReservationDate(e.target.value);
    }
  };

  const isFormIncomplete = !professor || !course || !code || !reservationDate || !duration;

  const handleInputChange = (setter) => (e) => {
    const value = e.target.value;
    const valid = /^[\w\sáéíóúÁÉÍÓÚñÑ]*$/; // Acepta letras, números, espacios y acentos
    if (valid.test(value)) setter(value);
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
        <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(54, 79, 119)' }} />

        <form className="form">
          <div className="form-grid">
              <label className='font-semibold'>
                Maestro:
                <input
                  type="text"
                  value={professor}
                  onChange={handleInputChange(setProfessor)}
                  className='w-full p-2 border border-gray-300'
                  maxLength={40}
                  required
                />
              </label>
            <div className="flex items-center gap-4">
              <label className='font-semibold'>
                Materia:
                <input
                  type="text"
                  value={course}
                  onChange={handleInputChange(setCourse)}
                  className='w-full mr-28 border border-gray-300'
                  maxLength={120}
                  required
                />
              </label>
              <label className='font-semibold'>
                Clave:
                <input
                  type="text"
                  value={code}
                  onChange={handleInputChange(setCode)}
                  className='w-full border border-gray-300'
                  maxLength={10}
                  required
                />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className='font-semibold'>
                Edificio:
                <input
                  type="text"
                  value={selectedBuilding}
                  className='w-32'
                  disabled
                />
              </label>

              <label className='font-semibold'>
                Salón:
                <input
                  type="text"
                  value={classroom}
                  className='w-32'
                  disabled
                />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className='font-semibold'>
                    Fecha:
                    <input
                    type="date"
                    value={reservationDate}
                    onChange={handleDateChange}
                    className="w-48 p-2 border"
                    required
                    />
              </label>
              <label className='font-semibold'>
                Día:
                <select value={selectedDay} type="text" disabled className='w-full pt-2 pb-2'>
                  <option value="">Selecciona un día</option>
                  <option value="L">Lunes</option>
                  <option value="M">Martes</option>
                  <option value="I">Miércoles</option>
                  <option value="J">Jueves</option>
                  <option value="V">Viernes</option>
                  <option value="S">Sabado</option>
                </select>
              </label>
            </div>
            <div className="flex items-center gap-4">
                <label className="flex gap-1 font-semibold text-center">
                  Hora de inicio
                  <input
                    type="time"
                    value={startTime}
                    className="w-full p-2 border border-gray-300"
                    disabled
                  />
                </label>

                <label className="flex gap-1 font-semibold text-center">
                  Hora de cierre
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 border border-gray-300"
                    disabled
                  />
                </label>
            </div>
            <div className="flex flex-col items-start gap-2 mb-4">
                <span className="font-semibold">Duración de la reserva</span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2">
                      Siempre
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
                <span className="font-semibold">Crear reserva en Google Calendar:</span>
                <div className="flex items-center pl-5 gap-14">
                  <label className="inline-flex items-center gap-2">
                      Sí:
                      <input
                        type="radio"
                        name="googleCalendar"
                        value="true"
                        checked={createInGoogleCalendar === 'true'}
                        onChange={(e) => setCreateInGoogleCalendar(e.target.value)}
                        className="translate-y-[1px]"
                      />
                    </label>
                  <label className="inline-flex items-center gap-2">
                      No:
                      <input
                        type="radio"
                        name="googleCalendar"
                        value="false"
                        checked={createInGoogleCalendar === 'false'}
                        onChange={(e) => setCreateInGoogleCalendar(e.target.value)}
                        className="translate-y-[1px]"
                      />
                  </label>
                </div>
              </div>
          </div>
          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCloseModal}
            >
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={isFormIncomplete} className={`save-button ${isFormIncomplete ? 'disabled' : ''}`}>
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