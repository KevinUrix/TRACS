import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { handlePrint } from './utils';

// PrintButton.js
export default function PrintButton({ selectedBuilding, selectedDay, selectedCycle, onPrint }) {
  const handleClick = () => {
    onPrint(selectedBuilding, selectedDay, selectedCycle);
  };

  return (
    <button onClick={handleClick} className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition duration-200">
      <b>Imprimir tabla 🖨️</b>
    </button>
  );
}
