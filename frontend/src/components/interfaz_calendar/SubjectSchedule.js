import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DAY_NAMES,
  DAY_ORDER,
  normalizeSubjectCode,
  extractCourseDays,
  parseScheduleRange,
  detectSubjectConflicts,
} from './scheduleUtils';
import { handlePrintSubject } from './printSubject';

const ROW_HEIGHT_PX = 158;

function HoverTooltip({
  children,
  text,
  scaleFix = 1,
  delay = 1000,
  multiline = false,
  wrapperClassName = '',
}) {
  const triggerRef = useRef(null);
  const timerRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [visible, setVisible] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hideTooltip = () => {
    clearTimer();
    setVisible(false);
    setCoords(null);
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const estimatedWidth = (multiline ? 320 : 240) * scaleFix;
    const estimatedHeight = (multiline ? 165 : 44) * scaleFix;
    const margin = 12;

    const centerX = rect.left + rect.width / 2;
    let horizontalStyle = {};
    let originX = 'center';
    let translateX = '-50%';

    if (centerX - estimatedWidth / 2 < margin) {
      horizontalStyle = { left: `${Math.max(margin, rect.left)}px` };
      originX = 'left';
      translateX = '0px';
    } else if (centerX + estimatedWidth / 2 > viewportW - margin) {
      horizontalStyle = { right: `${Math.max(margin, viewportW - rect.right)}px` };
      originX = 'right';
      translateX = '0px';
    } else {
      horizontalStyle = { left: `${centerX}px` };
    }

    const openUpward =
      rect.bottom + estimatedHeight + 8 > viewportH - margin &&
      rect.top - estimatedHeight - 8 > margin;

    const verticalStyle = openUpward
      ? { bottom: `${viewportH - rect.top + 6}px` }
      : { top: `${rect.bottom + 6}px` };

    const originY = openUpward ? 'bottom' : 'top';

    setCoords({
      ...horizontalStyle,
      ...verticalStyle,
      transformOrigin: `${originY} ${originX}`,
      transform: `translateX(${translateX}) scale(${scaleFix})`,
    });

    requestAnimationFrame(() => {
      setVisible(true);
    });
  };

  const handleMouseEnter = () => {
    if (!text) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      calculatePosition();
    }, delay);
  };

  useEffect(() => {
    if (!coords) return;
    const handleViewportChange = () => hideTooltip();
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [coords]);

  useEffect(() => () => clearTimer(), []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
        onMouseDown={hideTooltip}
        className={wrapperClassName}
      >
        {children}
      </div>

      {coords &&
        createPortal(
          <span
            aria-hidden="true"
            className={`fixed z-[9999] text-sm bg-gray-700 text-white rounded shadow-lg pointer-events-none transition-opacity duration-200 span-info ${
              multiline
                ? 'px-3.5 py-2 whitespace-pre-line w-max max-w-[320px] leading-snug'
                : 'px-3 py-1.5 whitespace-nowrap'
            } ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={coords}
          >
            {text}
          </span>,
          document.body
        )}
    </>
  );
}

export default function SubjectSchedule({ subjectSchedule, searchCode, selectedCycle }) {
  const normalizedSearchCode = normalizeSubjectCode(searchCode);
  const [activeSlot, setActiveSlot] = useState(null);
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

  useEffect(() => {
    setActiveSlot(null);
  }, [subjectSchedule, normalizedSearchCode]);

  useEffect(() => {
    if (!activeSlot) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setActiveSlot(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeSlot]);

  const analysis = useMemo(() => {
    if (!Array.isArray(subjectSchedule) || subjectSchedule.length === 0) {
      return null;
    }

    const enrichedRecords = subjectSchedule.map((item, idx) => ({
      idx,
      data: item.data,
      professor: item.professor,
      days: extractCourseDays(item.data.days),
      range: parseScheduleRange(item.data.schedule),
    }));

    const validRecords = enrichedRecords.filter(
      (item) => item.days.length > 0 && item.range !== null
    );
    const unscheduledRecords = enrichedRecords.filter(
      (item) => item.days.length === 0 || item.range === null
    );

    const conflictKeys = detectSubjectConflicts(subjectSchedule);

    const firstData = subjectSchedule[0].data;
    const subjectName = firstData.course || 'Materia sin nombre';
    const subjectCode = normalizeSubjectCode(firstData.code) || normalizedSearchCode;

    // Conteo global de grupos únicos (NRC) y alumnos inscritos
    const nrcMap = new Map();
    enrichedRecords.forEach(({ data }, idx) => {
      const key = data.nrc || `sin-nrc-${idx}`;
      if (!nrcMap.has(key)) {
        nrcMap.set(key, data.students);
      }
    });

    const groupCount = nrcMap.size;
    let totalEnrolled = 0;
    nrcMap.forEach((students) => {
      if (typeof students === 'number') totalEnrolled += students;
    });

    let minHour = 7;
    let maxHour = 20;
    validRecords.forEach(({ range }) => {
      if (range.startRowHour < minHour) minHour = range.startRowHour;
      if (range.endRowHour > maxHour) maxHour = range.endRowHour;
    });

    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);

    return {
      validRecords,
      unscheduledRecords,
      conflictKeys,
      hasConflicts: conflictKeys.size > 0,
      subjectName,
      subjectCode,
      groupCount,
      totalEnrolled,
      hours,
    };
  }, [subjectSchedule, normalizedSearchCode]);

  if (!analysis) {
    return (
      <div className="w-full py-12 px-4 flex flex-col justify-center items-center text-center">
        <p className="font-bold text-xl text-gray-800 mb-2">
          No se encontró la materia con la clave{' '}
          <span className="text-blue-900">{normalizedSearchCode}</span> durante el ciclo{' '}
          {selectedCycle}.
        </p>
        <p className="text-sm text-gray-600">
          Verifique que la clave de la materia sea exacta e inténtelo nuevamente.
        </p>
      </div>
    );
  }

  const {
    validRecords,
    unscheduledRecords,
    conflictKeys,
    hasConflicts,
    subjectName,
    subjectCode,
    groupCount,
    totalEnrolled,
    hours,
  } = analysis;

  const renderedCells = {};

  const renderStudentBadge = (students, isItemConflict, isModal = false) => {
    const badgeClasses = isItemConflict
      ? 'bg-white text-red-800 border-red-300'
      : students === 0
      ? 'bg-gray-200 text-gray-800 border-gray-300'
      : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded border leading-none whitespace-nowrap shrink-0 ${
          isModal ? 'text-[13px] px-2 py-1' : 'text-[10.5px] px-1.5 py-[3px]'
        } ${badgeClasses}`}
      >
        <span className={isModal ? 'text-[12px]' : 'text-[9.5px]'}>👥</span>
        <span className={isModal ? 'text-[13px] font-bold' : 'text-[12px] font-bold'}>
          {students} alum.
        </span>
      </span>
    );
  };

  /**
   * Variantes de tarjeta:
   * - 'single': Único grupo en el bloque
   * - 'multi':  Varios grupos en bloques de 2+ horas
   * - 'tight':  Varios grupos en bloques de 1 sola hora (rowspan = 1)
   * - 'modal':  Vista detallada dentro del modal de tarjetas
   */
  const renderGroupCard = (item, dayKey, { variant = 'multi' } = {}) => {
    const { idx, data, professor, range } = item;
    const isItemConflict = conflictKeys.has(`${idx}-${dayKey}`);

    const locationLabel =
      data.building && data.building !== 'SIN EDIFICIO'
        ? data.classroom
          ? `${data.building} - ${data.classroom}`
          : data.building
        : 'SIN EDIFICIO';

    const cardSurface = isItemConflict
      ? 'bg-red-50 border-red-400 border-l-red-600 text-red-950'
      : 'bg-white border-blue-300 border-l-blue-800 text-gray-900';

    const isSingle = variant === 'single';
    const isMulti = variant === 'multi';
    const isTight = variant === 'tight';
    const isModal = variant === 'modal';

    const sizeClasses = isSingle
      ? 'my-auto px-2.5 py-2.5 flex flex-col justify-center gap-1.5'
      : isMulti
      ? 'flex-1 min-h-0 px-2.5 py-1.5 flex flex-col justify-between gap-1'
      : isTight
      ? 'flex-1 min-h-0 px-2.5 py-1.5 flex flex-col justify-between gap-0.5'
      : 'p-3.5 flex flex-col justify-between gap-2';

    const professorTooltip = [
      professor,
      `Materia: ${subjectCode} - ${subjectName}`,
      `NRC: ${data.nrc}`,
      `Horario: ${range.formatted}`,
      `Salón: ${locationLabel}`,
      `Alumnos: ${data.students}`,
    ].join('\n');

    return (
      <div
        key={`${idx}-${data.nrc}-${dayKey}`}
        className={`w-full rounded-md border border-l-4 shadow-sm text-left transition-all ${cardSurface} ${sizeClasses}`}
      >
        {/* Cabecera de tarjeta */}
        <div className="space-y-1 shrink-0">
          {isItemConflict && (
            <div>
              <span className="inline-block font-bold text-red-800 text-[10px] bg-red-200 px-1.5 py-0.5 rounded leading-none">
                ⚠️ EMPALME PROFESOR
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span
              className={`font-extrabold rounded leading-none whitespace-nowrap shrink-0 ${
                isModal
                  ? 'text-[12px] px-2 py-1'
                  : 'text-[10.5px] px-1.5 py-[3px]'
              } ${
                isItemConflict
                  ? 'bg-red-700 text-white'
                  : 'bg-blue-900 text-white'
              }`}
            >
              NRC {data.nrc}
            </span>

            {renderStudentBadge(data.students, isItemConflict, isModal)}
          </div>

          <div
            className={`flex items-center gap-1 font-semibold leading-none ${
              isSingle || isModal
                ? 'text-[11.5px] text-slate-700 pt-0.5'
                : 'text-[11px] text-slate-600'
            }`}
          >
            <span className="text-[10px] opacity-80">🕒</span>
            <span className="tabular-nums">{range.formatted}</span>
          </div>
        </div>

        {/* Nombre del profesor */}
        <HoverTooltip
          text={professorTooltip}
          scaleFix={scaleFix}
          delay={1000}
          multiline
        >
          <p
            className={`font-bold text-gray-900 leading-tight break-words ${
              isModal
                ? 'text-sm'
                : isSingle
                ? professor.length > 38
                  ? 'text-[12px] line-clamp-3'
                  : 'text-[13px] line-clamp-3'
                : isTight
                ? 'text-[11px] line-clamp-1'
                : professor.length > 36
                ? 'text-[11px] line-clamp-2'
                : 'text-[12px] line-clamp-2'
            }`}
          >
            {professor}
          </p>
        </HoverTooltip>

        {/* Pie de tarjeta */}
        <div className="pt-0.5 border-t border-slate-100 shrink-0">
          <span
            className={`block font-bold truncate leading-tight ${
              isSingle || isModal ? 'text-[11.5px]' : 'text-[11px]'
            } ${isItemConflict ? 'text-red-800' : 'text-blue-800'}`}
          >
            {locationLabel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Encabezado principal */}
      <div className="mb-4 border-b border-gray-300 pb-3.5">
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5 pr-10">
          <span className="inline-flex items-center bg-blue-900 text-white text-sm font-bold px-2.5 py-1 rounded tracking-wide leading-none shrink-0">
            {subjectCode}
          </span>
          <h3 className="!m-0 !p-0 text-xl sm:text-2xl font-bold text-gray-900 uppercase leading-none">
            {subjectName}
          </h3>
        </div>

        {/* Badges y Botón de impresión */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-gray-200 text-gray-800 text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded">
              Ciclo: {selectedCycle}
            </span>
            <span className="bg-purple-100 text-purple-900 border border-purple-300 text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded">
              {groupCount === 1 ? '1 grupo' : `${groupCount} grupos`}
            </span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded">
              👥 {totalEnrolled} {totalEnrolled === 1 ? 'alumno inscrito' : 'alumnos inscritos'}
            </span>
            {hasConflicts && (
              <span className="bg-red-100 text-red-800 border border-red-300 text-xs font-bold px-2.5 py-0.5 rounded">
                ⚠️ Empalme de profesor detectado
              </span>
            )}
          </div>

          <button
            onClick={() => handlePrintSubject(subjectSchedule, subjectCode, selectedCycle)}
            className="bg-purple-800 text-white px-3.5 py-1.5 rounded-lg shadow-md hover:bg-purple-900 flex items-center gap-2 font-bold text-sm no-print transition-all shrink-0"
          >
            Imprimir tabla 🖨️
          </button>
        </div>
      </div>

      {/* Tabla de horarios */}
      <div className="w-full shadow-sm rounded-lg border-2 border-gray-400 overflow-x-auto bg-white">
        <table className="w-full table-fixed border-separate border-spacing-0 bg-white min-w-[1120px]">
          <thead className="bg-gray-200">
            <tr>
              <th className="border-b-2 border-r-2 border-gray-400 p-2.5 w-[72px] text-sm sm:text-base font-bold text-gray-800 text-center">
                Hora
              </th>
              {DAY_ORDER.map((dayKey, colIdx) => {
                const isLastCol = colIdx === DAY_ORDER.length - 1;
                return (
                  <th
                    key={dayKey}
                    className={`border-b-2 border-gray-400 p-2.5 text-sm sm:text-base font-bold text-gray-800 text-center ${
                      isLastCol ? '' : 'border-r-2 border-gray-400'
                    }`}
                  >
                    {DAY_NAMES[dayKey]}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {hours.map((hour, rowIdx) => {
              const isLastRow = rowIdx === hours.length - 1;

              return (
                <tr key={hour} style={{ height: `${ROW_HEIGHT_PX}px` }}>
                  <td
                    className={`border-r-2 border-gray-400 bg-gray-100 p-0 text-center align-middle ${
                      isLastRow ? '' : 'border-b-2 border-gray-400'
                    }`}
                  >
                    <span className="font-bold text-sm sm:text-base text-gray-700">
                      {hour}:00
                    </span>
                  </td>

                  {DAY_ORDER.map((dayKey, colIdx) => {
                    const cellKey = `${hour}-${dayKey}`;
                    if (renderedCells[cellKey]) return null;

                    const isLastCol = colIdx === DAY_ORDER.length - 1;
                    const dayRecords = validRecords.filter((item) =>
                      item.days.includes(dayKey)
                    );

                    let matchingRecords = dayRecords.filter(
                      ({ range }) =>
                        hour >= range.startRowHour && hour <= range.endRowHour
                    );

                    if (matchingRecords.length === 0) {
                      return (
                        <td
                          key={dayKey}
                          className={`bg-white p-0 ${
                            isLastRow ? '' : 'border-b-2 border-gray-400'
                          } ${isLastCol ? '' : 'border-r-2 border-gray-400'}`}
                        />
                      );
                    }

                    let keepExpanding = true;
                    while (keepExpanding) {
                      keepExpanding = false;
                      const minH = Math.min(
                        ...matchingRecords.map((r) => r.range.startRowHour)
                      );
                      const maxH = Math.max(
                        ...matchingRecords.map((r) => r.range.endRowHour)
                      );

                      dayRecords.forEach((candidate) => {
                        if (
                          candidate.range.startRowHour <= maxH &&
                          candidate.range.endRowHour >= minH &&
                          !matchingRecords.includes(candidate)
                        ) {
                          matchingRecords.push(candidate);
                          keepExpanding = true;
                        }
                      });
                    }

                    const maxEndHour = Math.max(
                      hour,
                      ...matchingRecords.map((r) => r.range.endRowHour)
                    );
                    const rowspan = maxEndHour - hour + 1;

                    for (let h = hour; h <= maxEndHour; h++) {
                      renderedCells[`${h}-${dayKey}`] = true;
                    }

                    const cellHasAnyConflict = matchingRecords.some((r) =>
                      conflictKeys.has(`${r.idx}-${dayKey}`)
                    );

                    const sortedRecords = [...matchingRecords].sort((a, b) => {
                      if (a.range.startMinutes !== b.range.startMinutes) {
                        return a.range.startMinutes - b.range.startMinutes;
                      }
                      if (a.range.endMinutes !== b.range.endMinutes) {
                        return a.range.endMinutes - b.range.endMinutes;
                      }
                      return a.data.nrc.localeCompare(b.data.nrc);
                    });

                    const uniqueSchedules = new Set(
                      sortedRecords.map((r) => r.range.formatted)
                    );
                    const sharedScheduleText =
                      uniqueSchedules.size === 1
                        ? sortedRecords[0].range.formatted
                        : null;

                    const maxVisibleCards = rowspan === 1 ? 1 : rowspan;
                    const visibleRecords = sortedRecords.slice(0, maxVisibleCards);
                    const hiddenCount = sortedRecords.length - visibleRecords.length;
                    const hasOverflow = hiddenCount > 0;
                    const touchesBottomEdge = maxEndHour === hours[hours.length - 1];

                    const cardVariant =
                      sortedRecords.length === 1
                        ? 'single'
                        : rowspan === 1
                        ? 'tight'
                        : 'multi';

                    const openSlotModal = () => {
                      setActiveSlot({
                        dayKey,
                        dayName: DAY_NAMES[dayKey],
                        startHour: hour,
                        endHour: maxEndHour,
                        records: sortedRecords,
                        sharedScheduleText,
                      });
                    };

                    const cellBgClass = cellHasAnyConflict
                      ? 'bg-red-100/75'
                      : 'bg-blue-100/70';

                    return (
                      <td
                        key={dayKey}
                        rowSpan={rowspan}
                        onClick={sortedRecords.length > 1 ? openSlotModal : undefined}
                        className={`relative p-0 align-top transition-colors ${cellBgClass} ${
                          touchesBottomEdge ? '' : 'border-b-2 border-gray-400'
                        } ${isLastCol ? '' : 'border-r-2 border-gray-400'} ${
                          sortedRecords.length > 1
                            ? 'cursor-pointer hover:bg-blue-200/70'
                            : ''
                        }`}
                      >
                        <div className="absolute inset-0 p-1.5 flex flex-col justify-between gap-1 overflow-hidden">
                          {sortedRecords.length > 1 && (
                            <div className="flex justify-end shrink-0">
                              <span className="text-[11px] font-extrabold leading-none bg-blue-900/15 text-blue-950 px-1.5 py-[3px] rounded">
                                {sortedRecords.length} grupos
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                            {visibleRecords.map((item) =>
                              renderGroupCard(item, dayKey, {
                                variant: cardVariant,
                              })
                            )}
                          </div>

                          {hasOverflow && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSlotModal();
                              }}
                              className="w-full py-1 px-2 rounded bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold text-center shadow-sm transition-colors flex items-center justify-center gap-1 shrink-0"
                            >
                              <span>
                                + {hiddenCount}{' '}
                                {hiddenCount === 1 ? 'grupo más' : 'grupos más'}
                              </span>
                              <span className="opacity-85">· Ver todos</span>
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Grupos sin horario asignado */}
      {unscheduledRecords.length > 0 && (
        <div className="mt-4 p-3 rounded-lg border border-amber-300 bg-amber-50 text-left">
          <p className="text-sm font-bold text-amber-900 mb-1.5">
            Grupos sin día u horario asignado ({unscheduledRecords.length}):
          </p>
          <ul className="text-xs sm:text-sm text-amber-950 space-y-1">
            {unscheduledRecords.map(({ idx, data, professor }) => {
              const location =
                data.building && data.building !== 'SIN EDIFICIO'
                  ? `${data.building}${data.classroom ? ` - ${data.classroom}` : ''}`
                  : 'SIN EDIFICIO';

              return (
                <li key={idx}>
                  <span className="font-bold">NRC {data.nrc}</span> — {professor} ({location}) — 👥 {data.students} alumnos
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Modal de tarjetas */}
      {activeSlot && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlot(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-950 text-white px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-800 text-blue-100 px-2 py-0.5 rounded">
                    {subjectCode}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold">
                    {activeSlot.dayName} ·{' '}
                    {activeSlot.sharedScheduleText ||
                      `${activeSlot.startHour}:00 - ${activeSlot.endHour + 1}:00`}
                  </h4>
                  <span className="text-xs font-bold bg-white/15 text-white px-2.5 py-0.5 rounded-full">
                    {activeSlot.records.length}{' '}
                    {activeSlot.records.length === 1 ? 'grupo' : 'grupos'}
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">{subjectName}</p>
              </div>

              <HoverTooltip
                text="Cerrar detalle"
                scaleFix={scaleFix}
                delay={1000}
                wrapperClassName="shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setActiveSlot(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </HoverTooltip>
            </div>

            <div className="p-4 bg-blue-50/70 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSlot.records.map((item) =>
                renderGroupCard(item, activeSlot.dayKey, {
                  variant: 'modal',
                })
              )}
            </div>

            <div className="bg-gray-100 px-5 py-2.5 border-t border-gray-300 flex items-center justify-between text-xs text-gray-600">
              <span>Haz clic fuera o presiona Esc para volver al horario completo.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}