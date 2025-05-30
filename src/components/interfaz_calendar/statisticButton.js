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
    <button onClick={handleClick} className="btn-statistic bg-pink-600 rounded-full px-3 py-1 shadow-md text-white">
      {isStatisticMode ? 'Volver a vista normal 📆' : 'Conteo de alumnos 📊'}
    </button>
  );
}
