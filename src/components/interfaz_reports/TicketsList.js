import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function TicketsList({ building, refresh, onRefresh, statusFilter, categoryFilter}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // ticket seleccionado para editar
  const [currentPage, setCurrentPage] = useState(1);

  const ticketsPerPage = 6;

  const filteredTickets = tickets.filter(ticket => {
  const matchesStatus =
    statusFilter.toLowerCase() === 'todos' || ticket.status.toLowerCase() === statusFilter.toLowerCase();
  const matchesCategory =
    categoryFilter.toLowerCase() === 'todos' || ticket.category.toLowerCase() === categoryFilter.toLowerCase();
  return matchesStatus && matchesCategory;
});

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPerPage));

  const currentUser = localStorage.getItem('username') || 'Desconocido'; // o el nombre que uses

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

  // Paginar tickets filtrados
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage
  );

  // Resetea a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter]);


  // Manejar cambios en el formulario de edición
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedTicket((prev) => ({ ...prev, [name]: value }));
  };

  // Actualizar ticket
  const handleSave = async () => {
    try {

      const updatedTicket = {
        ...selectedTicket,
        modified_by: currentUser,
        status_changed_at: new Date().toISOString()
      };

      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTicket),
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

  const userRole = localStorage.getItem("role"); // Para obtener el rol de la cuenta.

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {building ? `Tickets para ${building}` : 'Todos los tickets'}
      </h2>

      {!loading && tickets.length > 0 && filteredTickets.length === 0 && (
        <p>No se encontraron tickets con los filtros aplicados.</p>
      )}

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
            {paginatedTickets.map(({ id, building, room, title, report, priority, created_at, created_by, status, category, modified_by }) => (
              <div key={id} onClick={() =>
                  setSelectedTicket({ id, building, room, title, report, priority, created_at, created_by, status, category, modified_by })
                }
                className="bg-white p-4 shadow rounded cursor-pointer hover:bg-gray-100 custom-shadow-border-reports"
                >

                <p><strong>Edificio:</strong> {building}</p>
                <p><strong>Salón:</strong> {room}</p>
                <p><strong>Titulo:</strong> {title}</p>
                <p className="truncate"><strong>Reporte:</strong> {report}</p>
                <p>
                  <strong>Categoría:</strong>{' '}
                  <span
                    className={
                      category.includes('Mantenimiento') ? 'text-yellow-600' :
                      category.includes('Limpieza') ? 'text-green-600' :
                      category.includes('Hardware') ? 'text-blue-700' :
                      category.includes('Software') ? 'text-indigo-700' :
                      'text-gray-600'
                    }
                  >
                    {category}
                  </span>
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={status === 'Abierto'? 'text-red-600': status === 'En Proceso'? 'text-yellow-600': status === 'Cerrado'? 'text-green-600': 'text-gray-600'
                    }
                  >
                    {status}
                  </span>
                </p>
                <p>
                  <strong>Prioridad:</strong>{' '}
                  <span className={priority === 'Alta'? 'text-red-600': priority === 'Media'? 'text-yellow-600': priority === 'Baja'? 'text-green-600': 'text-gray-600'
                    }
                  >
                    {priority}
                  </span>
                </p>
                <p><strong>Creador:</strong> {created_by}</p>
                {modified_by && (
                  <p>
                    <strong>{status === 'Cerrado' ? 'Cerrado por:' : 'Modificado por:'}</strong> {modified_by}
                  </p>
                )}
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
                disabled={userRole === 'user'}
              />
            </label>

            <label className="block mb-2">
              Categoría:
              <select
                name="category"
                value={selectedTicket.category}
                onChange={handleChange}
                className="border rounded w-full px-2 py-1 mt-1"
                disabled={userRole === 'user'}
              >
                <option value="" disabled>-- Selecciona una categoría --</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Técnico (Hardware)">Técnico (Hardware)</option>
                <option value="Técnico (Software)">Técnico (Software)</option>
              </select>
            </label>

            <label className="block mb-2">
              Estado:
              <select
                name="status"
                value={selectedTicket.status}
                onChange={handleChange}
                className="border rounded w-full px-2 py-1 mt-1"
                disabled={userRole === 'user'}
              >
                <option value="Abierto">Abierto</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Cerrado">Cerrado</option>
              </select>
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
                className={`px-4 py-2 rounded text-white ${
                  userRole === 'user'
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                disabled={userRole === 'user'}
              >
                Borrar
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded text-white ${
                  userRole === 'user'
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={userRole === 'user'}
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