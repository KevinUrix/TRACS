import { useState, useEffect } from 'react';
import InstructionsButton from './instructionsButton'; // Importa el componente
import './calendar.css'; // Importa el archivo de estilos CSS

export default function CalendarLogic({ onUpdateBuilding, onUpdateDay, onUpdateCicle }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCicle, setSelectedCicle] = useState('');
  const [cicle, setCicle] = useState([]);

  // Se verifica el día de la semana en el que estamos.
  useEffect(() => {
    const today = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeek = today.getDay();
    setSelectedDay(days[dayOfWeek]);
    onUpdateDay(days[dayOfWeek]);
  }, [onUpdateDay]);

  useEffect(() => {
    // Cargar los datos del JSON local
    fetch("data/selects/cicles.json")
        .then(response => response.json())
        .then(data => setCicle(data))
        .catch(error => console.error("Error cargando los ciclos:", error));
  }, []);

  const handleCicleChange = (e) => {
    setSelectedCicle(e.target.value);
    onUpdateCicle(e.target.value);
  };

  const handleBuildingChange = (e) => {
    setSelectedBuilding(e.target.value);
    onUpdateBuilding(e.target.value);
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    onUpdateDay(e.target.value);
  };

  return (
    <div className="flex space-x-6 my-10 pl-6 mt-10">
      <div className="select-container">
        <select
          value={selectedCicle}
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
          <option value="Edificio 1">Edificio 1</option>
          <option value="Edificio 2">Edificio 2</option>
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

      {/* Componente InstructionsButton */}
      <InstructionsButton />
    </div>
  );
}
