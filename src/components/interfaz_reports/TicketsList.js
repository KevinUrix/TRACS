import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function TicketsList({ building, refresh, onRefresh, statusFilter, categoryFilter}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // ticket seleccionado para editar
  const [currentPage, setCurrentPage] = useState(1);

  const ticketsPerPage = 9;

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
  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return; // Evita clics múltiples
    setIsSaving(true); // Inicia la "protección"
    
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
    } finally {
      setIsSaving(false); // Vuelve a permitir guardar
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
      <h2 className="text-2xl font-semibold mb-4 text-center tracking-wide">
        {building ? `Tickets para ${building}` : 'Todos los tickets'}
      </h2>
      <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(54, 79, 119)' }} />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            {paginatedTickets.map(({ id, building, room, title, report, priority, created_at, created_by, status, category, modified_by }) => (
              <div key={id} onClick={() =>
                  setSelectedTicket({ id, building, room, title, report, priority, created_at, created_by, status, category, modified_by })
                }
                className="relative bg-white p-4 shadow rounded cursor-pointer hover:bg-gray-100 custom-shadow-border-reports z-2 w-98 h-88"
                >
                {/* CATEGORÍA ESTILO ETIQUETA */}
                <div
                  className={`
                    absolute -left-3 px-8 py-2 rounded-br text-white font-semibold rounded book-style 
                    ${category.includes('Mantenimiento') ? 'bg-yellow-600' :
                      category.includes('Limpieza') ? 'bg-green-600' :
                      category.includes('Hardware') ? 'bg-red-600' :
                      category.includes('Software') ? 'bg-indigo-700' :
                      'bg-blue-700'}
                  `}
                >
                  {category}
                </div>
                <div className="relative flex gap-6 mt-2 ml-28 mb-2">
                  <p className='text-right  w-full text-lg font-semibold'>
                    <span className=
                    {
                        status === 'Abierto'? 'text-red-600': 
                        status === 'En Proceso'? 'text-yellow-600': 
                        status === 'Cerrado'? 'text-green-600': 'text-gray-600'
                      }
                    >
                      {status}
                    </span>
                  </p>
                </div>

                <h2 className="text-xl font-bold text-blue-900 mt-4 mb-2 line-clamp-1">{title}</h2>
                <div className="flex gap-28 mb-2">
                  <p><strong>Edificio:</strong> {building}</p>
                  <p><strong>Salón:</strong> {room}</p>
                </div>
                <div className='mb-2'>
                    <p><strong>Reporte:</strong></p>
                    <textarea
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded resize-none custom-border-text-area"
                        value={report}
                        rows={3}
                        readOnly
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 mb-2 sm:gap-10 lg:gap-10 md:gap-10">
                  <div>
                    <p><strong>Prioridad:</strong></p>
                    <p className={
                      priority === 'Alta' ? 'text-red-600' :
                      priority === 'Media' ? 'text-yellow-600' :
                      priority === 'Baja' ? 'text-green-600' :
                      'text-gray-600'
                    }>
                      {priority}
                    </p>
                  </div>
                  <div className='pl-8 sm:pl-2 md:pl-3'>
                    <p className='sm:px-0'>
                      <strong>
                        {modified_by
                          ? (status === 'Cerrado' ? 'Cerrado por:' : 'Modificado por:')
                          : 'Creador:'}
                      </strong>
                    </p>
                    <p className='sm:px-0'>{modified_by || created_by}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Fecha: {new Date(created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(54, 79, 119)' }} />

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
        <div className="modal-overlay">
          <div className="modal">
            <form>
                <h2>
                {userRole === 'user' && 'Vista completa'}
                {userRole === 'tecnico' && 'Editar ticket'}
                {userRole === 'superuser' && 'Editar ticket'}
                {!['user', 'tecnico', 'superuser'].includes(userRole) && 'Nuevo Ticket'}
              </h2>
              <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(54, 79, 119)' }} />

              <div className="flex gap-4 mb-4">
                <label className="block mb-1 font-bold">
                  Edificio:
                  <input
                    type="text"
                    name="building"
                    value={selectedTicket.building}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                    disabled
                  />
                </label>
                
                <label className="block mb-1 font-bold">
                  Salón:
                  <input
                    type="text"
                    name="room"
                    value={selectedTicket.room}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                    disabled
                  />
                </label>
              </div>

              <label className="block mb-1 font-bold">
                Titulo:
                <input
                  type='text'
                  name='title'
                  value={selectedTicket.title}
                  onChange={handleChange}
                  className='w-full px-2 py-1 mt-1'
                  maxLength={50}
                  disabled={userRole === 'user'}
                ></input>
              </label>

              <label className="block mb-1 font-bold">
                Reporte:
                <textarea
                  name="report"
                  value={selectedTicket.report}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded resize-none"
                  rows={4}
                  maxLength={500}
                  disabled={userRole === 'user'}
                  readOnly={userRole === 'user'}
                />
              </label>

              <div className="flex gap-4 mb-4">
                <label className="block mb-1 font-bold">
                  Categoría:
                  <select
                    name="category"
                    value={selectedTicket.category}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                    disabled={userRole === 'user'}
                  >
                    <option value="" disabled>-- Selecciona una categoría --</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Técnico (Hardware)">Técnico (Hardware)</option>
                    <option value="Técnico (Software)">Técnico (Software)</option>
                  </select>
                </label>

                <label className="block mb-1 font-bold">
                  Estado:
                  <select
                    name="status"
                    value={selectedTicket.status}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                    disabled={userRole === 'user'}
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </label>
              </div>
              <label className="block mb-1 font-bold">
                  Prioridad:
              </label>
                  <select
                    name="priority"
                    value={selectedTicket.priority}
                    onChange={handleChange}
                    className="border rounded w-32 px-2 py-1 mt-1 mb-2"
                    disabled={userRole === 'user'}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type='button'
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type='button'
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
                  type='button'
                  onClick={handleSave}
                  className={`px-4 py-2 rounded text-white ${
                    userRole === 'user'
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={userRole === 'user'|| isSaving}
                >
                  Guardar
                </button>
              </div>
              <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(54, 79, 119)' }} />

            </form>
            
          </div>
        </div>
      )}
    </div>
  );
}