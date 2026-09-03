import { useState, useEffect } from 'react';

export default function InstructionsButton() {
  const [showInstructions, setShowInstructions] = useState(false);
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

        <span 
          className="absolute left-1/2 top-full mt-2 text-base bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 span-info pointer-events-none origin-top"
          style={{ transform: `translateX(-50%) scale(${scaleFix})` }}
        >
          Instrucciones de uso
        </span>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 instructions-button bg-black/50 z-50">
          <div className="absolute top-[84px] bottom-[40px] left-0 right-0 flex justify-center items-center px-4 py-4">
            <div className="p-6 bg-white border rounded-lg shadow-lg w-full max-w-2xl max-h-full overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Instrucciones de uso
              </h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  Antes de empezar
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Para utilizar casi todas las funciones del sistema, primero <strong>debes seleccionar</strong>:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
                  <li><strong>Ciclo</strong></li>
                  <li><strong>Edificio</strong></li>
                </ul>
                <p className="text-sm text-gray-600 bg-gray-200/50 inline-block px-2 py-1 rounded">
                  <em>Nota: La única excepción es la <strong>búsqueda de profesores</strong>, que puedes usar luego de seleccionar el ciclo.</em>
                </p>
              </div>

              {/* Calendario */}
              <div className="mb-5">
                <h3 className="font-semibold text-gray-800">
                  📅 Calendario
                </h3>
                <p className="text-sm text-gray-600">
                  Una vez seleccionados el ciclo y edificio, elige un día de la semana para consultar su horario correspondiente.
                </p>
              </div>

              {/* Búsqueda */}
              <div className="mb-5">
                <h3 className="font-semibold text-gray-800">
                  🔎 Búsqueda de profesores
                </h3>
                <p className="text-sm text-gray-600">
                  Escribe el nombre del profesor (mínimo 3 letras) y presiona <strong>Enter</strong> o haz clic en el botón de búsqueda.
                </p>
              </div>

              {/* Reservas */}
              <div className="mb-5">
                <h3 className="font-semibold text-gray-800">
                  📇 Ver reservas
                </h3>
                <p className="text-sm text-gray-600">
                  Utiliza el ciclo y edificio seleccionados previamente para consultar el estado de las reservas.
                </p>
              </div>

              {/* Conteo */}
              <div className="mb-5">
                <h3 className="font-semibold text-gray-800">
                  📊 Conteo de alumnos
                </h3>
                <p className="text-sm text-gray-600">
                  Consulta la suma total de alumnos inscritos en todas las clases del día que tengas seleccionado.
                </p>
              </div>

              {/* Imprimir */}
              <div>
                <h3 className="font-semibold text-gray-800">
                  🖨️ Imprimir tabla
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Abre la pantalla de impresión con el horario del día y edificio seleccionados. Las celdas combinadas se separarán automáticamente para la impresión. 
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Tras imprimir, el botón cambiará a <strong>"Unir celdas 🗓️"</strong>; presiónalo para restaurar el formato original en tu pantalla.
                </p>
                <p className="text-sm text-gray-500 italic">
                  * Durante el <strong>Conteo de alumnos</strong>, el botón también abre la impresión, pero no requiere unir celdas después.
                </p>
              </div>

              <hr className="my-5" />

              <div className="flex justify-center">
                <button
                  onClick={toggleInstructions}
                  className="px-6 py-2 background-button6 text-white font-medium rounded-md shadow-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}