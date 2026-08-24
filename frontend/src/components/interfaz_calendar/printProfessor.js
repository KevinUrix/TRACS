import React from 'react';

const dayNames = { L: 'Lunes', M: 'Martes', I: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };
const dayOrder = ['L', 'M', 'I', 'J', 'V', 'S'];

export const handlePrintProfessor = (professor, courses, cycle) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes para imprimir.');
    return;
  }

  const minHour = 7;
  const maxHour = 20;
  const profHours = Array.from(
    { length: maxHour - minHour + 1 },
    (_, i) => i + minHour
  );

  const renderedCells = {};
  let tbodyHtml = '';

  profHours.forEach(hour => {
    tbodyHtml += `<tr class="table-row"><td class="time-col"><span>${hour}:00</span></td>`;
    
    dayOrder.forEach(dayKey => {
      const cellKey = `${hour}-${dayKey}`;
      if (renderedCells[cellKey]) return;

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
        const bgClass = isOverlap ? 'overlap' : 'normal';

        let cellContent = `<div class="cell-content">`;
        if (isOverlap) {
          cellContent += `<div class="empalme-badge">⚠️ EMPALME</div>`;
        }

        [...matchingCourses].sort((a, b) => {
          const endA = parseInt(a.data.schedule.split('-')[1].substring(0, 2), 10);
          const endB = parseInt(b.data.schedule.split('-')[1].substring(0, 2), 10);
          return endA - endB;
        }).forEach((c, i) => {
          const isFirst = i === 0;
          const [start, end] = c.data.schedule.split('-');

          cellContent += `
            <div class="course-item ${!isFirst && !isOverlap ? 'border-t' : ''}">
              
              ${(isOverlap && rowspan > 1) ? `
                <span class="course-time">
                  ${start.substring(0, 2)}:${start.substring(2, 4)} - ${end.substring(0, 2)}:${end.substring(2, 4)}
                </span>
              ` : ''}

              ${(!isOverlap || (rowspan > 1 && matchingCourses.length <= 2)) ? `<span class="code">${c.data.code}</span>` : ''}

              ${(!isOverlap || rowspan > 3) ? `<span class="name">${c.data.course}</span>` : ''}

              <div class="nrc-room">
                <span class="nrc">${c.data.nrc}</span>
                <span class="room">${c.data.building}-${c.data.classroom}</span>
              </div>
            </div>
          `;
        });
        
        cellContent += `</div>`;
        tbodyHtml += `<td rowspan="${rowspan}" class="day-col ${bgClass}">${cellContent}</td>`;
      } else {
        tbodyHtml += `<td class="day-col"></td>`;
      }
    });
    tbodyHtml += `</tr>`;
  });

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Horario - ${professor}</title>
        <style>
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
          }
          .print-header {
            text-align: center;
            margin-bottom: 6px;
            padding-bottom: 2px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .print-header h2 {
            margin: 0;
            font-size: 15px;
            color: #1f2937;
            text-transform: uppercase;
          }
          .print-info {
            font-size: 12px;
            font-weight: normal;
            color: #4b5563;
            text-transform: none;
            margin-left: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            box-sizing: border-box;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
            height: 49px;
          }
          thead tr {
            height: 30px;
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
            padding: 6px;
            font-size: 14px;
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
            width: 8%;
            font-size: 12px;
          }
          .day-col {
            width: 15.33%;
          }
          .overlap { background-color: #fef2f2 !important; }
          .normal { background-color: #eff6ff !important; }
          
          .cell-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2px;
            box-sizing: border-box;
            overflow: hidden;
            min-height: 0;
          }
          .overlap .cell-content {
            justify-content: space-around;
          }
          .empalme-badge {
            font-weight: bold;
            color: #dc2626;
            font-size: 8px;
            background-color: #fee2e2;
            padding: 1px 3px;
            border-radius: 2px;
            margin-bottom: 2px;
          }
          .course-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            min-height: 0;
          }
          .course-time {
            font-size: 11px;
            font-weight: 600;
            color: #dc2626;
            line-height: 1;
            margin-bottom: 2px;
          }
          .border-t {
            border-top: 1.5px solid #6b7280;
            margin-top: 2px;
            padding-top: 2px;
          }
          .code {
            font-weight: bold;
            font-size: 9px;
            color: #111827;
            line-height: 1;
          }
          .name {
            font-size: 10px;
            color: #374151;
            line-height: 1.05;
            margin: 2px 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word;
            white-space: normal;
          }
          .nrc-room {
            display: flex;
            gap: 4px;
            justify-content: center;
            align-items: center;
          }
          .nrc {
            font-size: 7px;
            border: 1px solid #9ca3af;
            background: #ffffff;
            padding: 1px 3px;
            border-radius: 2px;
            font-weight: 600;
            color: #111827;
          }
          .room {
            font-size: 10px;
            font-weight: bold;
            color: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>${professor}
            <span class="print-info">
              Ciclo: ${cycle} | Impreso el ${new Date().toLocaleDateString()}
            </span>
          </h2>
        </div>
        <table>
          <thead>
            <tr>
              <th class="time-col">Hora</th>
              ${dayOrder.map(d => `<th>${dayNames[d]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
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