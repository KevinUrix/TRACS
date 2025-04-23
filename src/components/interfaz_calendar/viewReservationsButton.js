import React, { useState } from 'react';

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

export default function ViewReservationsButton({ allReservations, selectedCycle, selectedBuilding }) {
  const [showPopup, setShowPopup] = useState(false);

  // Ya no necesitas filtrar por ciclo o edificio si los datos vienen filtrados desde el JSON cargado
  const filteredReservations = allReservations;

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
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
                    <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">Eliminar</button>
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
