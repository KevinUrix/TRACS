import { getDecodedToken } from '../../utils/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import BASENAME from '../../config/baseName';
import PrintTicket from './PrintTicket';

export default function TicketsList({ building, refresh, onRefresh, statusFilter, categoryFilter, dateFilter, dateStart, dateEnd}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // ticket seleccionado para editar
  const [currentPage, setCurrentPage] = useState(1);
  /* 
  isSaving es para que no se guarden dos reportes desde una misma modal, el problema es que si faltan o colocas datos incorrectos NO puedes volver a presionar el botón.
  */
  // const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const [ticketToPrint, setTicketToPrint] = useState(null);

  const decoded = getDecodedToken();
  const user = decoded?.username ?? null;
  const userRole = decoded?.role ?? null;
  
  const ticketsPerPage = 9;

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus =
      statusFilter.toLowerCase() === 'todos' || ticket.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory =
      categoryFilter.toLowerCase() === 'todos' || ticket.category.toLowerCase() === categoryFilter.toLowerCase();

    // Filtro por fecha
    const createdAt = new Date(ticket.created_at);
    
    const today = new Date();
    let matchesDate = true;

    switch (dateFilter) {
      case 'dias':
        matchesDate = createdAt >= new Date(today.setDate(today.getDate() - 7));
        break;
      case 'mes':
        matchesDate = createdAt >= new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'semestre':
        matchesDate = createdAt >= new Date(today.setMonth(today.getMonth() - 6));
        break;
      case 'anio':
        matchesDate = createdAt >= new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      case 'personalizado':
        if (dateStart && dateEnd) {
          const dateS = new Date(dateStart);
          const dateE = new Date(dateEnd);
          dateE.setHours(23, 59, 59, 999); // incluir hasta el final del día
          matchesDate = createdAt >= dateS && createdAt <= dateE;
        } else {
          matchesDate = true; // si no están ambas fechas aún
        }
    break;
      case 'Todos':
      default:
        matchesDate = true;
    }
      return matchesStatus && matchesCategory && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPerPage));

  const currentUser = user || 'Desconocido'; // o el nombre que uses

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const url = building.value
          ? `${API_URL}/api/tickets/${encodeURIComponent(building.value)}`
          : `${API_URL}/api/tickets`;

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
        });
        
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            localStorage.clear();
            window.location.href = `${BASENAME}/calendar`;
            return;
          }
          throw new Error('Error al cargar reportes');
        }

        const data = await res.json();
        setTickets(data);
        setCurrentPage(1);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la lista de reportes');
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
  }, [statusFilter, categoryFilter, dateFilter]);


  // Manejar cambios en el formulario de edición
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedTicket((prev) => ({ ...prev, [name]: value }));
  };

  // Actualizar ticket
  const handleSave = async () => {
    // if (isSaving) return; // Evita clics múltiples
    // setIsSaving(true); // Inicia la "protección"
    
    try {

      const updatedTicket = {
        ...selectedTicket,
        modified_by: currentUser,
        status_changed_at: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedTicket),
      });

      if (!res.ok) {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `${BASENAME}/calendar`;
          return;
        }
        throw new Error('Error al actualizar reporte');
      }

      toast.success('Reporte actualizado');
      setSelectedTicket(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el reporte');
    } finally {
      // setIsSaving(false); // Vuelve a permitir guardar
    }
  };

  // Borrar ticket
  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres borrar este reporte?')) return;
    try {
      const res = await fetch(`${API_URL}/api/tickets/${selectedTicket.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `${BASENAME}/calendar`;
          return;
        }
        throw new Error('Error al borrar reporte');
      }
      toast.success('Reporte borrado');
      setSelectedTicket(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Error al borrar el reporte');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center text-purple-900 tracking-wide">
        {building.value ? `Reportes para ${building.text}` : 'Todos los Reportes'}
      </h2>
      <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />

      {!loading && tickets.length > 0 && filteredTickets.length === 0 && (
        <p>No se encontraron reportes con los filtros aplicados.</p>
      )}

      {loading && <p>Cargando reportes...</p>}
      {!loading && tickets.length === 0 && (
          <p>
            {building.value
              ? 'No hay reportes para este edificio.'
              : 'No hay reportes registrados.'}
          </p>
      )}

      {!loading && tickets.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            {paginatedTickets.map(({ id, building, room, title, report, priority, created_at, created_by, status, category, modified_by }) => (
              <div key={id} onClick={() =>
                  setSelectedTicket({ id, building, room, title, report, priority, created_at, created_by, status, category, modified_by })
                }
                className="relative bg-white p-4 shadow rounded cursor-pointer hover:bg-gray-100 custom-shadow-border z-2 w-98 h-88"
                >
                {/* CATEGORÍA ESTILO ETIQUETA */}
                <div
                  className={`
                    absolute -left-3 px-8 py-2 rounded-br text-white font-semibold rounded book-style 
                    ${category.includes('Mantenimiento') ? 'background-etiqueta5' :
                      category.includes('Limpieza') ? 'background-etiqueta4' :
                      category.includes('Hardware') ? 'background-etiqueta1' :
                      category.includes('Software') ? 'background-etiqueta3' :
                      'bg-gray-500'}
                  `}
                >
                  {category === "Sin categoria" 
                    ? "Sin categoría" 
                    : category.includes("Tecnico") 
                    ? category.replace("Tecnico", "Técnico") 
                    : category
                  }
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
                <div className="flex gap-28 mb-2">
                  <p><strong>Edificio:</strong> {building}</p>
                  <p><strong>Salón:</strong> {room}</p>
                </div>

                <h2 className="text-xl font-bold text-purple-900 mt-4 mb-2 line-clamp-1">{title}</h2>
                <div className='mb-2'>
                    <p><strong>Reporte:</strong></p>
                    <textarea
                        type="text"
                        className="w-full p-2 rounded resize-none custom-border-text-area"
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
          <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />

          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 background-buttonS rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-purple-600">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 background-buttonS rounded disabled:opacity-50"
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
                {userRole === 'user' && 'Editar Reporte'}
                {userRole === 'tecnico' && 'Editar Reporte'}
                {userRole === 'superuser' && 'Editar Reporte'}
                {!['user', 'tecnico', 'superuser'].includes(userRole) && 'Nuevo reporte'}
              </h2>
              <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />

              <div className="flex gap-4 mb-4">
                <label className="block mb-1">
                  <span className='font-semibold'>Edificio:</span>
                  <input
                    type="text"
                    name="building"
                    value={selectedTicket.building}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                    disabled
                  />
                </label>
                
                <label className="block mb-1">
                  <span className='font-semibold'>Salón:</span>
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

              <label className="block mb-1">
                <span className='font-semibold'>Título:</span>
                <input
                  type='text'
                  name='title'
                  value={selectedTicket.title}
                  onChange={handleChange}
                  className='w-full px-2 py-1 mt-1'
                  maxLength={90}
                ></input>
              </label>

              <label className="block mb-1">
                <span className='font-semibold'>Reporte:</span>
                <textarea
                  name="report"
                  value={selectedTicket.report}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded resize-none"
                  rows={4}
                  maxLength={2500}
                />
              </label>

              <div className="flex gap-4 mb-4">
                <label className="block mb-1">
                  <span className='font-semibold'>Categoría:</span>
                  <select
                    name="category"
                    value={selectedTicket.category}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                  >
                    <option value="" disabled>-- Selecciona una categoría --</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Tecnico (Hardware)">Técnico (Hardware)</option>
                    <option value="Tecnico (Software)">Técnico (Software)</option>
                    <option value="Sin categoria">Sin categoría</option>
                  </select>
                </label>

                <label className="block mb-1">
                  <span className='font-semibold'>Estado:</span>
                  <select
                    name="status"
                    value={selectedTicket.status}
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1"
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-4 mb-4">
                <label className="mb-1">
                    <span className='font-semibold'>Prioridad:</span>
                    <select
                      name="priority"
                      value={selectedTicket.priority}
                      onChange={handleChange}
                      className="border rounded w-32 px-2 py-1 mt-1 mb-2"
                      >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                </label>
              </div>
              <div className="p-2 mt-0 sm:mt-0 md:mt-1 lg:mt-6 w-full overflow-x-auto whitespace-nowrap">

                <div className="flex gap-6 items-center sm:justify-between lg:justify-end min-w-max">

                  <button
                    type='button'
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>

                  <button
                    type='button'
                    onClick={() => setTicketToPrint(selectedTicket)}
                    className="px-4 py-2 background-button4 text-white rounded"
                  >
                    Imprimir
                  </button>

                  <button
                    type='button'
                    onClick={handleDelete}
                    className={`px-4 py-2 rounded text-white background-button1`}
                  >
                    Borrar
                  </button>
                  <button
                    type='button'
                    onClick={handleSave}
                    className={`px-4 py-2 rounded text-white background-button3`}
                    // disabled={isSaving}
                  >
                    Guardar
                  </button>
                </div>
              </div>
              <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />

            </form>
            
          </div>
        </div>
      )}
      {ticketToPrint && (
        <PrintTicket ticket={ticketToPrint} onClose={() => setTicketToPrint(null)} />
      )}
    </div>
  );
}