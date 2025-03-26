import { useState, useEffect } from 'react';
import InstructionsButton from './instructionsButton'; // Importa el componente

export default function CalendarLogic({ onUpdateBuilding, onUpdateDay, onUpdateCicle }) {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('Edificio 1');
  const [selectedCicle, setSelectedCicle] = useState('Cicle 1');

  // Se verifica el dia de la semana en el que estamos.
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
    <div className="flex space-x-6 my-20 pl-6 mt-30"> {/* Alineación hacia la izquierda con margen */}
      <select
        value={selectedCicle}
        onChange={handleCicleChange}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="Cicle 1">2025-A</option>
        <option value="Cicle 2">2024-B</option>
        <option value="Cicle 3">2024-A</option>
        <option value="Cicle 4">2023-B</option>
      </select>
      <select
        value={selectedBuilding}
        onChange={handleBuildingChange}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="Edificio 1">Edificio 1</option>
        <option value="Edificio 2">Edificio 2</option>
      </select>

      <div className="relative">
        <select
          value={selectedDay}
          onChange={handleDayChange}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* Componente InstructionsButton */}
      <InstructionsButton />
    </div>
  );
}
