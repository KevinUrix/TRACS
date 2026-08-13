import { useState, useEffect } from 'react';
import './interfaz_calendar/calendar.css';

export default function ReloadPage({ className = '' }) {
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

  const handleClick = () => {
    window.location.reload();
  };

  const dynamicTop = scaleFix > 1.3 ? 'top-8' : 'top-0';

  return (
    <button
      onClick={handleClick}
      className={`config-button mt-1 mr-7 text-white transition relative group flex items-center justify-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-11 h-11 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 11-2.33-5.66L20 8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 4.8v4h-3" />
      </svg>

      <span 
        className={`absolute right-12 ${dynamicTop} mb-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none origin-bottom-right`}
        style={{ transform: `scale(${scaleFix})` }}
      >
        Recarga la página y actualiza los datos.
      </span>
    </button>
  );
}