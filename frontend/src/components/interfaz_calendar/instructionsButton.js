import { useState } from 'react';

export default function InstructionsButton() {
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  return (
    <div className="relative">
      <div className="relative group">
        <button
          className="bg-indigo-400 hover:bg-indigo-500 text-gray-800 rounded-full px-3 py-1 shadow-md transition duration-200"
          onClick={toggleInstructions}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="12" y1="6" x2="12" y2="13" stroke="currentColor" strokeWidth="3" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </button>

        <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
          Instrucciones simples y créditos.
        </span>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 instructions-button bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-6 bg-white border rounded-lg shadow-lg max-w-xs custom-shadow-border">
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
            
            <div className="flex justify-center">
              <button
                onClick={toggleInstructions}
                className="mt-4 px-4 py-2 background-button6 text-white rounded-md"
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