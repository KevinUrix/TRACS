import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { handlePrint } from './utils';

// PrintButton.js
export default function PrintButton({ selectedBuilding, selectedDay, selectedCycle, onPrint }) {
  const handleClick = () => {
    onPrint(selectedBuilding, selectedDay, selectedCycle);
  };

  return (
    <button onClick={handleClick} className="bg-purple-500 rounded-full px-3 py-1 shadow-md text-white">
      <b>Imprimir tabla 🖨️</b>
    </button>
  );
}
