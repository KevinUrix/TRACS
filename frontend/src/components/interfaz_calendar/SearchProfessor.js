import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import ProfessorSchedule from './professorSchedule';
import SubjectSchedule from './SubjectSchedule';
import { normalizeSubjectCode } from './scheduleUtils';

export default function SearchProfessor({ selectedCycle, fullSchedule }) {
  const [searchMode, setSearchMode] = useState('professor');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [subjectResults, setSubjectResults] = useState([]);
  const [searchedSubjectCode, setSearchedSubjectCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isLoadingPopup, setIsLoadingPopup] = useState(false);
  const toastCooldown = useRef(false);
  const [scaleFix, setScaleFix] = useState(1);

  const maxInputLength = searchMode === 'subject' ? 15 : 60;

  useEffect(() => {
    const adjustScale = () => {
      const zoomLevel = window.devicePixelRatio || 1;
      setScaleFix(zoomLevel < 1 ? 1 / zoomLevel : 1);
    };
    adjustScale();
    window.addEventListener('resize', adjustScale);
    return () => window.removeEventListener('resize', adjustScale);
  }, []);

  // Normalización estricta
  const normalizeName = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\sñ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const matchesName = (fullName, normalizedQuery) => {
    if (!normalizedQuery) return false;
    return normalizedQuery
      .split(' ')
      .every((q) => fullName.includes(q));
  };

  const handleModeChange = (e) => {
    setSearchMode(e.target.value);
    setSearchTerm('');
    setShowPopup(false);
  };

  const handleProfessorSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredSchedule([]);
      setShowPopup(false);
      return;
    }

    if (/\d/.test(searchTerm)) {
      if (!toastCooldown.current) {
        toast.error('Los nombres de maestros no incluyen números. Si buscas una clave, cambia a "Materia".');
        toastCooldown.current = true;
        setTimeout(() => { toastCooldown.current = false; }, 3000);
      }
      return;
    }

    const searchNormalized = normalizeName(searchTerm);

    if (searchNormalized.length < 3) {
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
        let matches = [];

        // Extraer todos los cursos que coinciden
        Object.values(fullSchedule).forEach((buildingCourses) => {
          if (!Array.isArray(buildingCourses)) return;

          const profCourses = buildingCourses.filter((course) => {
            if (!course.professor) return false;
            const normalizedFullName = normalizeName(course.professor);
            return matchesName(normalizedFullName, searchNormalized);
          });

          matches.push(...profCourses);
        });

        // Lógica de ordenamiento
        const dayPriority = { L: 1, M: 2, I: 3, J: 4, V: 5, S: 6, '.': 7 };

        const getEarliestDayPriority = (daysStr) => {
          if (!daysStr) return 7;
          const days = daysStr.split(' ').filter((d) => d !== '');
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
        console.error('Error al buscar el maestro:', error);
        toast.error('Error al buscar el maestro.');
        setFilteredSchedule([]);
      } finally {
        setIsLoadingPopup(false);
      }
    }, 50);
  };

  const handleSubjectSearch = () => {
    const normalizedQuery = normalizeSubjectCode(searchTerm);

    if (!normalizedQuery) {
      setSubjectResults([]);
      setShowPopup(false);
      return;
    }

    try {
      const matches = [];

      Object.values(fullSchedule).forEach((buildingCourses) => {
        if (!Array.isArray(buildingCourses)) return;

        buildingCourses.forEach((course) => {
          const courseCode = normalizeSubjectCode(course?.data?.code);
          if (courseCode && courseCode === normalizedQuery) {
            matches.push(course);
          }
        });
      });

      matches.sort((a, b) => {
        const nrcA = String(a?.data?.nrc || '');
        const nrcB = String(b?.data?.nrc || '');
        return nrcA.localeCompare(nrcB, undefined, { numeric: true });
      });

      setSearchedSubjectCode(normalizedQuery);
      setSubjectResults(matches);
      setShowPopup(true);
    } catch (error) {
      console.error('Error al buscar la materia:', error);
      toast.error('Error al buscar la materia.');
      setSubjectResults([]);
    }
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

    if (searchMode === 'subject') {
      handleSubjectSearch();
    } else {
      handleProfessorSearch();
    }
  };

  const placeholderText =
    searchMode === 'subject' ? 'Buscar clave...' : 'Buscar maestro...';

  return (
    <>
      <div className="search-container flex items-center">
        <div className="flex items-stretch bg-white rounded-lg shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
          <div className="relative group flex items-center bg-gray-50/90 hover:bg-gray-100 transition-colors shrink-0 rounded-l-lg">
            <select
              aria-label="Tipo de búsqueda"
              value={searchMode}
              onChange={handleModeChange}
              className="appearance-none !bg-transparent !border-0 !rounded-none !shadow-none !m-0 !p-0 !pl-3 !pr-7 !outline-none w-[96px] h-full text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer"
            >
              <option value="professor">Maestro</option>
              <option value="subject">Materia</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 text-gray-500 pointer-events-none absolute right-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>

            <span
              className="absolute left-1/2 top-full mt-2 text-base font-medium bg-gray-700 text-white px-4 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:delay-500 z-50 pointer-events-none origin-top"
              style={{ transform: `translateX(-50%) scale(${scaleFix})` }}
            >
              Cambiar tipo de búsqueda
            </span>
          </div>

          <div className="flex items-center shrink-0" aria-hidden="true">
            <span className="w-[1px] h-5 bg-gray-300" />
          </div>

          <input
            type="text"
            minLength={searchMode === 'professor' ? 3 : 1}
            maxLength={maxInputLength}
            placeholder={placeholderText}
            className="search-input !border-0 !rounded-none !shadow-none !m-0 !bg-transparent !pl-2.5 !pr-3 !w-[155px] sm:!w-[160px] text-gray-800 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.slice(0, maxInputLength))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <button
          onClick={handleSearch}
          className="search-button relative group ml-2 p-2 rounded background-button5 text-white flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
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
        <div
          className="popup-overlay flex items-center justify-center fixed inset-0 bg-black bg-opacity-50"
          onClick={() => {
            if (!isLoadingPopup) setShowPopup(false);
          }}
        >
          <div
            className="popup-content relative p-6 rounded-lg shadow-lg"
            style={{ maxWidth: '1400px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingPopup ? (
              <p className="text-2xl font-semibold text-center">Espere un momento . . . ⏳</p>
            ) : (
              <>
                <button
                  className="close-popup absolute top-4 right-4"
                  onClick={() => setShowPopup(false)}
                >
                  ✖
                </button>

                {searchMode === 'subject' ? (
                  <SubjectSchedule
                    subjectSchedule={subjectResults}
                    searchCode={searchedSubjectCode}
                    selectedCycle={selectedCycle}
                  />
                ) : (
                  <ProfessorSchedule
                    professorSchedule={filteredSchedule}
                    selectedCycle={selectedCycle}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}