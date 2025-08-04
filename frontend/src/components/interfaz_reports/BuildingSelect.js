import { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import "./reports.css"


export default function BuildingSelect({ selectedBuilding, onChange }) {
  const [building, setBuilding] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/buildings`)
      .then((res) => res.json())
      .then((data) => {
        const buildings = data.edifp || [];
        // Filtra para que no tome en cuenta las clases virtuales
        const filteredBuildings = buildings.filter(b => b.value !== "DESV1" && b.value !== "DESV2");
        const prioritized = filteredBuildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = filteredBuildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");
        setBuilding([...prioritized, ...rest]);
      })
      .catch((err) => console.error("Error cargando edificios:", err));
  }, []);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const selectedObj = building.find(b => b.value === selectedValue);
    onChange(selectedObj || { value: '', text: 'Todos los edificios 🏢' });
  };


  return (
    <div className="flex space-x-6">
        <select
            value={selectedBuilding}
            onChange={handleChange}
            className="building-select"
        >
            <option value="">Todos los edificios 🏢</option>
            {building.map((b, index) => (
            <option key={index} value={b.value}>
                {b.text}
            </option>
            ))}
        </select>
    </div>
  );
}
