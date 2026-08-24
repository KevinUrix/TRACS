import React from 'react';
import { handlePrintProfessor } from './printProfessor';

const dayNames = { L: 'Lunes', M: 'Martes', I: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };
const dayOrder = ['L', 'M', 'I', 'J', 'V', 'S'];

export default function ProfessorSchedule({ professorSchedule, selectedCycle }) {
  if (!professorSchedule || professorSchedule.length === 0) {
    return (
      <div className="w-full flex justify-center items-center">
        <p className="text-center font-bold text-2xl">
          No se encontraron horarios para este profesor durante el ciclo {selectedCycle}.
        </p>
      </div>
    );
  }

  const groupedSchedules = professorSchedule.reduce((acc, course) => {
    const professor = course.professor || "Desconocido";
    if (!acc[professor]) acc[professor] = [];
    acc[professor].push(course);
    return acc;
  }, {});

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-blue-900 text-center mb-6 no-print">
        Horarios Encontrados - Ciclo: {selectedCycle}
      </h3>
      
      {Object.keys(groupedSchedules).map((professor, idx) => {
        const courses = groupedSchedules[professor];
        const renderedCells = {};

        // Rango dinámico
        const minHour = 7;
        const maxHour = 20;

        const profHours = Array.from(
          { length: maxHour - minHour + 1 },
          (_, i) => i + minHour
        );

        return (
          <div key={idx} className="mb-10 print-section w-full">
            
            {idx > 0 && (
              <hr className="my-10 border-t-2 border-dashed border-gray-400 no-print" />
            )}

            <div className="flex justify-between items-end mb-3">
              <h4 className="text-2xl font-bold text-gray-800 uppercase m-0 leading-none">{professor}</h4>
              <button 
                onClick={() => handlePrintProfessor(professor, courses, selectedCycle)}
                className="bg-purple-800 text-white px-3.5 py-2.5 rounded-lg shadow-md hover:bg-purple-900 flex items-center gap-2 font-bold text-base no-print transition-all"
              >
                Imprimir tabla 🖨️
              </button>
            </div>
            
            <div className="w-full shadow-sm rounded-lg border border-gray-400 overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-center bg-white min-w-[700px]">
                <thead className="bg-gray-200 border-b-2 border-gray-400">
                  <tr>
                    <th className="border-r border-gray-400 p-2 w-[7%] text-base font-bold text-gray-800">Hora</th>
                    {dayOrder.map(dayKey => (
                      <th key={dayKey} className="border-r border-gray-400 p-2 w-[16%] text-base font-bold text-gray-800">
                        {dayNames[dayKey]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profHours.map((hour, rowIdx) => {
                    const isLastRow = rowIdx === profHours.length - 1;
                    return (
                      <tr key={hour} className={`h-[58px] ${isLastRow ? '' : 'border-b border-gray-300'}`}>
                        <td className="border-r border-gray-400 relative p-0 bg-gray-50">
                          <div className="absolute inset-0 flex items-center justify-center font-bold text-base text-gray-700">
                            {hour}:00
                          </div>
                        </td>
                        {dayOrder.map(dayKey => {
                          const cellKey = `${hour}-${dayKey}`;
                          if (renderedCells[cellKey]) return null;

                          const dayCourses = courses.filter(c => c.data.days.split(' ').includes(dayKey));

                          let matchingCourses = dayCourses.filter(c => {
                            const startH = parseInt(c.data.schedule.split('-')[0].substring(0, 2), 10);
                            const endH = parseInt(c.data.schedule.split('-')[1].substring(0, 2), 10);
                            return hour >= startH && hour <= endH;
                          });

                          if (matchingCourses.length > 0) {
                            let keepExpanding = true;
                            while (keepExpanding) {
                              keepExpanding = false;
                              
                              const minH = Math.min(...matchingCourses.map(c => parseInt(c.data.schedule.split('-')[0].substring(0, 2), 10)));
                              const maxH = Math.max(...matchingCourses.map(c => parseInt(c.data.schedule.split('-')[1].substring(0, 2), 10)));

                              dayCourses.forEach(c => {
                                const startH = parseInt(c.data.schedule.split('-')[0].substring(0, 2), 10);
                                const endH = parseInt(c.data.schedule.split('-')[1].substring(0, 2), 10);

                                if (startH <= maxH && endH >= minH && !matchingCourses.includes(c)) {
                                  matchingCourses.push(c);
                                  keepExpanding = true;
                                }
                              });
                            }

                            let maxEndHour = hour;
                            matchingCourses.forEach(c => {
                              const endH = parseInt(c.data.schedule.split('-')[1].substring(0, 2), 10);
                              if (endH > maxEndHour) maxEndHour = endH;
                            });

                            const rowspan = maxEndHour - hour + 1;
                            for (let h = hour; h <= maxEndHour; h++) {
                              renderedCells[`${h}-${dayKey}`] = true;
                            }

                            const isOverlap = matchingCourses.length > 1;

                            return (
                              <td 
                                key={dayKey} 
                                rowSpan={rowspan} 
                                className={`border-r border-gray-300 relative p-0 align-middle ${isOverlap ? 'bg-red-50' : 'bg-blue-50/40'} ${rowspan > 1 ? 'border-b border-gray-300' : ''}`}
                              >
                                <div
                                  className={`absolute inset-0 p-1 flex flex-col ${
                                    isOverlap ? 'justify-around' : 'justify-center'
                                  } items-center overflow-hidden`}
                                >
                                  {isOverlap && <div className="font-bold text-red-600 text-[10px] bg-red-100 py-px px-1 rounded flex justify-center items-center leading-none mb-0.5">⚠️ EMPALME</div>}
                                  
                                  {[...matchingCourses].sort((a, b) => {
                                    const endA = parseInt(a.data.schedule.split('-')[1].substring(0, 2), 10);
                                    const endB = parseInt(b.data.schedule.split('-')[1].substring(0, 2), 10);
                                    return endA - endB;
                                  }).map((c, i) => {
                                    const [start, end] = c.data.schedule.split('-');

                                    return (
                                      <div
                                        key={i}
                                        className="flex flex-col items-center justify-center overflow-hidden w-full min-w-0"
                                      >
                                        {isOverlap && rowspan > 1 && (
                                          <span className="text-[13px] font-semibold text-red-700 leading-none">
                                            {start.substring(0, 2)}:{start.substring(2, 4)} -{' '}
                                            {end.substring(0, 2)}:{end.substring(2, 4)}
                                          </span>
                                        )}

                                        {(!isOverlap || (rowspan > 1 && matchingCourses.length <= 2)) && (
                                          <span className="font-bold text-[12.5px] text-gray-900 leading-none">
                                            {c.data.code}
                                          </span>
                                        )}

                                        {(!isOverlap || rowspan > 3) && (
                                          <span
                                            className="text-[13px] text-gray-800 leading-[1.05] my-0.5 px-0.5 line-clamp-4 w-full text-center break-words whitespace-normal"
                                            title={c.data.course}
                                          >
                                            {c.data.course}
                                          </span>
                                        )}

                                        <div className="flex flex-wrap justify-center items-center gap-x-1.5 w-full min-w-0 mt-0.5">
                                          <span className="text-[13px] font-semibold bg-white/80 text-gray-900 px-1 rounded border border-gray-300 leading-none py-[1px]">
                                            {c.data.nrc}
                                          </span>

                                          <span className="text-[14px] font-bold text-blue-800 leading-none">
                                            {c.data.building} - {c.data.classroom}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          }

                          return <td key={dayKey} className="border-r border-gray-300 relative p-0"></td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}