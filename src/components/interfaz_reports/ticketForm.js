import { useState } from 'react';

export default function TicketForm({ addTicket }) {
  const [edificio, setEdificio] = useState('');
  const [salon, setSalon] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    // Crear el objeto del ticket
    const newTicket = { edificio, salon, fecha, descripcion };

    // Pasar el ticket al componente principal
    addTicket(newTicket);

    // Limpiar el formulario
    setEdificio('');
    setSalon('');
    setFecha('');
    setDescripcion('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edificio" className="block text-gray-700">Edificio:</label>
        <select 
          id="edificio"
          value={edificio}
          onChange={(e) => setEdificio(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-lg w-full" 
          required
        >
          <option value="">Selecciona un edificio</option>
          <option value="Edificio 1">Edificio 1</option>
          <option value="Edificio 2">Edificio 2</option>
          <option value="Edificio 3">Edificio 3</option>
          <option value="Edificio 4">Edificio 4</option>
        </select>
      </div>  

      <div>
        <label htmlFor="salon" className="block text-gray-700">Salón:</label>
        <select
          id="salon"
          value={salon}
          onChange={(e) => setSalon(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full"
          required
        >
          <option value="">Selecciona un salón</option>
          <option value="Salón 1">Salón 1</option>
          <option value="Salón 2">Salón 2</option>
          <option value="Salón 3">Salón 3</option>
          <option value="Salón 4">Salón 4</option>
        </select>
      </div>

      <div>
        <label htmlFor="fecha" className="block text-gray-700">Fecha:</label>
        <input
          type="date"
          id="fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full"
          required
        />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-gray-700">Descripción del problema:</label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full resize-y overflow-auto max-h-48"
          rows="4"
          placeholder="Describe el problema..."
          required
        ></textarea>
      </div>

      <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg w-full">
        Agregar Ticket
      </button>
    </form>
  );
}
