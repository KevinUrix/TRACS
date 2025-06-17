import { toast } from 'react-toastify';

export default function StatisticButton({ isStatisticMode, setIsStatisticMode, selectedCycle, selectedBuilding }) {
  const handleClick = () => {
    if (!selectedBuilding || !selectedCycle) {
      toast.error('Debes seleccionar un ciclo y un edificio.');
      return;
    }
    setIsStatisticMode(!isStatisticMode);
  };

  return (
    <div className="relative group">
      <button onClick={handleClick} className="bg-pink-600 hover:bg-pink-700 rounded-full px-4 py-2 shadow-md text-white transition duration-200">
        <b>{isStatisticMode ? 'Volver al Calendario 📆' : 'Conteo de alumnos 📊'}</b>
      </button>
      <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
        {isStatisticMode ? 'Volver a tabla de clases.' : 'Mostrar contador.'}
      </span>
    </div>
  );
}
