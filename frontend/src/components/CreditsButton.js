import { useState, useEffect } from 'react';
import './interfaz_calendar/calendar.css';

const IconFrontend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" title="Frontend y UI" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 10h16M8 6h.01M11 6h.01M14 6h.01" />
  </svg>
);

const IconBackend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" title="Backend y Base de Datos" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 12c0 2.21 3.582 4 8 4s8-1.79 8-4" />
  </svg>
);

const IconJS = () => (
  <svg xmlns="http://www.w3.org/2000/svg" title="Lógica y JavaScript" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const IconServer = () => (
  <svg xmlns="http://www.w3.org/2000/svg" title="Servidor y Despliegue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-200">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const IconArchitecture = () => (
  <svg xmlns="http://www.w3.org/2000/svg" title="Arquitectura y Soluciones" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-purple-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);


export default function CreditsButton({ className = '', variant = 'icon' }) {
  const [scaleFix, setScaleFix] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const adjustScale = () => {
      const zoomLevel = window.devicePixelRatio || 1;
      setScaleFix(zoomLevel < 1 ? 1 / zoomLevel : 1);
    };
    adjustScale();
    window.addEventListener('resize', adjustScale);
    return () => window.removeEventListener('resize', adjustScale);
  }, []);

  const dynamicTop = scaleFix > 1.3 ? 'top-8' : 'top-0';

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  return (
    <>
      {variant === 'navLink' ? (
        <button
          onClick={handleOpen}
          className={`nav-link inline-block text-left bg-transparent border-none cursor-pointer m-0 ${className}`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            <span>Créditos</span>
          </span>
        </button>
      ) : variant === 'text' ? (
        <button
          onClick={handleOpen}
          className={`inline-block text-left bg-transparent border-none cursor-pointer m-0 ${className}`}
        >
          <span className="flex items-center gap-2 text-white text-sm font-medium hover:text-gray-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            <span>Créditos</span>
          </span>
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className={`config-button mt-1 mr-7 text-white transition relative group flex items-center justify-center ${className}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="9" cy="7" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
          </svg>
          <span
            className={`absolute right-12 ${dynamicTop} mb-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none origin-bottom-right`}
            style={{ transform: `scale(${scaleFix})` }}
          >
            Créditos.
          </span>
        </button>
      )}

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 transition-opacity p-4"
          onClick={handleClose}
        >
          <div 
            className="bg-[#111827] border border-gray-700/50 text-white p-6 md:p-8 rounded-xl shadow-2xl max-w-lg w-full relative transform transition-all flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center flex-shrink-0">
              <h2 className="text-2xl font-bold mb-2 text-gray-200">Créditos de TRACS</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[#612937] via-[#351b51] to-[#254da7] mx-auto mb-6 rounded-full shadow-sm"></div>
            </div>
              
            <div className="space-y-5 text-left overflow-y-auto pr-2 custom-scrollbar">
              
              {/* VERSIÓN 2.x.x (Actualidad) */}
              <div className="bg-[#1f2937] p-4 rounded-lg border border-gray-700/50 shadow-inner">
                <h3 className="text-lg font-bold text-gray-200 border-b border-gray-700/50 pb-2 mb-3 flex items-center justify-between">
                  <span>Versión 2.x.x <span className="text-sm font-normal text-blue-400 ml-1">(Actualidad)</span></span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dirigido por</span>
                    <p className="text-gray-300 mt-0.5 text-base">Georgina Villalpando Alvarez</p>
                  </div>
                  
                  {/* DESARROLLADOR */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Desarrollado por</span>
                    <div className="flex items-center justify-between mt-1 bg-[#111827] p-2 rounded border border-gray-700/30">
                      <span className="text-gray-300 font-medium text-base">Edgar Omar Monreal Zambrano</span>
                      <div className="flex gap-1.5 ml-3">
                        <IconFrontend />
                        <IconBackend />
                        <IconJS />
                        <IconArchitecture />
                        <IconServer />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERSIÓN 0.x.x - 1.x.x */}
              <div className="bg-[#1f2937] p-4 rounded-lg border border-gray-700/50 shadow-inner">
                <h3 className="text-lg font-bold text-gray-200 border-b border-gray-700/50 pb-2 mb-3">
                  Versión 0.x.x - 1.x.x
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dirigido por</span>
                    <p className="text-gray-300 mt-0.5 text-base">Georgina Villalpando Alvarez</p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Desarrollado por</span>
                    
                    {/* DESARROLLADORES */}
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between bg-[#111827] p-2 rounded border border-gray-700/30">
                        <span className="text-gray-300 text-base">Edgar Omar Monreal Zambrano</span>
                        <div className="flex gap-1.5 ml-3">
                          <IconFrontend />
                          <IconBackend />
                          <IconJS />
                          <IconArchitecture />
                          <IconServer />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-[#111827] p-2 rounded border border-gray-700/30">
                        <span className="text-gray-300 text-base">Kevin Uriel Gaona Padilla</span>
                        <div className="flex gap-1.5 ml-3">
                          <IconFrontend />
                          <IconArchitecture />
                          <IconJS />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 text-center">Áreas de Contribución</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2 justify-center"><IconFrontend /> Frontend</div>
                  <div className="flex items-center gap-2 justify-center"><IconBackend /> Backend</div>
                  <div className="flex items-center gap-2 justify-center"><IconJS /> Lógica</div>
                  <div className="flex items-center gap-2 justify-center"><IconArchitecture /> Arquitectura</div>
                  <div className="flex items-center gap-2 justify-center"><IconServer /> Servidor</div>
                </div>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-gray-700/50 text-center flex-shrink-0">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} TRACS - CUCEI. <br/>
                Distribuido bajo la Licencia MIT.<br/>
                Bajo los términos de esta licencia, es <span className="text-gray-400 font-medium">estrictamente obligatorio mantener intacto este aviso de derechos de autor y otorgar el crédito correspondiente a los desarrolladores originales</span>.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}