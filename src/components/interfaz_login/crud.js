import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar';
import NavbarCrud from './navbar_crud';
import { toast } from 'react-toastify';

export default function Crud() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingRole, setPendingRole] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteModalBuilding, setShowDeleteModalBuilding] = useState(false);
  const [showEditModalBuilding, setShowEditModalBuilding] = useState(false);
  const [showAddModalBuilding, setShowAddModalBuilding] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [buildingToEdit, setBuildingToEdit] = useState(null);
  const [originalBuilding, setOriginalBuilding] = useState(null);
  const [buildingToAdd, setBuildingToAdd] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const navigate = useNavigate();
  const username = localStorage.getItem("username"); // Para obtener el usuario.

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if (userRole !== 'superuser') {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Quill - CRUD";
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

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteBuilding = (building) => {
    setBuildingToDelete(building);
    setShowDeleteModalBuilding(true);
  };
  
  const handleEditBuilding = (building) => {
    setBuildingToEdit(building);
    setOriginalBuilding(building);
    setShowEditModalBuilding(true);
  };

  const handleAddBuilding = () => {
    setShowAddModalBuilding(true);
  };

  const cancelDeleteUser = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };
  
  const cancelDeleteBuilding = () => {
    setShowDeleteModalBuilding(false);
    setBuildingToDelete(null);
  };

  const cancelEditBuilding = () => {
    setShowEditModalBuilding(false);
    setBuildingToEdit(null);
    setOriginalBuilding(null);
  };

  const cancelAddBuilding = () => {
    setShowAddModalBuilding(false);
    setBuildingToAdd(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBuildingToEdit((prev) => ({ ...prev, [name]: value }));
  };



  // Cargar usuarios al montar
  useEffect(() => {
    const excludedUser = username;
    fetch(`/api/users?exclude=${excludedUser}`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Error al obtener usuarios:', err));
  }, []);


  // EDIFICIOS
  useEffect(() => {
    fetch("/api/buildings")
      .then(response => response.json())
      .then(data => {
        const buildings = data.edifp || [];
        const prioritized = buildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = buildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");
        
        // Combinamos y actualizamos el estado
        const newBuildingsOrder = [...prioritized, ...rest];
        setBuildings(newBuildingsOrder);
      })
      .catch(error => console.error("Error cargando los edificios:", error));
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

  // EDITAR EDIFICIO
  const handleSaveEditBuilding = async () => {
    if (!buildingToEdit.value || !buildingToEdit.text) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    const params = new URLSearchParams({
      buildingName: originalBuilding.value,
      buildingText: originalBuilding.text
    });

    const cleanedBuildingData = {
      value: buildingToEdit.value,
      text: buildingToEdit.text,
    };

    try {
      const res = await fetch(`/api/buildings?${params.toString()}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedBuildingData),
      });

      if (res.ok) {
        setBuildings((prev) =>
          prev.map((building) =>
            building.value === originalBuilding.value && building.text === originalBuilding.text
              ? { ...building, ...cleanedBuildingData }
              : building
          )
        );
        toast.success("Edificio actualizado correctamente");
      } else {
        toast.error("Error al actualizar el edificio");
      }
    } catch (error) {
      console.error("Error al actualizar el edificio:", error);
    } finally {
      setShowEditModalBuilding(false);
      setBuildingToEdit(null);
    }
  };


  // ELIMINAR EDIFICIO
  const confirmDeleteBuilding = async () => {
    if (!buildingToDelete) return;
    
    const params = new URLSearchParams({
      buildingName: buildingToDelete.value,
      buildingText: buildingToDelete.text
    });

    try {
      const res = await fetch(`/api/buildings?${params.toString()}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBuildings((prevBuildings) => prevBuildings.filter((building) => building.value !== buildingToDelete.value));
        toast.success('Se eliminó correctamente.');
      } else {
        console.error('Fallo al eliminar edificio');
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("Hubo un error al eliminar el edificio.");
    } finally {
      setShowDeleteModalBuilding(false);
      setBuildingToDelete(null);
    }
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


  const handleSaveBuilding = async () => {
    if (!buildingToAdd) return;

    const params = new URLSearchParams({
      buildingName: buildingToAdd.value,
      buildingText: buildingToAdd.text
    });

    try {
      const response = await fetch(`/api/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: buildingToAdd.value,
          text: buildingToAdd.text,
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error('Error desde el servidor:', result.error || 'Error desconocido');
        toast.error('Error al agregar el edificio.')
        return;
      } else {
        setBuildings(prev => [...prev, buildingToAdd]);
        toast.success("Edificio agregado correctamente");
      }
    } catch (err) {
      console.error("Error al agregar el edificio:", err);
    } finally {
      setShowAddModalBuilding(false);
      setBuildingToAdd(null);
    }
  };

  return (
    <div className="bg-gray-100 flex">

      <div className="flex flex-col w-full">
        <NavbarCrud/>

        <div className="pt-32 px-8 min-h-screen bg-gray-100">
          <div className="bg-white p-4 rounded-lg shadow-md custom-shadow-border-reports"> {/* Cuadro blanco para encapsular todo.*/}
            <h2 className="text-2xl font-bold mb-8 text-center">Administración</h2>
            <div className="flex flex-row gap-8">
              {/* Tabla de Usuarios */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-center">Usuarios</h3>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => navigate('/registro')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    Registrar nuevo usuario
                  </button>
                </div>
                <div className="max-h-96 min-h-96 overflow-y-auto rounded-lg shadow">
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
                              <option value="user">User</option>
                              <option value="superuser">Super_user</option>
                              <option value="tecnico">Técnico</option>
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
                          <td colSpan="3" className="text-center py-4 text-gray-500">
                            No hay usuarios registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla de Edificios */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-center">Edificios</h3>
                <div className="flex justify-end mb-4">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    onClick={handleAddBuilding}
                  >
                    Agregar nuevo edificio
                  </button>
                </div>
                <div className="max-h-96 min-h-96 overflow-y-auto rounded-lg shadow">
                  <table className="min-w-full bg-white">
                    <thead className="sticky top-0 bg-gray-200 z-1">
                      <tr className="text-gray-700">
                        <th className="py-2 px-4 text-left">Edificio</th>
                        <th className="py-2 px-4 text-left">Seudónimo</th>
                        <th className="py-2 px-4 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildings.map((building, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{building.value}</td>
                          <td className="py-2 px-4">{building.text}</td>
                          <td className="py-2 px-4">
                            <button
                              onClick={() => handleEditBuilding(building)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition mr-2"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteBuilding(building)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                            >
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
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
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
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4">¿Eliminar usuario?</h3>
            <p className="mb-6">
              ¿Estás seguro de eliminar al usuario <strong>{userToDelete?.username}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteUser}
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
      {showDeleteModalBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4">¿Eliminar edificio?</h3>
            <p className="mb-6">
              ¿Estás seguro de eliminar el edificio <strong>{buildingToDelete?.value}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteBuilding}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteBuilding}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditModalBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4">Modificar Edificio</h3>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="value">
              Nombre del Edificio:
            </label>
            <input
              name="value"
              value={buildingToEdit.value}
              onChange={handleInputChange}
              placeholder="Nombre del Edificio"
              className="w-full mb-3 p-2 border rounded"
            />
            <label className="block text-gray-700 font-medium mb-1" htmlFor="value">
              Seudónimo libre del Edificio:
            </label>
            <input
              name="text"
              value={buildingToEdit.text}
              onChange={handleInputChange}
              placeholder="Seudónimo"
              className="w-full mb-3 p-2 border rounded"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelEditBuilding}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditBuilding}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddModalBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4 custom-shadow-border">Agregar Edificio</h3>
            <input
              name="value"
              value={buildingToAdd?.value ?? ''}
              onChange={(e) => setBuildingToAdd((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="Nombre del Edificio"
              className="w-full mb-3 p-2 border rounded"
            />

            <input
              name="text"
              value={buildingToAdd?.text ?? ''}
              onChange={(e) => setBuildingToAdd((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="Seudónimo"
              className="w-full mb-3 p-2 border rounded"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelAddBuilding}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBuilding}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
