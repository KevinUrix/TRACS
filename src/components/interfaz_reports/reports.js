import { useState } from 'react';
import Sidebar from '../sidebar'; // Asegúrate de que el import sea correcto
import TicketForm from './ticketForm';
import TicketList from './ticketList';

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState([]);

  // Función para mostrar/ocultar la barra lateral
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Función para agregar un ticket
  const addTicket = (newTicket) => {
    setTickets([...tickets, newTicket]);
  };

  // Función para eliminar un ticket
  const removeTicket = (index) => {
    const newTickets = tickets.filter((_, i) => i !== index);
    setTickets(newTickets);
  };

  return (
    <>
      <div className="bg-gray-100 flex">
        <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        <div className="flex flex-col w-full">
          <nav className="w-full bg-blue-600 p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-10">
            <button onClick={toggleSidebar} className="text-white text-2xl font-bold">☰</button>
            <h1 className="text-white text-xl font-bold">Reportes/tickets</h1>
            <input
              type="text"
              placeholder="Buscar..."
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </nav>

          <div className="my-6 flex justify-center mt-32">
            <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Crear un Ticket</h2>
              <TicketForm addTicket={addTicket} />
            </div>
          </div>

          <TicketList tickets={tickets} removeTicket={removeTicket} />
        </div>
      </div>
    </>
  );
}
