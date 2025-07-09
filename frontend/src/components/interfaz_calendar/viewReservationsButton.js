import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config/api';
import EditReservationForm from './editReservationForm'; // Importamos el formulario

const dayNames = {
  L: 'Lunes',
  M: 'Martes',
  I: 'Miércoles',
  J: 'Jueves',
  V: 'Viernes',
  S: 'Sábado',
  D: 'Domingo',
};

const dayOrder = ['L', 'M', 'I', 'J', 'V', 'S', 'D'];

function translateDays(daysString) {
  const letters = daysString
    .toUpperCase()
    .replace(/[^LMIJVSD]/g, '')
    .split('');
  const sorted = [...new Set(letters)].sort(
    (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
  );
  return sorted.map((char) => dayNames[char]).join(', ');
}

export default function ViewReservationsButton({ reservations, selectedCycle, selectedBuilding, fetchReservations }) {
  const [showPopup, setShowPopup] = useState(false);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null); // Nueva state para la reserva seleccionada
  const userRole = localStorage.getItem("role"); // Para obtener el rol de la cuenta.
  const user = localStorage.getItem("username"); // Para obtener el usuario de la cuenta.
  const navigate = useNavigate();
  
  useEffect(() => {
    if (Array.isArray(reservations)) {
      setFilteredReservations(reservations);
    } else {
      console.error('reservations no es un array');
    }
  }, [reservations]);

  const openPopup = async () => {
    if (!selectedBuilding || !selectedCycle) {
      toast.error('Debes seleccionar un ciclo y un edificio.');
      return;
    }
    if (fetchReservations) {
      await fetchReservations();
    }
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedReservation(null); // Cerrar y limpiar la reserva seleccionada
  };

  const handleModify = (res) => {
    setSelectedReservation(res); // Al presionar "Modificar", se selecciona la reserva
  };

  const handleSaveReservation = async (updatedReservation) => {
    try {
      const params = new URLSearchParams({
        originalSchedule: selectedReservation.schedule,
        cycle: selectedCycle,
        buildingName: selectedBuilding,
        originalProfessor: selectedReservation.professor,
        originalDate: selectedReservation.date,
        originalDuration: selectedReservation.duration,
        originalcreateInGoogleCalendar: selectedReservation.createInGoogleCalendar,
        user: user,
      });
      
      if (selectedReservation.googleEventId)
        params.append('originalGoogleEventId', selectedReservation.googleEventId);
      
      if (selectedReservation.googleEventId) {
        const authStatusRes = await fetch(`${API_URL}/api/google/status?user=${user}`);
        const authStatus = await authStatusRes.json();
  
        if (!authStatus.authenticated) {
          console.log('>> Usuario no autenticado para modificar evento, redirigiendo...');
          toast.info('Redirigiéndote para iniciar sesión en Google...', {
            autoClose: 1000,
            closeOnClick: true,
          });
          setTimeout(() => {
            window.location.href = `${API_URL}/api/google/auth?user=${user}`;
          }, 1300);
          return;
        }
      }
  
      const res = await fetch(`${API_URL}/api/reservations?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(updatedReservation)
      });
  
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          localStorage.clear();
          toast.error("Su sesión expiró. Inicie sesión nuevamente.",  {autoClose: 500});
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          return;
        }
        else if (res.status === 400) {
          localStorage.clear();
          toast.error("Sesión invalida. Inicie sesión nuevamente.",  {autoClose: 500});
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          return;
        }
        throw new Error(data.message || `Error HTTP: ${res.status}`);
      }
  
      alert('Reserva modificada correctamente');
  
      if (fetchReservations) await fetchReservations();
  
      closeEditForm();
    } catch (err) {
      console.error(err);
      alert(`Hubo un error al modificar la reserva:\n${err.message}`);
    }
  };
  

  const deleteReservation = async (reservation) => {
    const params = new URLSearchParams({
      cycle: selectedCycle,
      buildingName: selectedBuilding,
      professor: reservation.professor,
      schedule: reservation.schedule,
      date: reservation.date,
      user: user,
    });

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la reserva de ${reservation.professor}?`);
    if (!confirmDelete) return;

    try {

      if (reservation.googleEventId) {
        const authStatusRes = await fetch(`${API_URL}/api/google/status?user=${user}`);
        const authStatus = await authStatusRes.json();
  
        if (!authStatus.authenticated) {
          console.log('>> Usuario no autenticado para borrar evento, redirigiendo...');
          toast.info('Redirigiéndote para iniciar sesión en Google...', {
            autoClose: 1000,
            closeOnClick: true,
          });
          setTimeout(() => {
            window.location.href = `${API_URL}/api/google/auth?user=${user}`;
          }, 1300);
          return;
        }
      }

      const res = await fetch(`${API_URL}/api/reservations?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          localStorage.clear();
          toast.error("Su sesión expiró. Inicie sesión nuevamente.",  {autoClose: 500});
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          return;
        }
        else if (res.status === 400) {
          localStorage.clear();
          toast.error("Sesión invalida. Inicie sesión nuevamente.",  {autoClose: 500});
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          return;
        }
        throw new Error(data.message || `Error HTTP: ${res.status}`);
      }

      alert(data.message);

      const updated = filteredReservations.filter(r =>
        !(
          r.professor === reservation.professor &&
          r.schedule === reservation.schedule &&
          r.date === reservation.date &&
          r.building === reservation.building
        )
      );
      setFilteredReservations(updated);
      fetchReservations();
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert(`Hubo un error al eliminar la reserva:\n${err.message}`);
    }
  };

  const closeEditForm = () => {
    setSelectedReservation(null);
  };

  return (
    <>
      <div className="relative group">
        <button
          onClick={openPopup}
          className="background-button3 rounded-full px-4 py-2 shadow-md text-white transition duration-200"
        >
          <b>Ver reservas 📇</b>
        </button>
        <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
          Ver reservas filtradas por ciclo y edificio.
        </span>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content relative p-6 rounded-lg shadow-lg max-w-xs" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={closePopup}>✖</button>

            <h3>Reservas para ciclo {selectedCycle}, edificio {selectedBuilding}:</h3>
            
            <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #666' }} />

            {filteredReservations.length === 0 ? (
              <p>No se encontraron reservas para este ciclo y edificio.</p>
            ) : (
              <ul>
                {filteredReservations.map((res, idx) => (
                  <li key={idx}>
                    <div><b>Profesor:</b> {res.professor}</div>
                    <div><b>Materia:</b> {res.course}</div>
                    <div><b>Edificio:</b> {res.building}</div>
                    <div><b>Clave:</b> {res.code}</div>
                    <div><b>Fecha:</b> {res.date}</div>
                    <div><b>Día:</b> {translateDays(res.days)}</div>
                    <div><b>Horario:</b> {res.schedule.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, "$1:$2 - $3:$4")}</div>
                    <div><b>Salón:</b> {res.classroom}</div>
                    <div><b>Duración:</b> {res.duration}</div>
                    <div className="mt-4">
                      {(userRole === 'superuser' || userRole === 'user') && (
                        <>
                          <button
                            className="px-4 py-2 background-button1 text-white rounded-md"
                            onClick={() => deleteReservation(res)}
                          >
                            Eliminar
                          </button>
                          <button
                            className="px-4 py-2 background-button3 text-white rounded-md"
                            onClick={() => handleModify(res)}
                          >
                            Modificar
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Si se seleccionó una reserva, mostrar el formulario */}
      {selectedReservation && (
        <EditReservationForm
          reservation={selectedReservation}
          onSave={handleSaveReservation}
          onCancel={closeEditForm} // ← Solo cierra el formulario
          selectedBuilding={selectedBuilding}
        />
      )}
    </>
  );
}