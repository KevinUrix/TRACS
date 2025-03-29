import { useState } from 'react';
import Sidebar from '../sidebar'; // Asegúrate de que el import sea correcto
import TicketForm from './ticketForm';
import TicketList from './ticketList';
import Navbar from './navbar_reports'; // Importa el nuevo componente

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
    <div className="bg-gray-100 flex">
      <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      <div className="flex flex-col w-full">
        {/* Reemplaza la barra de navegación original con el componente Navbar */}
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="my-6 flex justify-center mt-32">
          <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Crear un Ticket</h2>
            <TicketForm addTicket={addTicket} />
          </div>
        </div>

        <TicketList tickets={tickets} removeTicket={removeTicket} />
      </div>
    </div>
  );
}
