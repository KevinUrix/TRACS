import React, { useState, useEffect } from 'react';

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

export default function ViewReservationsButton({ allReservations, selectedCycle, selectedBuilding, refetchReservations }) {
  const [showPopup, setShowPopup] = useState(false);
  const [filteredReservations, setFilteredReservations] = useState([]);

  // Actualiza filteredReservations cuando allReservations cambia
  useEffect(() => {
    if (Array.isArray(allReservations)) {
      setFilteredReservations(allReservations);
    } else {
      console.error('allReservations no es un array');
    }
  }, [allReservations]);

  const openPopup = async () => {
    if (refetchReservations) {
      await refetchReservations();
    }
    setShowPopup(true);
  };
  

  const deleteReservation = async (reserva) => {
    const params = new URLSearchParams({
      cycle: selectedCycle,
      buildingName: selectedBuilding,
      professor: reserva.professor,
      schedule: reserva.schedule,
      date: reserva.date
    });

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la reserva de ${reserva.course}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/reservations?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      const data = await res.json();
      alert(data.message);

      const updated = filteredReservations.filter(r =>
        !(
          r.professor === reserva.professor &&
          r.schedule === reserva.schedule &&
          r.date === reserva.date &&
          r.building === reserva.building
        )
      );
      setFilteredReservations(updated);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("Hubo un error al eliminar la reserva.");
    }
  };

  

  return (
    <>
      <button
        onClick={openPopup}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Ver Reservas
      </button>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowPopup(false)}>✖</button>
            <h3>Reservas para ciclo {selectedCycle}, edificio {selectedBuilding}:</h3>
            <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #666' }} />

            {filteredReservations.length === 0 ? (
              <p>No se encontraron reservas para este ciclo y edificio.</p>
            ) : (
              <ul>
                {filteredReservations.map((res, idx) => (
                  <li key={idx}>
                    <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
                    <strong>Materia:</strong> {res.course}<br />
                    <strong>Profesor:</strong> {res.professor}<br />
                    <strong>Día:</strong> {translateDays(res.days)}<br />
                    <strong>Horario:</strong> {res.schedule.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, "$1:$2 - $3:$4")}<br />
                    <strong>Salón:</strong> {res.classroom}<br />
                    <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md" onClick={() => deleteReservation(res)}>Eliminar</button>
                    <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md">Modificar</button>
                    <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
