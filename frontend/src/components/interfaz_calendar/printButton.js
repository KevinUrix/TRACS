import { toast } from "react-toastify";

export default function PrintButton({ selectedBuilding, selectedDay, selectedCycle, onPrint, isPrintMode, setIsPrintMode, isStatisticMode }) {
  const handleClick = () => {
    if (!selectedBuilding || !selectedCycle || !selectedDay) {
      toast.error('Debes seleccionar un ciclo y un edificio.');
      return;
    }
    setIsPrintMode(!isPrintMode);
    if (!isPrintMode) {
      toast.info('Creando la página de impresión...',
        {autoClose: 1000,
            closeOnClick: true
        });
      const timeoutId = setTimeout(() => {
        onPrint(selectedBuilding, selectedDay, selectedCycle);
      }, 800);
    }
    if (isStatisticMode) {
      setIsPrintMode(isPrintMode);
    }
  };

  return (
    <div className="relative group">
      <button onClick={handleClick} className="background-button2 text-white font-medium py-2 px-4 rounded-full shadow-md transition duration-200">
        <b>
          {!isPrintMode
            ? 'Imprimir tabla 🖨️'
            : !isStatisticMode
            ? 'Unir celdas 🗓️'
            : 'Imprimir tabla 🖨️'}
        </b>
      </button>
      <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
        {!isPrintMode ? 'Imprimir tabla completa con base en el ciclo y edificio.' : 'Volver a la vista de celdas unidas.'}
      </span>
    </div>
  );
}
