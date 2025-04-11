import { useState } from 'react';

export default function DownloadButton() {
  const [showDownload, setShowDownload] = useState(false);

  const toggleDownload = () => {
    setShowDownload(!showDownload);
  };

  return (
    <div className="relative">
      <button
        className="bg-green-400 text-black rounded-full px-10 py-1 shadow-md"
        title="Descargar datos"
        onClick={toggleDownload}
      >
        <img src="/downloadArrow.png" alt="!" className="h-6 w-6" /> {/* Imagen de advertencia desde la carpeta public */}
      </button>

      {showDownload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs">
            <h2 className="font-semibold">Instrucciones de Uso</h2>
            <ul className="list-disc list-inside">
              <li>Selecciona un ciclo.</li>
              <li>Selecciona un edificio.</li>
              <li>Elige el día de la semana.</li>
            </ul>
            <button
              onClick={toggleDownload}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
