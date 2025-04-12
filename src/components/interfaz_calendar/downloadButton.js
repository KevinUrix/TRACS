import { useState } from 'react';

export default function DownloadButton({ onDownload }) {
  
  const [showDownload, setShowDownload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  

  const toggleDownload = () => {
    setShowDownload(!showDownload);
  };

  return (
    <div className="relative">
      <button
        className="bg-green-400 text-black rounded-full px-10 py-1 shadow-md"
        title="Descargar datos"
        onClick={toggleDownload}
        id="createJSON"
      >
        <img src="/downloadArrow.png" alt="!" className="h-6 w-6" /> {/* Imagen de advertencia desde la carpeta public */}
      </button>

      {showDownload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-lg max-w-xs">
            <button
              onClick={toggleDownload}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
            >
              Cerrar
            </button>

            {/* Agregar el botón de descarga con feedback */}
            <button
              onClick={onDownload}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              {isLoading ? 'Descargando...' : 'Descargar JSON de todos los edificios'}
            </button>

            {/* Mostrar mensaje de estado */}
            {downloadStatus && (
              <p className="mt-2 text-sm text-gray-600">{downloadStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
