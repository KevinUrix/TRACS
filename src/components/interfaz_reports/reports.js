import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar'; // Asegúrate de que el import sea correcto
import Navbar from './navbar_reports'; // Importa el nuevo componente
import BuildingSelect from './buildingSelect';
import './reports.css'; // Importa el archivo de estilos CSS

import TicketsList from './TicketsList';

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [reportText, setReportText] = useState('');

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(''); // Ej: Baja, Media, Alta
  const [category, setCategory] = useState('');
  
  const [refreshTickets, setRefreshTickets] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const toggleRefresh = () => setRefresh(prev => !prev);

  const [classrooms, setClassrooms] = useState([]);

  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const handleSaveTicket = async () => {
    if (!selectedBuilding) {
      toast.error('Selecciona un edificio antes de guardar');
      return;
    }
    if (!reportText.trim()) {
      toast.error('El reporte no puede estar vacío');
      return;
    }
    // Guardamos el usuario para agregarlo como creador.
    const creator = localStorage.getItem('username') || 'Desconocido';

    const ticket = {
      building: selectedBuilding,
      room: selectedRoom || null,
      title: title.trim(),
      category: category.trim(),
      priority,
      report: reportText.trim(),
      created_by: creator,
    };

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar ticket');
      }

      const savedTicket = await response.json();
      console.log('Ticket guardado:', savedTicket);
      toast.success('Ticket guardado exitosamente');

      // Limpiar formulario y cerrar modal
      setShowForm(false);
      setReportText('');
      setSelectedRoom('');
      setTitle('');
      setCategory('');
      setPriority('');

      // Forzar recarga de tickets:
      setRefreshTickets(prev => !prev);

    } catch (error) {
      console.error('Error al guardar ticket:', error);
      toast.error('No se pudo guardar el ticket');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setReportText('');
    setSelectedRoom('');
    setTitle('');
    setPriority('');
    setCategory('');
  };

  const handleBuildingChange = (e) => {
  setSelectedBuilding(e.target.value);
  // Puedes hacer algo adicional aquí si necesitas usar el edificio en el form o ticketList
  };

  useEffect(() => {
    const userRole = localStorage.getItem('role');

    if (userRole !== 'superuser' && userRole !== 'user' && userRole !== 'tecnico') {
      toast.error('Debes está logeado para entrar a esta página.');
      navigate('/login');
    }
  }, [navigate]);

  // Función para mostrar/ocultar la barra lateral
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (!selectedBuilding) return;

    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`/api/classrooms?buildingName=${selectedBuilding}`);
        if (!res.ok) throw new Error('No se pudo cargar la lista de salones');
        const data = await res.json();
        setClassrooms(data);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar los salones.');
        setClassrooms([]); // Limpia si hay error
      }
    };

    fetchClassrooms();
  }, [selectedBuilding]);

  return (
<div className="bg-gray-100 flex min-h-screen">
  <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

  <div className="main-content flex-1 flex flex-col">
    <Navbar toggleSidebar={toggleSidebar} />

    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Selector de edificio y botón de agregar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <BuildingSelect 
          selectedBuilding={selectedBuilding} 
          onChange={handleBuildingChange} 
        />

        <div className="select-container">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='status-select'
          >
            <option value="Todos">Todos los estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En Proceso">En proceso</option>
            <option value="Cerrado">Cerrado</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className='category-select'
          >
            <option value="Todos">Todas las categorias</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Tecnico">Técnico</option>
          </select>
        </div>

        {selectedBuilding && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-3 shadow transition-transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Agregar Ticket
          </button>
        )}
      </div>

      {/* Lista de tickets */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <TicketsList
          building={selectedBuilding} // puede estar vacío
          refresh={refreshTickets}
          onRefresh={() => setRefreshTickets(prev => !prev)}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter} // nuevo prop
        />
      </div>
    </div>

    {/* Modal de nuevo ticket */}
    {showForm && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-md w-96">
          <h2 className="text-lg font-semibold mb-4">Nuevo Ticket</h2>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Edificio</label>
            <select 
              value={selectedBuilding}  
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
              disabled
            >
              <option>{selectedBuilding || 'Selecciona un edificio'}</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Salón</label>
            <select 
              value={selectedRoom} 
              onChange={(e) => setSelectedRoom(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="" disabled>Selecciona un salón</option>
              {classrooms.map((room, index) => (
                <option key={index} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Título</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Ej. Problema con el proyector"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Reporte</label>
            <textarea 
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded resize-none"
              rows="3"
              placeholder="Escribe el reporte aquí..."
            ></textarea>
          </div>

          {/* <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Categoría</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="" disabled>Selecciona una categoría</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Tecnico">Técnico</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Prioridad</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="" disabled>Selecciona el nivel de prioridad</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
 */}
          <div className="flex justify-end space-x-2">
            <button 
              onClick={handleCancel} 
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveTicket} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Guardar Ticket
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
}
