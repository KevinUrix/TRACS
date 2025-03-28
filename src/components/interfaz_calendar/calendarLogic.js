import { useState, useEffect } from 'react';
import InstructionsButton from './instructionsButton'; // Importa el componente
import './calendar.css'; // Importa el archivo de estilos CSS

export default function CalendarLogic({ onUpdateBuilding, onUpdateDay, onUpdateCicle }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedCicle, setSelectedCicle] = useState('');

  // Se verifica el día de la semana en el que estamos.
  useEffect(() => {
    const today = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeek = today.getDay();
    setSelectedDay(days[dayOfWeek]);
    onUpdateDay(days[dayOfWeek]);
  }, [onUpdateDay]);

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
          <option value="Cicle 1">2025-A</option>
          <option value="Cicle 2">2024-B</option>
          <option value="Cicle 3">2024-A</option>
          <option value="Cicle 4">2023-B</option>
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
