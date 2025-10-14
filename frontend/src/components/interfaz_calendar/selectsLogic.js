import { getDecodedToken } from '../../utils/auth';
import { handlePrint } from './utils';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_URL from '../../config/api';
import DownloadButton from './downloadButton';
import PrintButton from './printButton';
import InstructionsButton from './instructionsButton';
import SearchProfessor from './SearchProfessor';
import StatisticButton from './statisticButton';
import ViewReservationsButton from './viewReservationsButton';

import './calendar.css'; // Importa el archivo de estilos CSS

export default function SelectsLogic({ onUpdateBuilding, onUpdateDay, onUpdateCycle, fetchReservations, reservations, isStatisticMode, setIsStatisticMode, isPrintMode, setIsPrintMode }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [cycle, setCycle] = useState([]);
  const [building, setBuilding] = useState([]);
  const [loadingCycle, setLoadingCycle] = useState(false);
  const decoded = getDecodedToken();
  const role = decoded?.role ?? null;

  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      setSelectedCycle(location.state.selectedCycle);
      setSelectedBuilding(location.state.selectedBuilding);
    }
  }, [location.state]);


  useEffect(() => {
    // Recuperar el estado de los selects desde sessionStorage
    const savedState = sessionStorage.getItem('reservationState');
    if (savedState) {
      const { selectedCycle, selectedBuilding } = JSON.parse(savedState);
  
      setSelectedCycle(selectedCycle);
      setSelectedBuilding(selectedBuilding);
    }
  }, []); // Se ejecuta solo una vez cuando el componente se monta
  
  

  const dayMappings = {
    "Domingo": "D",
    "Lunes": "L",
    "Martes": "M",
    "Miércoles": "I",
    "Jueves": "J",
    "Viernes": "V",
    "Sábado": "S"
  };


  // Se verifica el día de la semana en el que estamos.
  useEffect(() => {
    const today = new Date();
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayName = today.getDay() === 0 ? "Lunes" : daysOfWeek[today.getDay()];
    setSelectedDay(dayName);
    onUpdateDay(dayMappings[dayName]); 
  }, [onUpdateDay]);


  // CICLOS
  useEffect(() => {
  const cacheKey = 'cycles_cache';

  const loadLocalCycles = async () => {
    try {
      const localResponse = await fetch(`${API_URL}/api/cycles/local`);
      if (!localResponse.ok) throw new Error(`Archivo local no encontrado: ${localResponse.status}`);

      const localData = await localResponse.json();

      if (Array.isArray(localData) && localData.length > 0) {
        setCycle(localData);
        sessionStorage.setItem(cacheKey, JSON.stringify(localData));
        console.warn("Ciclos cargados desde archivo local y guardados en cache.");
      } else {
        console.error("El archivo local no contiene un array válido:", localData);
      }
    } catch (error) {
      console.error("Error al cargar ciclos locales de respaldo:", error);
      setCycle([]);
    }
  };

  const fetchCycles = async () => {
    // 1. Verificar en sessionStorage
    const cachedCycles = sessionStorage.getItem(cacheKey);
    if (cachedCycles) {
      try {
        const parsed = JSON.parse(cachedCycles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("Ciclos cargados desde sessionStorage");
          setCycle(parsed);
          return;
        } else {
          console.warn("Ciclos en cache vacíos o corruptos, se eliminan");
          sessionStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.warn("Error al parsear ciclos en cache:", error);
        sessionStorage.removeItem(cacheKey);
      }
    }

    // 2. Hacer fetch al backend
    setLoadingCycle(true);
    try {
      const response = await fetch(`${API_URL}/api/cycles`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCycle(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        console.log("Ciclos cargados desde el backend y guardados en cache.");
      } else {
        console.warn("Respuesta vacía del backend. Intentando archivo local...");
        await loadLocalCycles();
      }
    } catch (error) {
      console.error("Error al obtener ciclos desde el backend:", error);
      await loadLocalCycles();
    } finally {
      setLoadingCycle(false);
    }
  };

  fetchCycles();
  }, []);



  // EDIFICIOS
  useEffect(() => {
    fetch(`${API_URL}/api/buildings`)
      .then(response => response.json())
      .then(data => {
        const buildings = data.edifp || [];
        // Filtra para que no tome en cuenta las clases virtuales
        const filteredBuildings = buildings.filter(b => b.value !== "DESV1" && b.value !== "DESV2");
        const prioritized = filteredBuildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = filteredBuildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");
        
        // Combinamos y actualizamos el estado
        const newBuildingsOrder = [...prioritized, ...rest];
        setBuilding(newBuildingsOrder);
      })
      .catch(error => console.error("Error cargando los edificios:", error));
  }, []);

  const handleCycleChange = (e) => {
    setSelectedCycle(e.target.value);
    onUpdateCycle(e.target.value);
  };

  const handleBuildingChange = (e) => {
    setSelectedBuilding(e.target.value);
    onUpdateBuilding(e.target.value);
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    onUpdateDay(dayMappings[e.target.value]);
  };


  const handleDownload = async () => {
    if (!selectedCycle) {
      toast.error('Debes seleccionar un ciclo.');
      return;
    }
  
    try {
      const res = await fetch(`${API_URL}/api/descargar-json?cycle=${selectedCycle}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
  
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }
      }
  
      const result = await res.json();
  
      if (result.success) {
        const { buildings, cycles } = result.result;
        
        let message = '📢 Estado de los archivos JSON.\n\n';
        // Información de edificios
        message += `📚 Edificios:\n`;
        message += `✅ Éxito: ${buildings.success.length} edificios\n`;
        message += `⚠️ Vacíos: ${buildings.empty.length} edificios\n`;
        message += `🗑️ Corruptos: ${buildings.skipped.length} edificios\n`;
        message += `❌ Fallidos: ${buildings.failed.length} edificios\n`;

        // Información de ciclos
        if (cycles?.success) {
          message += `\n📅 Ciclos guardados`;
        } else {
          message += `\n❌ No se pudieron guardar los ciclos.`;
        }
  
        alert(message);
      } else {
        alert(`⚠️ Hubo un error al descargar los archivos: ${result.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error durante la descarga:", error);
      alert(`❌ Error inesperado: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap -gap-1 my-5 sm:pl-6 mt-8 items-start space-x-6 selects-container-responsive">
      <div className="select-container">
        <select
          value={selectedCycle}
          onChange={handleCycleChange}
          className="cycle-select sm:w-auto select-responsive"
          disabled={loadingCycle}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault(); // Evita cambiar con las flechas
            }
          }}
        >
          {loadingCycle ? (
            <option value="">Cargando ciclos...⌛</option> // Mensaje de carga
          ) : (
            <>
              <option className='text-gray-900' value="" disabled>Selecciona un ciclo 📅</option>
              {cycle.map((cycle) => (
                <option key={cycle.value} value={cycle.value}>{cycle.text}</option>
              ))}
            </>
          )}
        </select>
        <select
          value={selectedBuilding}
          onChange={handleBuildingChange}
          className="building-select sm:w-auto select-responsive"
          disabled={!selectedCycle}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault(); // Evita cambiar con las flechas
            }
          }}
        >
          <option className='text-gray-900' value="" disabled>Selecciona un edificio 🏢</option>
            {building.map((building, index) => (
              <option key={index} value={building.value}>{building.text}</option>
            ))}
        </select>
        <select
          value={selectedDay}
          onChange={handleDayChange}
          className="day-select sm:w-auto select-responsive"
        >
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day) => (
            <option key={day} value={day}>{day} ☀️</option>
          ))}
        </select>
      </div>

      {role === 'superuser' && (
        <DownloadButton onDownload={handleDownload} />
      )}

      <div className="-ml-6">
        <ViewReservationsButton
          reservations={reservations}
          selectedCycle={selectedCycle}
          selectedBuilding={selectedBuilding}
          fetchReservations={fetchReservations}
        />
      </div>

      <div className="-ml-6">
        <PrintButton
          selectedBuilding={selectedBuilding}
          selectedDay={selectedDay}
          selectedCycle={selectedCycle}
          onPrint={handlePrint}
          isPrintMode={isPrintMode}
          setIsPrintMode={setIsPrintMode}
          isStatisticMode={isStatisticMode}
        />
      </div>

      <div className="-ml-6">
        <StatisticButton
          isStatisticMode={isStatisticMode}
          setIsStatisticMode={setIsStatisticMode}
          selectedCycle={selectedCycle}
          selectedBuilding={selectedBuilding}
          isPrintMode={isPrintMode}
          setIsPrintMode={setIsPrintMode}
        />
      </div>

      {(role !== 'superuser' && role !== 'tecnico' && role !== 'user') && (
        <div className="-ml-6">
          <InstructionsButton />
        </div>
      )}


      <div className='-ml-2'>
        <SearchProfessor
          selectedCycle={selectedCycle}
          selectedBuilding={selectedBuilding}
          selectedDay={selectedDay}
        
        />
      </div>
    </div>
  );
}