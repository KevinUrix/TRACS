import { getDecodedToken } from '../../utils/auth';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BuildingSelect from './BuildingSelect';
import TicketsList from './TicketsList';
import API_URL from '../../config/api';

import './reports.css'; // Importa el archivo de estilos CSS
import Footer from '../interfaz_calendar/footer';


export default function Reports() {
  const [selectedBuilding, setSelectedBuilding] = useState({ value: '', text: 'Todos los edificios 🏢' });

  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [reportText, setReportText] = useState('');

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(''); // Ej: Baja, Media, Alta
  const [category, setCategory] = useState('');
  
  const [refreshTickets, setRefreshTickets] = useState(false);

  const [classrooms, setClassrooms] = useState([]);

  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [tempDateStart, setTempDateStart] = useState('');
  const [tempDateEnd, setTempDateEnd] = useState('');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showFloatingDateModal, setShowFloatingDateModal] = useState(false);
  const [dismissedFloatingModal, setDismissedFloatingModal] = useState(false);

  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const user = decoded?.username ?? null;
  

  useEffect(() => {
    document.title = "TRACS - Reportes";
  }, []);

  /* 
  isSaving es para que no se guarden dos reportes desde una misma modal, el problema es que si faltan o colocas datos incorrectos NO puedes volver a presionar el botón.
  */
  // const [isSaving, setIsSaving] = useState(false);

  const handleSaveTicket = async () => {

    // if (isSaving) return; // Evita clics múltiples
    // setIsSaving(true); // Inicia la "protección"

    if (!selectedBuilding.value) {
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
    const creator = user || 'Desconocido';

    const ticket = {
      building: selectedBuilding.value,
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
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/calendar';
          return;
        }
        throw new Error(errorData.error || 'Error al guardar reporte');
      }

      /* const savedTicket = await response.json();
      console.log('Reporte guardado:', savedTicket); */
      toast.success('Reporte guardado exitosamente');

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
      console.error('Error al guardar reporte:', error);
      toast.error('No se pudo guardar el reporte');
    } finally {
      // setIsSaving(false); // Vuelve a permitir guardar
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

  const cancelCustomDateFilter = () => {
    setShowCustomDateModal(false);
  
    // Si el filtro sigue siendo personalizado, muestra la flotante
    if (dateFilter === 'personalizado') {
      setShowFloatingDateModal(true);
    }
  };


  const handleBuildingChange = (buildingObj) => {
    setSelectedBuilding(buildingObj);
  };


  const applyCustomDateFilter = () => {
    if (!tempDateStart || !tempDateEnd) {
      toast.error('Selecciona ambas fechas');
      return;
    }

    if (tempDateStart > tempDateEnd) {
      toast.error('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
      return false;  // o evitar aplicar el filtro
    }

    setDateStart(tempDateStart);
    setDateEnd(tempDateEnd);
    setShowCustomDateModal(false);
    setDateFilter('personalizado');
    setShowFloatingDateModal(true);
  };

  useEffect(() => {
    if (dateFilter === 'personalizado') {
      setShowFloatingDateModal(true);
    } else {
      setShowFloatingDateModal(false);
    }
  }, [dateFilter]);


  useEffect(() => {
    if (!selectedBuilding.value) return;

    const fetchClassrooms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/classrooms?buildingName=${selectedBuilding.value}`);
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

          <div className="p-2 mt-0 sm:mt-0 md:mt-1 lg:mt-6 max-w-7xl mx-auto w-full overflow-x-auto overflow-y-hidden">
              {/* Selector de edificio y botón de agregar */}
            <div className="p-4 select-container-reports flex md:flex-row items-center justify-between gap-4 mb-1 sm:flex-row">
              {/* Edificio a la izquierda */}
              <BuildingSelect
                selectedBuilding={selectedBuilding.value}
                onChange={handleBuildingChange}
                className="building-select"
              />

                {/* Contenedor para los dos selects juntos a la derecha */}
                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'personalizado') {
                        setTempDateStart(dateStart);
                        setTempDateEnd(dateEnd);
                        setShowCustomDateModal(true);
                        setDismissedFloatingModal(false);
                      } else {
                        setDateStart('');
                        setDateEnd('');
                        setDateFilter(value);
                      }
                    }}
                    className="date-select"
                  >
                    <option value="Todos">Todas las fechas 🗓️</option>
                    <option value="dias">Últimos 7 días 📅</option>
                    <option value="mes">Último mes 📅</option>
                    <option value="semestre">Último semestre 📆</option>
                    <option value="anio">Último año 📆</option>
                    <option value="personalizado">Rango personalizado ⌛</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="category-select"
                  >
                    <option value="Todos">Todas las categorias 🌐</option>
                    <option value="Mantenimiento">Mantenimiento 🛠️</option>
                    <option value="Limpieza">Limpieza 🧹</option>
                    <option value="Tecnico (Hardware)">Técnico (Hardware) 🖥️</option>
                    <option value="Tecnico (Software)">Técnico (Software) 🧑‍💻</option>
                    <option value="Sin categoria">Sin categoría 📂</option>
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
                {selectedBuilding.value && (
                  <button
                    type='button'
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 background-agregar text-white rounded-lg px-6 py-2.5 shadow transition-transform hover:scale-105 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                    </svg>
                    Agregar Reporte
                  </button>
                )}
              </div>
            </div>
            {/* Lista de tickets */}
          <div className="bg-white p-2 mb-10 rounded-lg shadow-md max-w-7xl w-full mx-auto min-w-7xl max-h-7xl min-h-7xl custom-shadow-border"> 
            <TicketsList
              building={selectedBuilding} // puede estar vacío
              refresh={refreshTickets}
              onRefresh={() => setRefreshTickets(prev => !prev)}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter} // nuevo prop
              dateFilter={dateFilter}
              dateStart={dateStart}
              dateEnd={dateEnd}
            />
          </div>
          <Footer />
        </div>

        {/* Modal de nuevo ticket */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <form>
                  <h2 className="text-lg font-semibold mb-4 text-center text-blue-900">Nuevo Reporte</h2>
                <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />

                <div className="flex gap-4 mb-4">
                  <div>
                    <label className="block mb-1">
                      <span className='font-semibold'>Edificio:</span>
                    </label>
                    <select 
                      value={selectedBuilding.value}  
                      className="w-full mr-48 px-2 py-1 mt-1"
                      disabled
                    >
                      <option>{selectedBuilding.value || 'Selecciona un edificio'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">
                      <span className='font-semibold'>Salón:</span>
                    </label>
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
                  <label className="block mb-1">
                    <span className='font-semibold'>Título:</span>
                  </label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2 py-1 mt-1"
                    placeholder="Ej. Problema con el proyector"
                    maxLength={90}
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1">
                    <span className='font-semibold'>Reporte:</span>
                  </label>
                  <textarea 
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded resize-none"
                    rows={4}
                    placeholder="Escribe el reporte aquí..."
                    maxLength={2500}
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
                    className="px-4 py-2 background-agregar text-white rounded"
                    // disabled={isSaving}
                  >
                    Guardar Reporte
                  </button>
                </div>
                <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />
              </form> 
            </div>
          </div>
        )}
        {showCustomDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
              <h3 className="text-lg font-bold mb-4">Rango personalizado</h3>
              <label className="block text-gray-700 font-medium mb-1" htmlFor="from">
                Desde:
              </label>
              <input
                type="date"
                value={tempDateStart}
                onChange={(e) => setTempDateStart(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />
              <label className="block text-gray-700 font-medium mb-1" htmlFor="to">
                Hasta:
              </label>
              <input
                type="date"
                value={tempDateEnd}
                onChange={(e) => setTempDateEnd(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelCustomDateFilter}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyCustomDateFilter}
                  className="px-4 py-2 background-aplicar text-white rounded"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
        {showFloatingDateModal && !dismissedFloatingModal && (
          <div
            className="fixed top-40 right-6 z-50 cursor-pointer"
            onClick={() => {
              setShowFloatingDateModal(false);
              setShowCustomDateModal(true);
            }}
          >
            <div className="bg-white rounded-lg shadow-lg p-4 w-60 custom-shadow-border-reports text-center relative">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // evita que se abra la modal si se presiona cerrar
                  setDismissedFloatingModal(true);
                }}
                className="absolute top-1 right-2 text-gray-500 hover:text-red-500 text-sm"
              >
                ✖
              </button>
              <p className="text-gray-700 text-base">🕐 Haz clic para modificar el rango</p>
            </div>
          </div>
        )}
    </div>
  );
}
