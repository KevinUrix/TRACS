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
    <>
    <div className="relative">
      <div className="relative group">
        <button
          className="bg-customBgGreen500 hover:bg-customBgGreen600 rounded-full px-5 py-2 shadow-md text-white transition duration-200 flex items-center justify-center space-x-2"
          onClick={toggleDownload}
          id="createJSON"
          >
          <b>Archivos</b>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
        </button>
          <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
            Descargar archivos de actualización al servidor, con base en el ciclo escolar.
          </span>
      </div>
      {/* <button
        className="bg-green-400 text-black rounded-full px-10 py-1 shadow-md"
        title="Descargar datos"
        onClick={toggleDownload}
        id="createJSON"
      >
        <img src="/downloadArrow.webp" alt="¡Descargar!" className="h-6 w-6" />
      </button> */}

      {showDownload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs custom-shadow-border">
            <h2 className="font-semibold">Instrucciones de Uso</h2>
            <ul className="list-disc list-inside">
              <li>Selecciona un ciclo.</li>
              <li>Presiona "Descargar archivos".</li>
            </ul>
            <div className="modal-buttons-download flex gap-4 mt-4">
              {/* Botón Cancelar */}
              <button
                onClick={toggleDownload}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md ${
                  isLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500'
                } text-white  hover:bg-red-600 transition duration-200`}
              >
                {isLoading ? 'Espera...' : 'Cerrar'}
              </button>

              {/* Botón Descargar */}
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md ${
                  isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500'
                } text-white whitespace-normal break-words hover:bg-blue-600 transition duration-200`}
              >
                {isLoading ? 'Descargando...' : 'Descargar archivos'}
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
    </>
  );
}
