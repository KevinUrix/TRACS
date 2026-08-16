import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import ProfessorSchedule from './professorSchedule';

export default function SearchProfessor({ selectedCycle, fullSchedule }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoadingPopup, setIsLoadingPopup] = useState(false);
  const toastCooldown = useRef(false);
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

  // Normalización estricta (igual a tu backend)
  const normalizeName = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\sñ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const matchesName = (fullName, normalizedQuery) => {
    if (!normalizedQuery) return false;
    return normalizedQuery
      .split(' ')
      .every(q => fullName.includes(q));
  };

  const handleSearch = () => {
    if (!selectedCycle) {
      toast.error('Debes seleccionar un ciclo para realizar la búsqueda.');
      return;
    }

    if (!fullSchedule || Object.keys(fullSchedule).length === 0) {
      if (!toastCooldown.current) {
        toast.info('⏳ Obteniendo horarios... Intente de nuevo en unos segundos.', { autoClose: 3000 });
        toastCooldown.current = true;
        setTimeout(() => { toastCooldown.current = false; }, 3000);
      }
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredSchedule([]);
      setShowPopup(false);
      return;
    }

    if (searchTerm.trim().length < 3) {
      if (!toastCooldown.current) {
        toast.info('Escribe al menos 3 letras para buscar.');
        toastCooldown.current = true;
        setTimeout(() => { toastCooldown.current = false; }, 2000);
      }
      return;
    }

    setIsLoadingPopup(true);
    
    setTimeout(() => {
      try {
        const searchNormalized = normalizeName(searchTerm);
        let matches = [];

        // Extraer todos los cursos que coinciden
        Object.values(fullSchedule).forEach(buildingCourses => {
          if (!Array.isArray(buildingCourses)) return;

          const profCourses = buildingCourses.filter(course => {
            if (!course.professor) return false;
            const normalizedFullName = normalizeName(course.professor);
            return matchesName(normalizedFullName, searchNormalized);
          });

          matches.push(...profCourses);
        });

        // Lógica de ordenamiento (Igual a tu backend)
        const dayPriority = { 'L': 1, 'M': 2, 'I': 3, 'J': 4, 'V': 5, 'S': 6, '.': 7 };

        const getEarliestDayPriority = (daysStr) => {
          if (!daysStr) return 7;
          const days = daysStr.split(' ').filter(d => d !== '');
          return days.reduce((min, d) => {
            const pr = dayPriority[d] ?? 7;
            return pr < min ? pr : min;
          }, 7);
        };

        const getStartTime = (scheduleStr) => {
          if (!scheduleStr) return 9999;
          const [start] = scheduleStr.split('-');
          return parseInt(start, 10);
        };

        matches.sort((a, b) => {
          const aDayPr = getEarliestDayPriority(a.data.days || '');
          const bDayPr = getEarliestDayPriority(b.data.days || '');

          if (aDayPr !== bDayPr) {
            return aDayPr - bDayPr;
          }

          const aStart = getStartTime(a.data.schedule);
          const bStart = getStartTime(b.data.schedule);

          return aStart - bStart;
        });

        setFilteredSchedule(matches);
        setShowPopup(true);
      } catch (error) {
        console.error("Error al buscar el profesor:", error);
        toast.error("Error al buscar el profesor.");
        setFilteredSchedule([]);
      } finally {
        setIsLoadingPopup(false);
      }
    }, 50);
  };

  return (
    <>
      <div className="search-container">
        <input
          type="text"
          minLength={3}
          placeholder="Buscar maestro..."
          className="search-input px-3 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        
        <button
          onClick={handleSearch}
          className="search-button relative group ml-2 p-2 rounded background-button5 text-white flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
          </svg>
          
          <span 
            className="absolute left-1/2 top-full mt-2 text-base font-medium bg-gray-700 text-white px-4 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:delay-500 z-50 pointer-events-none origin-top"
            style={{ transform: `translateX(-50%) scale(${scaleFix})` }}
          >
            Buscar
          </span>
        </button>
      </div>

      {(isLoadingPopup || showPopup) && (
        <div className="popup-overlay" onClick={() => { if (!isLoadingPopup) setShowPopup(false); }}>
          <div className="popup-content relative p-6 rounded-lg shadow-lg top-2" onClick={(e) => e.stopPropagation()}>
            {isLoadingPopup ? (
              <p className="text-lg font-semibold text-center">Espere un momento . . . ⏳</p>
            ) : (
              <>
                <button className="close-popup" onClick={() => setShowPopup(false)}>✖</button>
                <ProfessorSchedule professorSchedule={filteredSchedule} selectedCycle={selectedCycle} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}