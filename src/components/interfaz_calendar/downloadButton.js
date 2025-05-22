import { useState } from 'react';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function DownloadButton({ onDownload }) {
  const [showDownload, setShowDownload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  const toggleDownload = () => {
    if (!isLoading) {
      setShowDownload(!showDownload);
    }
  };


  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await onDownload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="bg-green-400 text-black rounded-full px-10 py-1 shadow-md"
        title="Descargar datos"
        onClick={toggleDownload}
        id="createJSON"
      >
        <img src="/downloadArrow.png" alt="¡Descargar!" className="h-6 w-6" />
      </button>

      {showDownload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs">
            <h2 className="font-semibold">Instrucciones de Uso</h2>
            <ul className="list-disc list-inside">
              <li>Selecciona un ciclo.</li>
              <li>Presiona el botón color azul.</li>
            </ul>
            <div className="modal-buttons-download flex gap-4 mt-4">
              {/* Botón Cancelar */}
              <button
                onClick={toggleDownload}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md ${
                  isLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500'
                } text-white`}
              >
                {isLoading ? 'Espera...' : 'Cerrar'}
              </button>

              {/* Botón Descargar */}
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md ${
                  isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500'
                } text-white`}
              >
                {isLoading ? 'Descargando...' : 'Descargar JSON de todos los edificios'}
              </button>
            </div>

            {/* Mostrar mensaje de estado si existe */}
            {downloadStatus && (
              <p className="mt-2 text-sm text-gray-600">{downloadStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
