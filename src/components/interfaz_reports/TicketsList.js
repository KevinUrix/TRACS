import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function TicketsList({ building, refresh, onRefresh}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // ticket seleccionado para editar
  const [currentPage, setCurrentPage] = useState(1);

  const ticketsPerPage = 9;
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const url = building
          ? `/api/tickets/${encodeURIComponent(building)}`
          : `/api/tickets`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al cargar tickets');

        const data = await res.json();
        setTickets(data);
        setCurrentPage(1);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la lista de tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [building, refresh]);

  const paginatedTickets = tickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage
  );

  // Manejar cambios en el formulario de edición
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedTicket((prev) => ({ ...prev, [name]: value }));
  };

  // Actualizar ticket
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTicket),
      });
      if (!res.ok) throw new Error('Error al actualizar ticket');
      toast.success('Ticket actualizado');
      setSelectedTicket(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el ticket');
    }
  };

  // Borrar ticket
  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres borrar este ticket?')) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al borrar ticket');
      toast.success('Ticket borrado');
      setSelectedTicket(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Error al borrar el ticket');
    }
  };


  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        {building ? `Tickets para ${building}` : 'Todos los tickets'}
      </h2>

      {loading && <p>Cargando tickets...</p>}
      {!loading && tickets.length === 0 && (
          <p>
            {building
              ? 'No hay tickets para este edificio.'
              : 'No hay tickets registrados.'}
          </p>
      )}

      {!loading && tickets.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paginatedTickets.map(({ id, building, room, report, created_at }) => (
              <div key={id} onClick={() =>
                  setSelectedTicket({ id, building, room, report, created_at })
                }
                className="bg-white p-4 shadow rounded cursor-pointer hover:bg-gray-100"
                >

                <p><strong>Edificio:</strong> {building}</p>
                <p><strong>Salón:</strong> {room}</p>
                <p className="truncate"><strong>Reporte:</strong> {report}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Fecha: {new Date(created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    {/* Modal para ver/editar ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar ticket</h3>

            <label className="block mb-2">
              Edificio:
              <input
                type="text"
                name="building"
                value={selectedTicket.building}
                onChange={handleChange}
                className="border rounded w-full px-2 py-1 mt-1"
                disabled
              />
            </label>
            
            <label className="block mb-2">
              Salón:
              <input
                type="text"
                name="room"
                value={selectedTicket.room}
                onChange={handleChange}
                className="border rounded w-full px-2 py-1 mt-1"
                disabled
              />
            </label>

            <label className="block mb-2">
              Reporte:
              <textarea
                name="report"
                value={selectedTicket.report}
                onChange={handleChange}
                className="border rounded w-full px-2 py-1 mt-1"
                rows={4}
              />
            </label>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Borrar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}