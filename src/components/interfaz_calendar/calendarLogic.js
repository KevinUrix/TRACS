import { useState, useEffect } from 'react';
import InstructionsButton from './instructionsButton'; // Importa el componente
import DownloadButton from './downloadButton';
import ViewReservationsButton from './viewReservationsButton';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function CalendarLogic({ onUpdateBuilding, onUpdateDay, onUpdateCicle }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [cicle, setCicle] = useState([]);
  const [building, setBuilding] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  
  

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
    const dayName = daysOfWeek[today.getDay()];
    setSelectedDay(dayName);
    onUpdateDay(dayMappings[dayName]); 
  }, [onUpdateDay]);

  useEffect(() => {
    //  CICLOS
    // 
    // Cargar los datos del JSON por API con fetch
    // fetch("http://localhost:3030/")
    // 
    // 
    // Modificar el fetch para obtener datos locales
    fetch("data/selects/cicles.json")
        .then(response => response.json())
        .then(data => setCicle(data))
        .catch(error => console.error("Error cargando los ciclos:", error));
  }, []);

  // EDIFICIOS
  useEffect(() => {
    fetch("data/selects/buildings.json")
        .then(response => response.json())
        .then(data => {
          const buildings = data.edifp || [];
          const lastTwo = buildings.slice(-2); // Obtenemos las últimas dos opciones
          const rest = buildings.slice(0, -2); // Las opciones faltantes
          const newBuildingsOrder = [...lastTwo, ...rest];
          setBuilding(newBuildingsOrder);
        })
        .catch(error => console.error("Error cargando los edificios:", error));
  }, []);

  const handleCicleChange = (e) => {
    setSelectedCycle(e.target.value);
    onUpdateCicle(e.target.value);
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
      alert('Por favor, selecciona un ciclo.');
      return;
    }
  
    try {
      const res = await fetch(`http://localhost:3001/api/descargar-json?cycle=${selectedCycle}`);
  
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
  
      const result = await res.json();
  
      if (result.success) {
        alert('Los archivos JSON se han descargado correctamente.');
      } else {
        alert('Hubo un error al descargar los archivos.');
      }
    } catch (error) {
      console.log("Descargando . . .")
    }
  };

  const refetchReservations = async () => {
    if (!selectedCycle || !selectedBuilding) return;
  
    const path = `data/reservations/${selectedCycle}/${selectedBuilding}.json`;
  
    try {
      const response = await fetch(path);
  
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo: ${path}`);
      }
  
      const json = await response.json();
      setAllReservations(json.data || []);
    } catch (err) {
      console.error("Error cargando reservas:", err);
      setAllReservations([]);
    }
  };
  


  useEffect(() => {
    refetchReservations();
  }, [selectedCycle, selectedBuilding]);  


  return (
    <div className="flex space-x-6 my-10 pl-6 mt-10">
      <div className="select-container">
        <select
          value={selectedCycle}
          onChange={handleCicleChange}
          className="cicle-select"
        >
          <option value="" disabled>Selecciona un ciclo</option>
            {cicle.map((cicle) => (
              <option key={cicle.value} value={cicle.value}>{cicle.text}</option>
            ))}
        </select>
        <span>📅</span>
      </div>

      <div className="select-container">
        <select
          value={selectedBuilding}
          onChange={handleBuildingChange}
          className="building-select"
        >
          <option value="" disabled>Selecciona un edificio</option>
          {building.map((building, index) => (
            <option key={index} value={building}>{building}</option>
          ))}
        </select>
        <span>🏢</span>
      </div>
      <div className="select-container">
      <select
        value={selectedDay}
        onChange={handleDayChange}
        className="day-select"
      >
        {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day) => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
        <span>📆</span>
      </div>

      <DownloadButton onDownload={handleDownload}/>

      <div className="-ml-6">
        <ViewReservationsButton
          allReservations={allReservations}
          selectedCycle={selectedCycle}
          selectedBuilding={selectedBuilding}
          refetchReservations={refetchReservations}
        />
      </div>

      {/* Componente InstructionsButton */}
      <InstructionsButton />
    </div>
  );
}
