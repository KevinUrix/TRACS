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
    <button onClick={handleClick} className="bg-pink-600 hover:bg-pink-700 rounded-full px-4 py-2 shadow-md text-white transition duration-200">
      <b>{isStatisticMode ? 'Volver a vista normal 📆' : 'Conteo de alumnos 📊'}</b>
    </button>
  );
}
