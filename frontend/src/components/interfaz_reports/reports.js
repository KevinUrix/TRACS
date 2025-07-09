import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BuildingSelect from './BuildingSelect';
import TicketsList from './TicketsList';
import API_URL from '../../config/api';

import './reports.css'; // Importa el archivo de estilos CSS


export default function Reports() {
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [reportText, setReportText] = useState('');

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(''); // Ej: Baja, Media, Alta
  const [category, setCategory] = useState('');
  
  const [refreshTickets, setRefreshTickets] = useState(false);
  //const [refresh, setRefresh] = useState(false);
  //const toggleRefresh = () => setRefresh(prev => !prev);

  const [classrooms, setClassrooms] = useState([]);

  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Quill - Reportes";
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTicket = async () => {

    if (isSaving) return; // Evita clics múltiples
    setIsSaving(true); // Inicia la "protección"

    if (!selectedBuilding) {
      toast.error('Selecciona un edificio antes de guardar');
      return;
    }
    if (!selectedRoom) {
      toast.error('Selecciona un salón antes de guardar');
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
      room: selectedRoom,
      title: title.trim(),
      category: category.trim(),
      priority,
      report: reportText.trim(),
      created_by: creator,
    };

    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          navigate("/");
          return;
        }
        else if (response.status === 400) {
          localStorage.clear();
          window.location.href = '/';
          return;
        }
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
    } finally {
      setIsSaving(false); // Vuelve a permitir guardar
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
    if (!selectedBuilding) return;

    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/classrooms?buildingName=${selectedBuilding}`);
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

      <div className="main-content flex-2 flex flex-col">
        {/*<NavbarGlobal/>*/}

          <div className="p-2 mt-0 sm:mt-0 md:mt-1 lg:mt-6 max-w-7xl mx-auto w-full overflow-x-auto overflow-y-hidden">
              {/* Selector de edificio y botón de agregar */}
            <div className="p-4 select-container-reports flex md:flex-row items-center justify-between gap-4 mb-1 sm:flex-row">
              {/* Edificio a la izquierda */}
              <BuildingSelect
                selectedBuilding={selectedBuilding}
                onChange={handleBuildingChange}
                className="building-select"
              />

                {/* Contenedor para los dos selects juntos a la derecha */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="category-select"
                  >
                    <option value="Todos">Todas las categorias 🌐</option>
                    <option value="Mantenimiento">Mantenimiento 🛠️</option>
                    <option value="Limpieza">Limpieza 🧹</option>
                    <option value="Técnico (Hardware)">Técnico (Hardware) 🖥️</option>
                    <option value="Técnico (Software)">Técnico (Software) 🧑‍💻</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-select"
                  >
                    <option value="Todos">Todos los estados 🔃</option>
                    <option value="Abierto">Abierto 🔴</option>
                    <option value="En Proceso">En proceso 🟠</option>
                    <option value="Cerrado">Cerrado 🟢</option>
                  </select>
                {selectedBuilding && (
                  <button
                    type='button'
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-2.5 shadow transition-transform hover:scale-105 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                    </svg>
                    Agregar Ticket
                  </button>
                )}
              </div>
            </div>
            {/* Lista de tickets */}
          <div className="bg-white p-2 mb-2 rounded-lg shadow-md max-w-7xl w-full mx-auto min-w-7xl max-h-7xl min-h-7xl custom-shadow-border"> 
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
          <div className="modal-overlay">
            <div className="modal">
              <form>
                  <h2 className="text-lg font-semibold mb-4 text-center text-blue-900">Nuevo Ticket</h2>
                <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(54, 79, 119)' }} />

                <div className="flex gap-4 mb-4">
                  <div>
                    <label className="block mb-1 font-bold">Edificio:</label>
                    <select 
                      value={selectedBuilding}  
                      className="w-full mr-48 px-2 py-1 mt-1"
                      disabled
                    >
                      <option>{selectedBuilding || 'Selecciona un edificio'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">Salón:</label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full px-2 py-1 mt-1"
                      required
                    >
                      <option value="" disabled>Selecciona un salón...</option>
                      {classrooms.map((room, index) => (
                        <option key={index} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-bold">Título:</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2 py-1 mt-1"
                    placeholder="Ej. Problema con el proyector"
                    maxLength={50}
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1 font-bold">Reporte:</label>
                  <textarea 
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded resize-none"
                    rows={3}
                    placeholder="Escribe el reporte aquí..."
                    maxLength={500}
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type='button' 
                    onClick={handleCancel} 
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type='button' 
                    onClick={handleSaveTicket} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={isSaving}
                  >
                    Guardar Ticket
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
