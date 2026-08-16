import { getDecodedToken } from '../../utils/auth';
import { handlePrint } from './utils';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import DownloadButton from './downloadButton';
import PrintButton from './printButton';
import InstructionsButton from './instructionsButton';
import SearchProfessor from './SearchProfessor';
import StatisticButton from './statisticButton';
import ViewReservationsButton from './viewReservationsButton';
import './calendar.css'; 

export default function SelectsLogic({ onUpdateBuilding, onUpdateDay, onUpdateCycle, fetchReservations, reservations, isStatisticMode, setIsStatisticMode, isPrintMode, setIsPrintMode, fullSchedule }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [cycle, setCycle] = useState([]);
  const [building, setBuilding] = useState([]);
  const [loadingCycle, setLoadingCycle] = useState(false);
  
  const decoded = getDecodedToken();
  const role = decoded?.role ?? null;

  useEffect(() => {
    const savedState = sessionStorage.getItem('reservationState');
    if (savedState) {
      const { selectedCycle, selectedBuilding } = JSON.parse(savedState);
      setSelectedCycle(selectedCycle);
      setSelectedBuilding(selectedBuilding);
    }
  }, []); 

  const dayMappings = {
    "Domingo": "D", "Lunes": "L", "Martes": "M", "Miércoles": "I",
    "Jueves": "J", "Viernes": "V", "Sábado": "S"
  };

  useEffect(() => {
    const today = new Date();
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayName = today.getDay() === 0 ? "Lunes" : daysOfWeek[today.getDay()];
    setSelectedDay(dayName);
    onUpdateDay(dayMappings[dayName]); 
  }, [onUpdateDay]);

  /* ---------- CARGAR CICLOS CON CACHÉ ---------- */
  useEffect(() => {
    const cachedCycles = sessionStorage.getItem('cached_cycles');
    if (cachedCycles) {
      try {
        const parsed = JSON.parse(cachedCycles);
        if (parsed && parsed.length > 0) {
          setCycle(parsed);
          return; // Si hay caché, detenemos la ejecución aquí
        }
      } catch (e) {
        console.warn("Caché de ciclos corrupto, recargando...");
      }
    }

    const loadLocalCycles = async () => {
      try {
        const localResponse = await fetch(`${API_URL}/api/cycles/local`);
        if (!localResponse.ok) throw new Error(`Archivo local no encontrado: ${localResponse.status}`);
        const localData = await localResponse.json();
        if (Array.isArray(localData) && localData.length > 0) {
          setCycle(localData);
          sessionStorage.setItem('cached_cycles', JSON.stringify(localData)); // Guardar fallback local en caché
        }
      } catch (error) {
        setCycle([]);
      }
    };

    const fetchCycles = async () => {
      setLoadingCycle(true);
      try {
        const response = await fetch(`${API_URL}/api/cycles`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCycle(data);
          sessionStorage.setItem('cached_cycles', JSON.stringify(data)); // Guardamos en caché los ciclos
        } else {
          await loadLocalCycles();
        }
      } catch (error) {
        await loadLocalCycles();
      } finally {
        setLoadingCycle(false);
      }
    };

    fetchCycles();
  }, []);

  /* ---------- CARGAR EDIFICIOS ---------- */
  useEffect(() => {
    fetch(`${API_URL}/api/buildings`)
      .then(response => response.json())
      .then(data => {
        const buildings = data.edifp || [];
        const filteredBuildings = buildings.filter(b => b.value !== "DESV1" && b.value !== "DESV2");
        const prioritized = filteredBuildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = filteredBuildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");
        setBuilding([...prioritized, ...rest]);
      })
      .catch(error => console.error("Error cargando edificios:", error));
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
    if (!selectedCycle) return toast.error('Debes seleccionar un ciclo.');
    try {
      const res = await fetch(`${API_URL}/api/descargar-json?cycle=${selectedCycle}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          localStorage.clear();
          window.location.href = `/login`;
          return;
        }
      }
      const result = await res.json();
      if (result.success) {
        const { buildings, cycles } = result.result;
        let message = `Estado de los archivos JSON.\n\nEdificios:\nÉxito: ${buildings.success.length}\nVacíos: ${buildings.empty.length}\nCorruptos: ${buildings.skipped.length}\nFallidos: ${buildings.failed.length}\n\n`;
        message += cycles?.success ? `Ciclos guardados.` : `No se guardaron ciclos.`;
        alert(message);
      } else {
        alert(`Error: ${result.error || "Desconocido"}`);
      }
    } catch (error) {
      alert(`Error inesperado: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap -gap-1 my-5 sm:pl-6 mt-8 items-start space-x-6 selects-container-responsive">
      <div className="select-container">
        <select value={selectedCycle} onChange={handleCycleChange} className="cycle-select sm:w-auto select-responsive" disabled={loadingCycle}>
          {loadingCycle ? <option value="">Cargando... ⌛</option> : (
            <><option className='text-gray-900' value="" disabled>Selecciona un ciclo 📅</option>
              {cycle.map((c) => <option key={c.value} value={c.value}>{c.text}</option>)}
            </>
          )}
        </select>
        <select value={selectedBuilding} onChange={handleBuildingChange} className="building-select sm:w-auto select-responsive" disabled={!selectedCycle}>
          <option className='text-gray-900' value="" disabled>Selecciona un edificio 🏢</option>
            {building.map((b, i) => <option key={i} value={b.value}>{b.text}</option>)}
        </select>
        <select value={selectedDay} onChange={handleDayChange} className="day-select sm:w-auto select-responsive">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day) => <option key={day} value={day}>{day} ☀️</option>)}
        </select>
      </div>

      {role === 'superuser' && <DownloadButton onDownload={handleDownload} />}

      <div className="-ml-6">
        <ViewReservationsButton reservations={reservations} selectedCycle={selectedCycle} selectedBuilding={selectedBuilding} fetchReservations={fetchReservations} />
      </div>
      <div className="-ml-6">
        <PrintButton selectedBuilding={selectedBuilding} selectedDay={selectedDay} selectedCycle={selectedCycle} onPrint={handlePrint} isPrintMode={isPrintMode} setIsPrintMode={setIsPrintMode} isStatisticMode={isStatisticMode} />
      </div>
      <div className="-ml-6">
        <StatisticButton isStatisticMode={isStatisticMode} setIsStatisticMode={setIsStatisticMode} selectedCycle={selectedCycle} selectedBuilding={selectedBuilding} isPrintMode={isPrintMode} setIsPrintMode={setIsPrintMode} />
      </div>
      {(role !== 'superuser' && role !== 'tecnico' && role !== 'user') && (
        <div className="-ml-6"><InstructionsButton /></div>
      )}
      <div className='-ml-2'>
        <SearchProfessor selectedCycle={selectedCycle} fullSchedule={fullSchedule} />
      </div>
    </div>
  );
}