export const handlePrint = (selectedBuilding, selectedDay, selectedCycle) => {
  const mapDaysInverse = {
    L: 'Lunes',
    M: 'Martes',
    I: 'Miércoles',
    J: 'Jueves',
    V: 'Viernes',
    S: 'Sábado',
  };

  const table = document.getElementById("schedule-table");
  if (!table) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite ventanas emergentes para imprimir.');
    return;
  }
  
  const header = table.querySelector("thead tr");
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));

  const totalCols = header.children.length; // toma el número de columnas
  const chunkSize = 11; // número de aulas por página

  const blocks = [];

  for (let start = 1; start < totalCols; start += chunkSize) {
    const newTable = document.createElement("table");
    newTable.style.marginBottom = "20px";
    newTable.style.width = "100%";
    newTable.style.borderCollapse = "collapse";
    newTable.style.tableLayout = "fixed";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Columna hora (indice 0)
    headerRow.appendChild(header.children[0].cloneNode(true));

    // Columnas de aulas en este bloque
    const end = Math.min(start + chunkSize, totalCols);
    for (let i = start; i < end; i++) {
      if (header.children[i]) {
        headerRow.appendChild(header.children[i].cloneNode(true));
      }
    }
    thead.appendChild(headerRow);
    newTable.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Control para rowspan: para cada columna (solo las aulas, no hora),
    // guardamos cuántas filas faltan para que termine el rowspan
    const rowspanTracker = new Array(end - start).fill(0);

    for (let rowIndex = 0; rowIndex < bodyRows.length; rowIndex++) {
      const row = bodyRows[rowIndex];
      const newRow = document.createElement("tr");

      // Clona la columna de hora
      newRow.appendChild(row.children[0].cloneNode(true));

      let visualColIndex = 0;
      let realCellIndex = start;

      while (visualColIndex < end - start) {
        if (rowspanTracker[visualColIndex] > 0) {
          rowspanTracker[visualColIndex]--;
          visualColIndex++;
          continue;
        }

        const cell = row.children[realCellIndex];
        
        if (cell) {
        const rs = parseInt(cell.getAttribute("rowspan") || "1", 10);
        const cs = parseInt(cell.getAttribute("colspan") || "1", 10);

        const cloned = document.createElement("td");

        // Muestra contenido sólo si NO es "R"
        const isR = cell.innerText.trim() === "R";
        cloned.innerHTML = isR ? "" : cell.innerHTML;
        cloned.className = cell.className;
        cloned.setAttribute("style", cell.getAttribute("style") || "");

        if (rs > 1) cloned.setAttribute("rowspan", rs);
        if (cs > 1) cloned.setAttribute("colspan", cs);

        newRow.appendChild(cloned);

        for (let i = 0; i < cs; i++) {
          if (rs > 1) {
            rowspanTracker[visualColIndex + i] = rs - 1;
          }
        }

        visualColIndex += cs;
        realCellIndex++;
      } else {
        const empty = document.createElement("td");
        newRow.appendChild(empty);
        visualColIndex++;
      }
    }

      tbody.appendChild(newRow);
    }

    newTable.appendChild(tbody);
    blocks.push(newTable.outerHTML);
  }

  const containsDuct1 = Array.from(header.children).some(th => th.textContent.trim() === "DUCT1");
  // Define el título según la condición
  const titleText = containsDuct1 ? `Conteo de alumnos - ${mapDaysInverse[selectedDay] || selectedDay}` : `Horario - ${selectedBuilding} - ${mapDaysInverse[selectedDay] || selectedDay}`;

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="icon" href="tracs_page.webp" />
        <link rel="apple-touch-icon" href="tracs_page.webp" />
        <title>${titleText}</title>
        <style>
          @page {
            size: landscape;
            margin: 5mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
          }
          .print-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
            vertical-align: top;
            page-break-inside: avoid;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #333;
          }
          td:first-child {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #333;
            height: 3rem !important;
          }
          .occupied-cell {
            color: white !important;
            font-weight: 500;
            text-align: center;
          }
          .reserved-cell {
            background-color: #0a304b !important;
            color: white !important;
            font-weight: 500;
          }
          td {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
            overflow-wrap: break-word;
            hyphens: auto;
            vertical-align: middle;
          }
          ${Array.from({length: 21}, (_, i) => `
            .course-color-${i+1} {
              color: white !important;
              font-weight: 500;
            }
          `).join('')}
          .reserve-button, .print-button, .sidebar, .select-content, .navbar {
            display: none !important;
          }
          .professor-name {
            font-size: 11px;
            margin-bottom: 3px;
            font-weight: 650;
          }
          .course-name {
            font-size: 10px;
            margin-bottom: 3px;
            color: #dcf70b;
            font-weight: 400;
            font-style: italic;
          }
          .course-students, .course-date {
            font-size: 9px;
            color: #dcf70b;
          }
          /* Colores para la tabla de Conteo de alumnos */
          .bg-red-100 { background-color: #fee2e2; }
          .bg-yellow-100 { background-color: #fef9c3; }
          .bg-green-100 { background-color: #dcfce7; }
          .bg-blue-100 { background-color: #dbeafe; }
          .bg-indigo-100 { background-color: #e0e7ff; }
          .bg-purple-100 { background-color: #ede9fe; }
          .bg-pink-100 { background-color: #fce7f3; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .bg-purple-200 { background-color: #ddd6fe; }
          .bg-gray-200 { background-color: #e5e7eb; }
          .bg-gray-300 { background-color: #d1d5db }

          .text-blue-600 { color: #2563eb; }
          .text-green-600 { color: #16a34a; }
          .font-bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>${titleText}</h2>
          <p>Día: ${mapDaysInverse[selectedDay] || selectedDay} | Ciclo: ${selectedCycle}</p>
          <p>Impreso el ${new Date().toLocaleDateString()}</p>
        </div>
        ${blocks.join("<div style='page-break-after: always;'></div>")}
        <script>
          setTimeout(() => {
            window.print();
            ${isMobile ? '' : 'window.close();'}
          }, 300);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const pastelColors = [
  'bg-red-100',
  'bg-yellow-100',
  'bg-green-100',
  'bg-blue-100',
  'bg-indigo-100',
  'bg-purple-100',
  'bg-pink-100',
  'bg-gray-100',
  'bg-green-100',
  'bg-purple-200'
];

