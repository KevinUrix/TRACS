import { handlePrint } from './utils';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_URL from '../../config/api';
import DownloadButton from './downloadButton';
import InstructionsButton from './instructionsButton';
import PrintButton from './printButton';
import SearchProfessor from './SearchProfessor';
import StatisticButton from './statisticButton';
import ViewReservationsButton from './viewReservationsButton';

import './calendar.css'; // Importa el archivo de estilos CSS

export default function SelectsLogic({ onUpdateBuilding, onUpdateDay, onUpdateCycle, fetchReservations, reservations, isStatisticMode, setIsStatisticMode }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [cycle, setCycle] = useState([]);
  const [building, setBuilding] = useState([]);
  const [loadingCycle, setLoadingCycle] = useState(false);
  const role = localStorage.getItem('role');


  // const [allReservations, setAllReservations] = useState([]);
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

  // Intentar cargar ciclos del sessionStorage
  const cachedCycles = sessionStorage.getItem(cacheKey);

  if (cachedCycles) {
    try {
      const parsed = JSON.parse(cachedCycles);
      setCycle(parsed);
      return; // Si ya hay cache, no hacemos fetch
    } catch (error) {
      console.warn('Cache de ciclos corrupto, se elimina y se recarga', error);
      sessionStorage.removeItem(cacheKey);
    }
  }

  // Si no hay cache válido, hacemos fetch
  const fetchCycles = async () => {
    setLoadingCycle(true);
    try {
      const response = await fetch(`${API_URL}/api/cycles`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setCycle(data);

      // Guardar en sessionStorage para futuros usos
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error cargando los ciclos:", error);
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
        const prioritized = buildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = buildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");
        
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
        if (res.status === 403) {
          toast.error("Se ha cerrado tu sesión. Vuelve a iniciarla.");
          throw new Error(`Error HTTP: ${res.status}`);
        }
      }
  
      const result = await res.json();
  
      if (result.success) {
        const summary = result.result;
        let message = '✅ Los archivos JSON se han descargado correctamente.\n\n';
        message += `Éxito: ${summary.success.length} edificios\n`;
        message += `Saltados: ${summary.skipped.length} edificios (sin datos)\n`;
        message += `Fallidos: ${summary.failed.length} edificios\n`;
  
        if (summary.failed.length > 0) {
          message += '\nDetalles de errores:\n';
          summary.failed.forEach(failure => {
            message += `${failure.building}: ${failure.error}\n`;
          });
        }
  
        alert(message);
      } else {
        alert(`⚠️ Hubo un error al descargar los archivos: ${result.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("❌ Error durante la descarga:", error);
      alert(`❌ Error inesperado: ${error.message}`);
    }
  };

  const userRole = localStorage.getItem("role"); // Para obtener el rol de la cuenta.

  return (
    <div className="flex flex-col sm:flex-row flex-wrap -gap-1 my-5 sm:pl-6 mt-8 items-start space-x-6 selects-container-responsive">
      <div className="select-container">
        <select
          value={selectedCycle}
          onChange={handleCycleChange}
          className="cycle-select sm:w-auto select-responsive"
          disabled={loadingCycle}
        >
          {loadingCycle ? (
            <option value="">Cargando ciclos...⌛</option> // Mensaje de carga
          ) : (
            <>
              <option value="" disabled>Selecciona un ciclo 📅</option>
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
        >
          <option value="" disabled>Selecciona un edificio 🏢</option>
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

      {userRole === 'superuser' && (
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
        />
      </div>

      <div className="-ml-6">
        <StatisticButton
          isStatisticMode={isStatisticMode}
          setIsStatisticMode={setIsStatisticMode}
          selectedCycle={selectedCycle}
          selectedBuilding={selectedBuilding}
        />
      </div>

      {role !== 'superuser' && (
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