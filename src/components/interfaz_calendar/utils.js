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
  const header = table.querySelector("thead tr");
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));

  const totalCols = header.children.length; // toma el número de columnas
  const chunkSize = 10; // número de aulas por página

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
    // Índices relativos al bloque (0 a chunkSize-1)
    const rowspanTracker = new Array(end - start).fill(0);

    for (let rowIndex = 0; rowIndex < bodyRows.length; rowIndex++) {
      const row = bodyRows[rowIndex];
      const newRow = document.createElement("tr");

      // Clonar columna de hora (index 0)
      newRow.appendChild(row.children[0].cloneNode(true));

      // Iterar columnas de aulas en el bloque
      for (let colIndex = start; colIndex < end; colIndex++) {
        const relativeColIndex = colIndex - start;

        // Si hay rowspan activo para esta columna, no ponemos td, solo ponemos contador
        if (rowspanTracker[relativeColIndex] > 0) {
          rowspanTracker[relativeColIndex]--;
          continue; // no agregamos <td>
        }

        const cell = row.children[colIndex];
        if (cell) {
          newRow.appendChild(cell.cloneNode(true));

          // Si la celda tiene rowspan > 1, lo registramos para las próximas filas
          const rs = parseInt(cell.getAttribute("rowspan") || "1", 10);
          if (rs > 1) {
            rowspanTracker[relativeColIndex] = rs - 1;
          }
        } else {
          // No hay celda, ponemos vacía
          const emptyCell = document.createElement("td");
          newRow.appendChild(emptyCell);
        }
      }

      tbody.appendChild(newRow);
    }

    newTable.appendChild(tbody);
    blocks.push(newTable.outerHTML);
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Horario ${selectedBuilding}</title>
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
          }
          .reserved-cell {
            background-color: #0a304b !important;
            color: white !important;
            font-weight: 500;
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
          }
          .course-students, .course-date {
            font-size: 9px;
            color: #dcf70b;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>Horario ${selectedBuilding}</h2>
          <p>Día: ${mapDaysInverse[selectedDay] || selectedDay} | Ciclo: ${selectedCycle}</p>
          <p>Impreso el ${new Date().toLocaleDateString()}</p>
        </div>
        ${blocks.join("<div style='page-break-after: always;'></div>")}
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};
