import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar';
import NavbarCrud from './navbar_crud';

export default function Crud() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingRole, setPendingRole] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

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

   const handleConfirmChange = async () => {
    if (!selectedUser) return;

    await handleRoleChange(selectedUser.id, pendingRole);
    setShowModal(false);
    setSelectedUser(null);
    setPendingRole('');
  };

  const handleCancelChange = () => {
    setShowModal(false);
    setPendingRole('');
    setSelectedUser(null);
  };

  const handleSelectChange = (user, newRole) => {
    setSelectedUser(user);
    setPendingRole(newRole);
    setShowModal(true);
  };

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

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userToDelete.id));
      } else {
        console.error('Fallo al eliminar usuario');
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const [buildings, setBuildings] = useState([
    { id: 1, name: 'Edificio A', alias: 'A' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
    { id: 2, name: 'Edificio B', alias: 'B' },
  ]);

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
          <div className="max-h-96 overflow-y-auto rounded-lg shadow"> {/* Manejamos el tamaño de la tabla */}
            <table className="min-w-full bg-white">
              <thead className="sticky top-0 bg-gray-200 z-1">
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">Usuario</th>
                  <th className="py-2 px-4 text-left">Rol</th>
                  <th className="py-2 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2 px-4">{user.username}</td>
                    <td className="py-2 px-4">
                      <select
                        value={
                          selectedUser && selectedUser.id === user.id && pendingRole
                            ? pendingRole
                            : user.role
                        }
                        onChange={(e) => handleSelectChange(user, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="user">user</option>
                        <option value="superuser">superuser</option>
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <button
                          onClick={() => handleDeleteUser(user)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                        >
                          Eliminar
                      </button>
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
          <div className="mt-16 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Lista de Edificios</h2>
            <div className="flex justify-end mb-4">
              <button
                //onClick={() => navigate('/registro')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Agregar
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg shadow"> {/* Manejamos el tamaño de la tabla */}
              <table className="min-w-full bg-white">
                <thead className="sticky top-0 bg-gray-200 z-1">
                  <tr className="text-gray-700">
                    <th className="py-2 px-4 text-left">Edificio</th>
                    <th className="py-2 px-4 text-left">Seudónimo</th>
                    <th className="py-2 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((building) => (
                    <tr key={building.id} className="border-b">
                      <td className="py-2 px-4">{building.name}</td>
                      <td className="py-2 px-4">{building.alias}</td>
                      <td className="py-2 px-4">
                        <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition mr-2">
                          Editar
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {buildings.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-gray-500">
                        No hay edificios registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-4">¿Confirmar cambio de rol?</h3>
            <p className="mb-6">
              ¿Estás seguro de cambiar el rol de <strong>{selectedUser?.username}</strong> a{' '}
              <strong>{pendingRole}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelChange}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                No
              </button>
              <button
                onClick={handleConfirmChange}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-4">¿Eliminar usuario?</h3>
            <p className="mb-6">
              ¿Estás seguro de eliminar al usuario <strong>{userToDelete?.username}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
