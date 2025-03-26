import React from 'react';

export default function TicketModal({ ticket, onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 sm:w-1/3 md:w-1/4">
        <h2 className="font-semibold text-xl mb-4">Detalles del Ticket</h2>
        <p><strong>Edificio:</strong> {ticket.edificio}</p>
        <p><strong>Salón:</strong> {ticket.salon}</p>
        <p><strong>Fecha:</strong> {ticket.fecha}</p>
        <div className="mt-4">
          <strong>Descripción del problema:</strong>
          <div
            className="border p-2 mt-2 h-32 overflow-y-auto whitespace-pre-wrap break-words"
            style={{ maxHeight: '200px' }} // Altura máxima con scroll vertical
          >
            {ticket.descripcion}
          </div>
        </div>
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg w-full"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
