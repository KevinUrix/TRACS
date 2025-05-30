import { useState } from 'react';

export default function InstructionsButton() {
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  return (
    <div className="relative">
      <button
        className="bg-indigo-400 hover:bg-indigo-500 text-black rounded-full px-3 py-1 shadow-md transition duration-200"
        title="Mostrar instrucciones"
        onClick={toggleInstructions}
      >
        <img src="/exclamacion.webp" alt="!" className="h-6 w-6" /> {/* Imagen de advertencia desde la carpeta public */}
      </button>

      {showInstructions && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs">
            <h2 className="font-semibold">Instrucciones de Uso:</h2>
            <ul className="list-disc list-inside">
              <li>Selecciona un ciclo.</li>
              <li>Selecciona un edificio.</li>
              <li>Elige el día de la semana.</li>
            </ul>
            <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
            <h2 className="font-semibold">Creadores:</h2>
            <p class="text-purple-600"> Kevin Uriel Gaona Padilla </p>
            <p class="text-green-600"> Edgar Omar Monreal Zambrano </p>
            <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
            <h2 className="font-semibold">Creditos:</h2>
            <p> Para uso de imagenes poner a los creadores.</p>
            <div className="flex justify-center">
              <button
                onClick={toggleInstructions}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
