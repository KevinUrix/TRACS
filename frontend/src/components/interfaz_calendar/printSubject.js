import {
  DAY_NAMES,
  DAY_ORDER,
  normalizeSubjectCode,
  extractCourseDays,
  parseScheduleRange,
  detectSubjectConflicts,
} from './scheduleUtils';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const handlePrintSubject = (subjectSchedule, searchCode, cycle) => {
  if (!Array.isArray(subjectSchedule) || subjectSchedule.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes para imprimir.');
    return;
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
  const subjectCode = normalizeSubjectCode(firstData.code) || normalizeSubjectCode(searchCode);

  // Conteo de grupos únicos por NRC y total de alumnos inscritos
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

  // 7 filas en hoja 1 con encabezado, 8 en las siguientes)
  const FIRST_PAGE_ROWS = 7;
  const NEXT_PAGE_ROWS = 8;
  const pageRanges = [];
  let cursor = 0;

  while (cursor < hours.length) {
    const limit = pageRanges.length === 0 ? FIRST_PAGE_ROWS : NEXT_PAGE_ROWS;
    const slice = hours.slice(cursor, cursor + limit);
    pageRanges.push({
      startHour: slice[0],
      endHour: slice[slice.length - 1],
    });
    cursor += limit;
  }

  const renderedCells = {};
  let tbodyHtml = '';

  pageRanges.forEach((currentPage, pageIndex) => {
    const isLastPage = pageIndex === pageRanges.length - 1;
    const pageHours = hours.filter(
      (h) => h >= currentPage.startHour && h <= currentPage.endHour
    );

    pageHours.forEach((hour) => {
      const isPageEndRow = !isLastPage && hour === currentPage.endHour;
      tbodyHtml += `<tr class="table-row ${isPageEndRow ? 'page-break-row' : ''}"><td class="time-col"><span>${hour}:00</span></td>`;

      DAY_ORDER.forEach((dayKey) => {
        const cellKey = `${hour}-${dayKey}`;
        if (renderedCells[cellKey]) return;

        // Solo considera registros activos dentro del rango de la página actual
        const pageRecords = validRecords.filter(
          (item) =>
            item.days.includes(dayKey) &&
            item.range.endRowHour >= currentPage.startHour &&
            item.range.startRowHour <= currentPage.endHour
        );

        let matchingRecords = pageRecords.filter(
          ({ range }) => hour >= range.startRowHour && hour <= range.endRowHour
        );

        if (matchingRecords.length === 0) {
          tbodyHtml += `<td class="day-col"></td>`;
          return;
        }

        let keepExpanding = true;
        while (keepExpanding) {
          keepExpanding = false;
          const minH = Math.max(
            currentPage.startHour,
            Math.min(...matchingRecords.map((r) => r.range.startRowHour))
          );
          const maxH = Math.min(
            currentPage.endHour,
            Math.max(...matchingRecords.map((r) => r.range.endRowHour))
          );

          pageRecords.forEach((candidate) => {
            const candStart = Math.max(currentPage.startHour, candidate.range.startRowHour);
            const candEnd = Math.min(currentPage.endHour, candidate.range.endRowHour);
            if (
              candStart <= maxH &&
              candEnd >= minH &&
              !matchingRecords.includes(candidate)
            ) {
              matchingRecords.push(candidate);
              keepExpanding = true;
            }
          });
        }

        // Limita el rowspan para no cruzar el salto de hoja
        const maxEndHour = Math.min(
          currentPage.endHour,
          Math.max(hour, ...matchingRecords.map((r) => r.range.endRowHour))
        );
        const rowspan = maxEndHour - hour + 1;

        for (let h = hour; h <= maxEndHour; h++) {
          renderedCells[`${h}-${dayKey}`] = true;
        }

        const hasMultipleGroups = matchingRecords.length > 1;
        const isCompactSingleRow = rowspan === 1 && matchingRecords.length >= 4;
        const cellHasConflict = matchingRecords.some((r) =>
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

        let cellContent = `<div class="cell-content ${hasMultipleGroups ? 'multi-group' : ''} ${isCompactSingleRow ? 'compact-cell' : ''}">`;

        sortedRecords.forEach(({ idx, data, professor, range }) => {
          const isItemConflict = conflictKeys.has(`${idx}-${dayKey}`);
          const badgeCls = isItemConflict ? 'students-conflict' : 'students-normal';
          const isContinuation = pageIndex > 0 && range.startRowHour < currentPage.startHour;

          cellContent += `
            <div class="group-item ${isItemConflict ? 'group-conflict' : ''}">
              <span class="group-prof">${escapeHtml(professor)}${isContinuation ? ' <span class="cont-tag">(cont.)</span>' : ''}</span>
              <div class="nrc-row">
                <span class="nrc">NRC ${escapeHtml(data.nrc)}</span>
                <span class="students-badge ${badgeCls}"><span class="badge-emoji">👥</span>${data.students} alum.</span>
              </div>
            </div>
          `;
        });

        cellContent += `</div>`;
        tbodyHtml += `<td rowspan="${rowspan}" class="day-col ${cellHasConflict ? 'cell-conflict' : 'cell-normal'}">${cellContent}</td>`;
      });

      tbodyHtml += `</tr>`;
    });
  });

  let unscheduledHtml = '';
  if (unscheduledRecords.length > 0) {
    const itemsHtml = unscheduledRecords
      .map(({ data }) => `<span><strong>NRC ${escapeHtml(data.nrc)}</strong> (${data.students} alum.)</span>`)
      .join(' &nbsp;|&nbsp; ');

    unscheduledHtml = `
      <div class="unscheduled-note">
        <strong>Grupos sin día u horario asignado (${unscheduledRecords.length}):</strong> ${itemsHtml}
      </div>
    `;
  }

  const headerMetrics = [
    `Ciclo: ${escapeHtml(cycle)}`,
    `${groupCount} ${groupCount === 1 ? 'grupo' : 'grupos'}`,
    `${totalEnrolled} ${totalEnrolled === 1 ? 'alumno inscrito' : 'alumnos inscritos'}`,
    `Impreso el ${new Date().toLocaleDateString()}`,
    ...(pageRanges.length > 1 ? [`${pageRanges.length} páginas`] : []),
  ].join(' | ');

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(subjectCode)} - ${escapeHtml(subjectName)}</title>
        <style>
          @page {
            size: landscape;
            margin: 6mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 4px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
          }
          .print-header {
            text-align: center;
            margin-bottom: 5px;
            padding-bottom: 2px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-header h2 {
            margin: 0;
            font-size: 14.5px;
            color: #1f2937;
            text-transform: uppercase;
          }
          .subject-code-tag {
            display: inline-block;
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 12.5px;
            margin-right: 6px;
            vertical-align: middle;
          }
          .print-info {
            display: block;
            font-size: 11.5px;
            font-weight: normal;
            color: #4b5563;
            text-transform: none;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            box-sizing: border-box;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
            height: 85px;
          }
          tr.page-break-row {
            page-break-after: always;
            break-after: page;
          }
          thead tr {
            height: 28px;
          }
          th, td {
            border: 2px solid #374151 !important;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
            box-sizing: border-box;
            background-clip: padding-box;
          }
          th {
            background-color: #e5e7eb !important;
            font-weight: bold;
            color: #1f2937;
            padding: 5px;
            font-size: 13.5px;
          }
          td {
            vertical-align: middle;
            padding: 0;
            position: relative;
            overflow: hidden;
          }
          .time-col {
            background-color: #f9fafb !important;
            font-weight: bold;
            color: #374151;
            width: 7.5%;
            font-size: 12.5px;
          }
          .day-col {
            width: 15.41%;
          }
          .cell-normal { background-color: #eff6ff !important; }
          .cell-conflict { background-color: #fef2f2 !important; }

          .cell-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 3px;
            box-sizing: border-box;
            overflow: hidden;
            min-height: 0;
          }
          .cell-content.multi-group {
            justify-content: space-evenly;
          }
          .group-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            min-height: 0;
          }
          .group-prof {
            font-size: 6.3px;
            font-weight: 600;
            color: #4b5563;
            line-height: 1.05;
            margin-bottom: 1.5px;
            max-width: 100%;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word;
            white-space: normal;
          }
          .cont-tag {
            font-weight: normal;
            color: #d20505;
          }
          .compact-cell .group-prof {
            -webkit-line-clamp: 1;
            margin-bottom: 1px;
          }
          .compact-cell .nrc,
          .compact-cell .students-badge {
            height: 13px;
            font-size: 9px;
          }
          .nrc-row {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            justify-content: center;
            align-items: center;
          }
          .nrc,
          .students-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 15px;
            box-sizing: border-box;
            font-size: 10px;
            font-weight: bold;
            padding: 0 5px;
            border-radius: 3px;
            line-height: 1;
            border: 1px solid transparent;
          }
          .nrc {
            background: #1e3a8a !important;
            color: #ffffff !important;
            border-color: #1e3a8a;
          }
          .group-conflict .nrc {
            background: #ffffff !important;
            color: #b91c1c !important;
            border-color: #fca5a5;
          }
          .badge-emoji {
            font-size: 8px;
            line-height: 1;
            margin-right: 2px;
          }
          .students-normal {
            background-color: #ecfdf5 !important;
            color: #065f46;
            border-color: #6ee7b7;
          }
          .students-conflict {
            background-color: #ffffff !important;
            color: #991b1b;
            border-color: #fca5a5;
          }
          .unscheduled-note {
            margin-top: 5px;
            padding: 4px 6px;
            border: 1px solid #f59e0b;
            background-color: #fffbeb !important;
            font-size: 10px;
            color: #78350f;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>
            <span class="subject-code-tag">${escapeHtml(subjectCode)}</span>${escapeHtml(subjectName)}
          </h2>
          <span class="print-info">${headerMetrics}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="time-col">Hora</th>
              ${DAY_ORDER.map((d) => `<th>${DAY_NAMES[d]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
        ${unscheduledHtml}
      </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      if (!isMobile) {
        printWindow.close();
      }
    }, 100);
  };
};