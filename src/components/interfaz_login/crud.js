import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar';
import NavbarCrud from './navbar_crud';

export default function Crud() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const navigate = useNavigate();
  const username = localStorage.getItem("username"); // Para obtener el usuario.

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    
    if (userRole !== 'superuser') {
      navigate('/');
    }
  }, [navigate]);


  // Cargar usuarios al montar
  useEffect(() => {
    const excludedUser = username;
  
    fetch(`/api/users?exclude=${excludedUser}`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Error al obtener usuarios:', err));
  }, []);

  // Actualizar rol
  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        // Refrescar la lista local
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? { ...user, role: newRole } : user))
        );
      }
    } catch (err) {
      console.error('Error al actualizar el rol:', err);
    }
  };
  

  return (
    <div className="bg-gray-100 flex">
      <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      <div className="flex flex-col w-full">
        <NavbarCrud toggleSidebar={toggleSidebar} />

        <div className="p-36 min-h-screen bg-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-center">Administrar Usuarios</h2>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate('/registro')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Registrar nuevo usuario
            </button>
          </div>
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-2 px-4 text-left">Usuario</th>
                <th className="py-2 px-4 text-left">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-2 px-4">{user.username}</td>
                  <td className="py-2 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="user">user</option>
                      <option value="superuser">superuser</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-4 text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
