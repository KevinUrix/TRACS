import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InstructionsButton from './instructionsButton'; // Importa el componente
import DownloadButton from './downloadButton';
import ViewReservationsButton from './viewReservationsButton';
import PrintButton from './printButton';
import StatisticButton from './statisticButton';
import { handlePrint } from './utils';
import { toast } from 'react-toastify';

import './calendar.css'; // Importa el archivo de estilos CSS

export default function SelectsLogic({ onUpdateBuilding, onUpdateDay, onUpdateCycle, fetchReservations, reservations, isStatisticMode, setIsStatisticMode }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [cycle, setCycle] = useState([]);
  const [building, setBuilding] = useState([]);
  const [loadingCycle, setLoadingCycle] = useState(false);

  // const [allReservations, setAllReservations] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      setSelectedCycle(location.state.selectedCycle);
      setSelectedBuilding(location.state.selectedBuilding);
      setSelectedDay(location.state.selectedDay);
    }
  }, [location.state]);


  useEffect(() => {
    // Recuperar el estado de los selects desde sessionStorage
    const savedState = sessionStorage.getItem('reservationState');
    if (savedState) {
      const { selectedCycle, selectedBuilding, selectedDay } = JSON.parse(savedState);
  
      setSelectedCycle(selectedCycle);
      setSelectedBuilding(selectedBuilding);
      setSelectedDay(selectedDay);
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
    const fetchCycles = async () => {
      setLoadingCycle(true);
      try {
        const response = await fetch("/api/cycles");
        const data = await response.json();
        setCycle(data);
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
    fetch("/api/buildings")
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
      const res = await fetch(`/api/descargar-json?cycle=${selectedCycle}`);
  
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
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
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 my-5 sm:pl-6 mt-10 items-start space-x-6 selects-container-responsive">
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

      <div className="-ml-6">
        {/* Componente InstructionsButton */}
        <InstructionsButton />
      </div>
    </div>
  );
}