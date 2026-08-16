import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function StatisticButton({ isStatisticMode, setIsStatisticMode, selectedCycle, selectedBuilding, isPrintMode, setIsPrintMode }) {
  const [scaleFix, setScaleFix] = useState(1);

  useEffect(() => {
    const adjustScale = () => {
      const zoomLevel = window.devicePixelRatio || 1;
      setScaleFix(zoomLevel < 1 ? 1 / zoomLevel : 1);
    };
    adjustScale();
    window.addEventListener('resize', adjustScale);
    return () => window.removeEventListener('resize', adjustScale);
  }, []);

  const handleClick = () => {
    if (!selectedBuilding || !selectedCycle) {
      toast.error('Debes seleccionar un ciclo y un edificio.');
      return;
    }
    setIsStatisticMode(!isStatisticMode);
    if (isPrintMode) {
      setIsPrintMode(!isPrintMode);
    }
  };

  return (
    <div className="relative group">
      <button onClick={handleClick} className="background-button1 rounded-full px-4 py-2 shadow-md text-white transition duration-200">
        <b>{isStatisticMode ? 'Volver al calendario 📆' : 'Conteo de alumnos 📊'}</b>
      </button>
      
      <span 
        className="absolute left-1/2 top-full mt-2 text-base font-medium bg-gray-700 text-white px-4 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 span-info pointer-events-none origin-top"
        style={{ transform: `translateX(-50%) scale(${scaleFix})` }}
      >
        {isStatisticMode ? 'Volver a tabla de clases.' : 'Mostrar contador.'}
      </span>
    </div>
  );
}