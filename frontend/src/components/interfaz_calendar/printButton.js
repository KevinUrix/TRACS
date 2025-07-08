import { toast } from "react-toastify";

// PrintButton.js
export default function PrintButton({ selectedBuilding, selectedDay, selectedCycle, onPrint }) {
  const handleClick = () => {
    if (!selectedBuilding || !selectedCycle || !selectedDay) {
      toast.error('Debes seleccionar un ciclo y un edificio.');
      return;
    }
    onPrint(selectedBuilding, selectedDay, selectedCycle);
  };

  return (
    <div className="relative group">
      <button onClick={handleClick} className="bg-customBgPurple500 hover:bg-customBgPurple600 text-white font-medium py-2 px-4 rounded-full shadow-md transition duration-200">
        <b>Imprimir tabla 🖨️</b>
      </button>
      <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
        Imprimir tabla completa con base en el ciclo y edificio.
      </span>
    </div>
  );
}
