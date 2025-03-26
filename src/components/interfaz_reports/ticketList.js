import { useState } from 'react';
import TicketModal from './ticketModal';

export default function TicketList({ tickets, removeTicket }) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 max-h-96 overflow-auto">
      {tickets.map((ticket, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-lg border border-gray-300 flex flex-col space-y-4">
          <h2 className="font-semibold text-lg">Edificio: {ticket.edificio}</h2>
          <h3 className="font-semibold text-lg">Salón: {ticket.salon}</h3>
          <p><strong>Fecha:</strong> {ticket.fecha}</p>
          <p>
            <strong>Descripción:</strong>{' '}
            {ticket.descripcion.length > 60
              ? ticket.descripcion.slice(0, 60) + '...' // Limitar la descripción a 60 caracteres
              : ticket.descripcion}
          </p>
          {ticket.descripcion.length > 60 && (
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
              onClick={() => handleViewDetails(ticket)}
            >
              Ver Detalles
            </button>
          )}
          <button
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg"
            onClick={() => removeTicket(index)}
          >
            Eliminar Ticket
          </button>
        </div>
      ))}

      {/* Mostrar el modal si se selecciona un ticket */}
      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={handleCloseModal} />}
    </div>
  );
}
