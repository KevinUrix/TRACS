import { useEffect } from 'react';
import './reports.css';

export default function PrintTicket({ ticket, onClose }) {

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  useEffect(() => {
    const printContent = document.getElementById('print-content');
    const blocks = [];

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Por favor, permite ventanas emergentes para imprimir.');
        return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte #${ticket.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #4629ba; }
            .section { margin-bottom: 1.2rem; }
            .label { font-weight: bold; }
            
            @media print {
                html, body {
                    height:100vh; 
                    margin: 0 !important; 
                    padding: 0 !important;
                }

                .footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 0.9rem;
                    padding: 10px 20px;
                    border-top: 1px solid #ccc;
                    background: white;
                }

                .print:last-child {
                    page-break-after: auto;
                }
            }
          </style>
          <link rel="icon" href="tracs_page.webp" />
          <link rel="apple-touch-icon" href="tracs_page.webp" />
        </head>
        <body style="display: flex; flex-direction: column; min-height: 100vh; padding-bottom: 120px;">
          <div style="flex-grow: 1;">
            <div style="border-top: 1px solid #ccc; margin-bottom: 10px;"></div>
            <h2 style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; white-space: normal;"> ${ticket.title} </h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 1.2rem;">
                <div><span class="label">Edificio:</span> ${ticket.building}</div>
                <div><span class="label">Salón:</span> ${ticket.room}</div>
            </div>
            
            <div class="section" style="margin-bottom: 2em;">
                <div style="margin-bottom: 1em;">
                    <span class="label">Reporte:</span>
                </div>
                <div style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; white-space: pre-wrap;">${ticket.report}</div>
            </div>
          </div>

          <div class="footer">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <div class="section"><span class="label">Categoría:</span> ${ticket.category}</div>
              <div class="section"><span class="label">Prioridad:</span> ${ticket.priority}</div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <div class="section"><span class="label">Creador:</span> ${ticket.created_by}</div>
              <div class="section"><span class="label">Modificado por:</span> ${ticket.modified_by || 'N/A'}</div>
            </div>

            <div style="margin-bottom: 0.5rem;">
              <span class="label">Fecha de creación:</span> ${new Date(ticket.created_at).toLocaleString()}
            </div>

            <div class="section">
              <span class="label">Estado:</span> ${ticket.status}
            </div>
          </div>

          ${blocks.join("<div style='page-break-after: always;'></div>")}
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
    }

    if (onClose) {
      onClose();
    }
  }, [ticket, onClose]);

  return null;
}
