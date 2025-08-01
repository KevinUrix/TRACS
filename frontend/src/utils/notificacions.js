import { toast } from 'sonner';

export const notifyReserva = (mensaje, reservation, onSeen) => {
  toast.success(mensaje, {
    description: (
      <div>
        <p>📍 Edificio: {reservation.building} ({reservation.classroom}).</p>
        <p>📖 Profesor: {reservation.professor}.</p>
        {reservation.user && <p>👤 Usuario: {reservation.user.charAt(0).toUpperCase() + reservation.user.slice(1)}</p>}
      </div>
    ),
    style: {
      backgroundColor: '#16a34a',
      color: 'white',
      border: '1px solid #16a34a',
      fontSize: '1rem',
    },
    variant: 'default',
    onAutoClose: () => {
      if (onSeen) onSeen();
    }
  });
};

export const notifyTicket = (mensaje, ticket, onSeen) => {
  toast.success(mensaje, {
    description: (
    <div>
      <b>{ticket.title}</b>
      <p>Edificio: {ticket.building}.</p>
      <p>Prioridad: {ticket.priority}.</p>
      <p>
        Creado por: {ticket.created_by.charAt(0).toUpperCase() + ticket.created_by.slice(1)}.
      </p>

    </div>
    ),
    style: {
      backgroundColor: '#3949AB',
      color: 'white',
      border: '1px solid #3F51B5',
      fontSize: '1rem',
    },
    variant: 'default',
    onAutoClose: () => {
      if (onSeen) onSeen();
    }
  });
};


/* SI GINA QUIERE AGREGAR MÁS TOAST DE TOASTER ESTOS PUEDEN USARSE Y MODIFICARSE AL GUSTO */
export const notifyError = (mensaje) => {
  toast.error('❌ Error', {
    description: mensaje,
    className: 'bg-red-700 text-white border border-red-500',
    duration: 4000,
  });
};

export const notifyInfo = (mensaje) => {
  toast(mensaje, {
    className: 'bg-blue-800 text-white border border-blue-400',
    icon: 'ℹ️',
    duration: 3000,
  });
};

export const notifyWarn = (mensaje) => {
  toast.warning('⚠️ Advertencia', {
    description: mensaje,
    className: 'bg-yellow-600 text-black border border-yellow-400',
    duration: 4000,
  });
};
