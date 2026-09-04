import { getDecodedToken } from '../../utils/auth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../../config/api';
import './crud.css';
import Footer from '../interfaz_calendar/footer';

const DAYS_MAP = { L: 'Lunes', M: 'Martes', I: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };
const SERVICES_MAP = [
  { id: 'aire', label: 'Aire acondicionado' },
  { id: 'proyector', label: 'Proyector' },
  { id: 'pantalla', label: 'Pantalla' },
  { id: 'audio', label: 'Bocinas' },
  { id: 'ventilador', label: 'Ventilador' },
  { id: 'red', label: 'Internet' },
  { id: 'computadora', label: 'Computadoras' },
  { id: 'pintarron', label: 'Pintarrón' },
  { id: 'enchufe', label: 'Enchufes' }
];

export default function Crud() {
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

  // ADMINISTRACIÓN DE SALONES
  const [showClassroomManager, setShowClassroomManager] = useState(false);
  const [activeBuildingForClassrooms, setActiveBuildingForClassrooms] = useState(null);
  const [localClassrooms, setLocalClassrooms] = useState([]);
  const [classroomManagerView, setClassroomManagerView] = useState('list');
  const [currentClassroomForm, setCurrentClassroomForm] = useState(null);
  const [originalClassroomName, setOriginalClassroomName] = useState(null);
  const [showConfirmResetAccess, setShowConfirmResetAccess] = useState(false);
  const [showConfirmDeleteClassroom, setShowConfirmDeleteClassroom] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState(null);

  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const username = decoded?.username ?? null;

  useEffect(() => {
    document.title = "TRACS - CRUD";
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      const existingKeys = Object.keys(sessionStorage).filter(key => key.startsWith("full_schedule_"));
      existingKeys.forEach(key => sessionStorage.removeItem(key));
      sessionStorage.removeItem('cached_cycles');
    };
    window.addEventListener('beforeunload', handleRefresh);
    return () => {
      window.removeEventListener('beforeunload', handleRefresh);
    };
  }, []);

  const validBuildingField = (str, { allowSpaces = true } = {}) => {
    if (typeof str !== 'string') return false;
    if (str.startsWith(' ')) return false;
    const allowedRegex = allowSpaces
      ? /^[0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,\s]+$/
      : /^[0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,]+$/;
    if (!allowedRegex.test(str)) return false;
    const trimmed = str.trim();
    if (!trimmed) return false;
    const hasLetter = /[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]/.test(trimmed);
    if (!hasLetter) return false;
    return true;
  };

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

  // Cargar usuarios al montar
  useEffect(() => {
    const excludedUser = username;
    fetch(`${API_URL}/api/users?exclude=${excludedUser}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            localStorage.clear();
            window.location.href = `/calendar`;
            return [];
          }
          if (!res.ok) throw new Error('Error al cargar usuarios');
        }
        return res.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];
        setUsers(arr);
      })
      .catch((err) => {
        console.error('Error al obtener usuarios:', err);
        setUsers([]);
      })
  }, [username]);

  // EDIFICIOS
  useEffect(() => {
    fetch(`${API_URL}/api/buildings`)
      .then(response => response.json())
      .then(data => {
        const buildings = data.edifp || [];
        const prioritized = buildings.filter(b => b.value === "DUCT1" || b.value === "DUCT2");
        const rest = buildings.filter(b => b.value !== "DUCT1" && b.value !== "DUCT2");
        const newBuildingsOrder = [...prioritized, ...rest];
        setBuildings(newBuildingsOrder);
      })
      .catch(error => console.error("Error cargando los edificios:", error));
  }, []);

  // Actualizar rol
  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? { ...user, role: newRole } : user))
        );
        toast.success(`Se ha cambiado el rol del usuario correctamente`);
      }
      else {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        else if (res.status === 500){
          toast.error(`Error al actualizar el rol.`);
        }
      }
    } catch (err) {
      console.error('Error al actualizar el rol:', err);
    }
  };

  const handleSaveEditBuilding = async () => {
    if (!buildingToEdit.value || !buildingToEdit.text) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    const cleanValue = buildingToEdit.value.trim();
    const cleanText  = buildingToEdit.text.trim();

    if (
    !validBuildingField(cleanValue, { allowSpaces: false }) ||
    !validBuildingField(cleanText, { allowSpaces: true })
    ) {
      toast.error("Nombre y seudónimo no pueden iniciar con espacio, tener caracteres no permitidos ni ser solo espacios, números o símbolos.");
      return;
    }

    const params = new URLSearchParams({
      buildingName: originalBuilding.value,
      buildingText: originalBuilding.text
    });

    const cleanedBuildingData = {
      value: cleanValue,
      text: cleanText,
    };

    try {
      const res = await fetch(`${API_URL}/api/buildings?${params.toString()}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cleanedBuildingData),
      });

      if (res.ok) {
        setBuildings((prev) =>
          prev.map((building) =>
            building.value.trim() === (originalBuilding.value ?? '').trim() &&
            building.text.trim() === (originalBuilding.text ?? '').trim()
              ? { ...building, ...cleanedBuildingData }
              : building
          )
        );

        toast.success("Edificio actualizado correctamente");
        toast.warn("Es necesario que los usuarios recarguen la página para ver los horarios del edificio en el calendario.", { 
          autoClose: 10000,
          style: {
            backgroundColor: '#e65100',
            color: '#ffffff'
          }
        });
      } else {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        toast.error("Error al actualizar el edificio");
      }
    } catch (error) {
      console.error("Error al actualizar el edificio:", error);
    } finally {
      setShowEditModalBuilding(false);
      setBuildingToEdit(null);
      setOriginalBuilding(null);
    }
  };

  const confirmDeleteBuilding = async () => {
    if (!buildingToDelete) return;
    
    const params = new URLSearchParams({
      buildingName: buildingToDelete.value.trim(),
      buildingText: buildingToDelete.text.trim()
    });

    try {
      const res = await fetch(`${API_URL}/api/buildings?${params.toString()}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        setBuildings((prevBuildings) => prevBuildings.filter((building) => building.value !== buildingToDelete.value));
        toast.success('Se eliminó correctamente.');
      } else {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        toast.error('Fallo al eliminar edificio');
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
      const res = await fetch(`${API_URL}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userToDelete.id));
        toast.success('Se ha eliminado el usuario');
      } else {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        toast.error('Fallo al eliminar usuario');
        return;
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      toast.error('Error al eliminar usuario');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleSaveBuilding = async () => {
    if (!buildingToAdd) return;

    const cleanValue = (buildingToAdd.value ?? '').trim();
    const cleanText  = (buildingToAdd.text ?? '').trim();

    if (
    !validBuildingField(buildingToAdd.value, { allowSpaces: false }) ||
    !validBuildingField(buildingToAdd.text, { allowSpaces: true })
    ) {
      toast.error("Nombre no puede contener espacios ni caracteres no permitidos. El seudónimo sí puede tener espacios.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/buildings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          value: cleanValue,
          text: cleanText,
        }),
      });
  
      const result = await res.json();
  
      if (!res.ok) {
        if (res.status === 403) {
          localStorage.clear();
          navigate("/calendar");
          return;
        }
        else if (res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        else if (res.status === 409) {
          toast.error('El edificio ya existe.');
          return;
        }
        console.error('Error desde el servidor:', result?.error || 'Error desconocido');
        toast.error('Error al agregar el edificio.');
        return;
      }

      setBuildings(prev => [...prev, { value: cleanValue, text: cleanText }]);
      toast.success("Edificio agregado correctamente");
      toast.warn("Es necesario que los usuarios recarguen la página para ver los horarios del edificio en el calendario.", { 
        autoClose: 10000,
        style: {
          backgroundColor: '#e65100',
          color: '#ffffff'
        }
      });

      setLocalClassrooms([]);
      setActiveBuildingForClassrooms({ value: cleanValue, text: cleanText });
      setClassroomManagerView('list');
      setShowClassroomManager(true);
      setShowAddModalBuilding(false);

    } catch (err) {
      console.error("Error al agregar el edificio:", err);
      toast.error('Error al agregar el edificio.');
    } finally {
      setBuildingToAdd(null);
    }
  };

  // SALONES
  const toBackendTime = (start, end) => {
    if (!start || !end) return null;
    return `${start.replace(':', '')}-${end.replace(':', '')}`;
  };

  const toUiTime = (backendStr) => {
    if (!backendStr || !backendStr.includes('-')) return { start: '', end: '' };
    const [s, e] = backendStr.split('-');
    const start = `${s.slice(0, 2)}:${s.slice(2, 4)}`;
    const end = `${e.slice(0, 2)}:${e.slice(2, 4)}`;
    return { start, end };
  };

  const handleViewClassrooms = async (building) => {
    try {
      const res = await fetch(
        `${API_URL}/api/classrooms?buildingName=${encodeURIComponent(building.value)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        toast.error('No se pudieron cargar los salones del edificio.');
        return; 
      }

      const data = await res.json();
      const classArray = Array.isArray(data) ? data : [];
      const normalized = classArray.map(c => {
        if (typeof c === 'string') {
          return { name: c, capacity: null, isAccessible: false, services: [] };
        }
        return {
          name: c.name || '',
          capacity: c.capacity || null,
          isAccessible: c.isAccessible !== undefined ? c.isAccessible : false,
          services: c.services || []
        };
      });

      setLocalClassrooms(normalized);
      setActiveBuildingForClassrooms(building);
      setClassroomManagerView('list');
      setShowClassroomManager(true);

    } catch (error) {
      toast.error('No se pudieron cargar los salones del edificio.');
    }
  };

  const handleOpenForm = (classroom = null) => {
    const emptyDays = () => ({ L: { active: false, start: '', end: '' }, M: { active: false, start: '', end: '' }, I: { active: false, start: '', end: '' }, J: { active: false, start: '', end: '' }, V: { active: false, start: '', end: '' }, S: { active: false, start: '', end: '' } });
    
    if (classroom) {
      setOriginalClassroomName(classroom.name);
      const form = {
        name: classroom.name,
        capacity: classroom.capacity ? String(classroom.capacity) : '',
        accessToggle: !!classroom.isAccessible,
        accessMode: classroom.isAccessible === true ? 'siempre' : 'dias',
        days: emptyDays(),
        services: classroom.services || []
      };

      if (classroom.isAccessible && typeof classroom.isAccessible === 'object') {
        Object.keys(classroom.isAccessible).forEach(day => {
          if (form.days[day]) {
            const hours = classroom.isAccessible[day];
            if (hours && hours.length > 0) {
              if (hours[0] === '0000-2355') {
                form.days[day] = { active: true, start: '', end: '' };
              } else {
                const { start, end } = toUiTime(hours[0]);
                form.days[day] = { active: true, start, end };
              }
            } else {
              form.days[day] = { active: true, start: '', end: '' };
            }
          }
        });
      }
      setCurrentClassroomForm(form);
    } else {
      setOriginalClassroomName(null);
      setCurrentClassroomForm({
        name: '',
        capacity: '',
        accessToggle: false,
        accessMode: 'siempre',
        days: emptyDays(),
        services: []
      });
    }
    setClassroomManagerView('form');
  };

  const handleAcceptLocalForm = () => {
    const cleanName = currentClassroomForm.name.trim();
    if (!cleanName) {
      return toast.error("El nombre del salón es obligatorio.");
    }
    
    if (localClassrooms.some(c => c.name === cleanName && c.name !== originalClassroomName)) {
      return toast.error("Ya existe un salón con ese nombre en este edificio.");
    }

    if (currentClassroomForm.accessToggle && currentClassroomForm.accessMode === 'dias') {
      let hasActiveDays = false;
      for (const day of Object.keys(currentClassroomForm.days)) {
        const d = currentClassroomForm.days[day];
        if (d.active) {
          hasActiveDays = true;
          if (!d.start || !d.end) {
            return toast.error(`Debes seleccionar hora de inicio y fin para el día ${DAYS_MAP[day]}.`);
          }
          if (d.start >= d.end) {
            return toast.error(`La hora inicial debe ser menor a la final en el día ${DAYS_MAP[day]}.`);
          }
        }
      }
      if (!hasActiveDays) {
        return toast.error("Debes seleccionar al menos un día válido.");
      }
    }

    let isAccessible = false;
    if (currentClassroomForm.accessToggle) {
      if (currentClassroomForm.accessMode === 'siempre') {
        isAccessible = true;
      } else {
        isAccessible = {};
        let hasActiveDays = false;
        Object.keys(currentClassroomForm.days).forEach(day => {
          const d = currentClassroomForm.days[day];
          if (d.active && d.start && d.end) {
            hasActiveDays = true;
            isAccessible[day] = [toBackendTime(d.start, d.end)];
          }
        });
        if (!hasActiveDays) isAccessible = false;
      }
    }

    const updatedClassroom = {
      name: cleanName,
      capacity: currentClassroomForm.capacity.trim() === '' ? null : currentClassroomForm.capacity.trim(),
      isAccessible,
      services: currentClassroomForm.services
    };

    if (originalClassroomName) {
      setLocalClassrooms(prev => prev.map(c => c.name === originalClassroomName ? updatedClassroom : c));
    } else {
      setLocalClassrooms(prev => [...prev, updatedClassroom]);
    }
    setClassroomManagerView('list');
  };

  const requestDeleteClassroom = (classroom) => {
    setClassroomToDelete(classroom);
    setShowConfirmDeleteClassroom(true);
  };

  const confirmDeleteLocalClassroom = () => {
    setLocalClassrooms(prev => prev.filter(c => c.name !== classroomToDelete.name));
    setShowConfirmDeleteClassroom(false);
    setClassroomToDelete(null);
    setClassroomManagerView('list');
  };

  const handleSaveAllClassroomsToBackend = async () => {
    try {
      const payloadClassrooms = localClassrooms.map(c => ({
        name: c.name,
        capacity: c.capacity || null,
        isAccessible: c.isAccessible,
        services: c.services
      }));

      const res = await fetch(`${API_URL}/api/classrooms?buildingName=${encodeURIComponent(activeBuildingForClassrooms.value)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ classrooms: payloadClassrooms })
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          localStorage.clear();
          window.location.href = `/calendar`;
          return;
        }
        toast.error('Error al guardar los salones.');
        return;
      }
      
      toast.success('Salones guardados correctamente.');
      setShowClassroomManager(false);
    } catch (error) {
      toast.error('Error al guardar los salones.');
    }
  };

  const executeResetAccessibility = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classrooms/resetAccessibility?buildingName=${encodeURIComponent(activeBuildingForClassrooms.value)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        setLocalClassrooms(prev => prev.map(c => ({ ...c, isAccessible: false })));
        toast.success('Accesibilidad restablecida para todos los salones.');
      } else {
        toast.error('No se pudo restablecer la accesibilidad.');
      }
    } catch (error) {
      toast.error('Error al restablecer accesibilidad.');
    } finally {
      setShowConfirmResetAccess(false);
    }
  };

  return (
    <div className="bg-gray-100 flex min-h-screen">
      <div className="main-content flex flex-col w-full">
        <div className="pt-12 p-4 ml-4 mr-4">
          <div className="bg-white p-4 rounded-lg shadow-md custom-shadow-border-reports">
            <h2 className="text-3xl font-bold mb-8 tracking-wide text-center text-purple-900">Administración</h2>
            <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />
            <div className="flex flex-col md:flex-row md:flex-wrap gap-8">
              
              {/* Tabla de Usuarios */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-center text-purple-800">USUARIOS</h3>
                <div className="flex justify-end mb-4">
                  <button onClick={() => navigate('/signup')} className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition">
                    + Registrar nuevo usuario
                  </button>
                </div>
                <div className={`max-h-96 min-h-96 ${users.length < 7 ? 'overflow-y-hidden' : 'overflow-y-auto'} rounded-lg shadow`}>
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="sticky top-0 bg-gray-200 z-1">
                      <tr className="bg-gray-200 text-purple-900">
                        <th className="py-2 px-4 text-left bg-purple-200">Usuario</th>
                        <th className="py-2 px-4 text-left bg-purple-200">Rol</th>
                        <th className="py-2 px-4 text-left bg-purple-200">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{user.username}</td>
                          <td className="py-2 px-4">
                            <select
                              value={selectedUser && selectedUser.id === user.id && pendingRole ? pendingRole : user.role}
                              onChange={(e) => handleSelectChange(user, e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 text-sm text-gray-800 bg-white"
                            >
                              <option value="user">Usuario</option>
                              <option value="superuser">Superusuario</option>
                              <option value="tecnico">Técnico</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-4">
                            <button onClick={() => handleDeleteUser(user)} className="background-eliminar text-white px-3 py-1.5 rounded transition w-28">
                              🗑️ Eliminar
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
                      {users.length < 7 &&
                        Array.from({ length: 7 - users.length }).map((_, index) => (
                          <tr key={`empty-${index}`} className="border-b invisible select-none pointer-events-none">
                            <td className="py-2 px-4">&nbsp;</td>
                            <td className="py-2 px-4">&nbsp;</td>
                            <td className="py-2 px-4"><button className="px-3 py-1 rounded">&nbsp;</button></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla de Edificios */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-center text-pink-800">EDIFICIOS</h3>
                <div className="flex justify-end mb-4">
                  <button className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition" onClick={handleAddBuilding}>
                    + Agregar nuevo edificio
                  </button>
                </div>
                <div className="max-h-96 min-h-96 overflow-y-auto rounded-lg shadow">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="sticky top-0 bg-gray-200 z-1">
                      <tr className="text-pink-900">
                        <th className="py-2 px-4 text-left bg-pink-200">Edificios</th>
                        <th className="py-2 px-4 text-left bg-pink-200">Seudónimo</th>
                        <th className="py-2 px-4 text-left bg-pink-200">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildings.map((building, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{building.value}</td>
                          <td className="py-2 px-4">{building.text}</td>
                          <td className="py-2.5 px-4 flex">
                            <button onClick={() => handleEditBuilding(building)} className="background-aplicar text-white px-3 py-1.5 rounded transition mr-2 edit-button-buildings w-28">
                              ✏️ Editar
                            </button>
                            <button onClick={() => handleViewClassrooms(building)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition mr-2 w-28">
                              🏫 Salones
                            </button>
                            <button onClick={() => handleDeleteBuilding(building)} className="background-eliminar text-white px-3 py-1.5 rounded transition delete-button-buildings w-28">
                              🗑️ Eliminar
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
        
        <div className="bg-red-200 p-4 ml-8 mr-8 mb-16 mt-6 rounded-lg shadow-md border-2 border-red-500">
          <h2 className="text-2xl font-bold mb-2 tracking-wide text-red-900">Advertencia</h2>
            <p className='text-lg'>La eliminación de usuarios y edificios no es información recuperable.<br/>
                Realizar cambios requiere de autorización previa. Si usted no es un usuario con un rol que permita estos cambios, favor de abandonar este apartado y notificarlo inmediatamente.
            </p>
        </div>
        <Footer />
      </div>

      {/* MODALES */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4">¿Confirmar cambio de rol?</h3>
            <p className="mb-6">
              ¿Estás seguro de cambiar el rol de <strong>{selectedUser?.username}</strong> a{' '}
              <strong>{pendingRole === 'superuser' ? 'Superusuario' : pendingRole === 'user' ? 'Usuario' : 'Técnico'}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={handleCancelChange} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">No</button>
              <button onClick={handleConfirmChange} className="px-4 py-2 background-aplicar text-white rounded">Sí</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4">¿Eliminar usuario?</h3>
            <p className="mb-6">¿Estás seguro de eliminar al usuario <strong>{userToDelete?.username}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelDeleteUser} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmDeleteUser} className="px-4 py-2 background-eliminar text-white rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModalBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4">¿Eliminar edificio?</h3>
            <p className="mb-6">¿Estás seguro de eliminar el edificio <strong>{buildingToDelete?.value}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelDeleteBuilding} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={confirmDeleteBuilding} className="px-4 py-2 background-eliminar text-white rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showEditModalBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4 text-center">Modificar Edificio</h3>
            <label className="block text-gray-700 font-medium mb-1" htmlFor="value">Nombre del edificio:</label>
            <input
              name="value"
              value={buildingToEdit.value}
              onChange={(e) => {
                const raw = e.target.value;
                const val = raw.replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,]/g, '');
                if (val === '' || validBuildingField(val, { allowSpaces: false })) {
                  setBuildingToEdit((prev) => ({ ...prev, value: val }));
                }
              }}
              placeholder="Nombre del Edificio"
              className="w-full mb-3 p-2 border rounded"
              maxLength={10}
            />
            <label className="block text-gray-700 font-medium mb-1" htmlFor="value">Seudónimo:</label>
            <input
              name="text"
              value={buildingToEdit.text}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || validBuildingField(val))
                  setBuildingToEdit((prev) => ({ ...prev, text: val }));
              }}
              placeholder="Seudónimo"
              className="w-full mb-3 p-2 border rounded"
              maxLength={10}
            />
            <div className="flex justify-center gap-4">
              <button onClick={cancelEditBuilding} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={handleSaveEditBuilding} className="px-4 py-2 background-aplicar text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showAddModalBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4 text-center">Agregar Edificio</h3>
            <input
              name="value"
              value={buildingToAdd?.value ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                const val = raw.replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,]/g, '');
                if (val === '' || validBuildingField(val, { allowSpaces: false })) {
                  setBuildingToAdd((prev) => ({ ...prev, value: val }));
                }
              }}
              placeholder="Nombre del edificio"
              className="w-full mb-3 p-2 border rounded"
              maxLength={10}
            />
            <input
              name="text"
              value={buildingToAdd?.text ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || validBuildingField(val))
                  setBuildingToAdd((prev) => ({ ...prev, text: val }));
              }}
              placeholder="Seudónimo"
              className="w-full mb-3 p-2 border rounded"
              maxLength={10}
            />
            <div className="flex justify-center gap-4">
              <button onClick={cancelAddBuilding} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={handleSaveBuilding} className="px-4 py-2 background-aplicar text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showClassroomManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl flex flex-col w-full max-w-4xl max-h-[90vh] custom-shadow-border-reports">
            
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-2xl font-bold text-purple-900">
                Administración de Salones - {activeBuildingForClassrooms?.value}
              </h2>
              {classroomManagerView === 'list' && (
                <button onClick={() => setShowClassroomManager(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold px-2">&times;</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              {classroomManagerView === 'list' && (
                <div>
                  <div className="flex justify-between mb-4 items-center">
                    <p className="text-gray-700 text-lg">Salones registrados: <strong>{localClassrooms.length}</strong></p>
                    <button onClick={() => handleOpenForm(null)} className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition shadow-sm font-medium">
                      + Agregar salón
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-purple-100 text-purple-900">
                        <tr>
                          <th className="py-3 px-4 text-left font-semibold">Salón</th>
                          <th className="py-3 px-4 text-left font-semibold">Capacidad</th>
                          <th className="py-3 px-4 text-left font-semibold">Accesibilidad</th>
                          <th className="py-3 px-4 text-center font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {localClassrooms.map((c) => (
                          <tr key={c.name} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{c.name}</td>
                            <td className="py-3 px-4 text-gray-600">{c.capacity || <span className="italic text-gray-400" title="No definido">N/D</span>}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {c.isAccessible === false ? 'No accesible' : c.isAccessible === true ? 'Siempre' : 'Días específicos'}
                            </td>
                            <td className="py-3 px-4 text-center flex justify-center gap-2">
                              <button onClick={() => handleOpenForm(c)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition text-sm">
                                ✏️ Editar
                              </button>
                              <button onClick={() => requestDeleteClassroom(c)} className="background-eliminar text-white px-3 py-1.5 rounded transition text-sm">
                                🗑️ Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {localClassrooms.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-gray-500">
                              No hay salones configurados. Presiona "Agregar salón" para comenzar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {classroomManagerView === 'form' && currentClassroomForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
                    {originalClassroomName ? `Editar Salón: ${originalClassroomName}` : 'Crear Nuevo Salón'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Nombre del salón <span className="text-red-500">*</span></label>
                      <input 
                        value={currentClassroomForm.name} 
                        onChange={e => setCurrentClassroomForm({...currentClassroomForm, name: e.target.value.replace(/[^a-zA-Z0-9]/g, '')})} 
                        className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none transition" 
                        maxLength={10} 
                        placeholder="Ej. LC01" 
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Capacidad (Opcional)</label>
                      <input 
                        type="number" 
                        value={currentClassroomForm.capacity} 
                        onChange={e => setCurrentClassroomForm({...currentClassroomForm, capacity: e.target.value})} 
                        className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none transition" 
                        placeholder="Ej. 40" 
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mb-8 p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">Accesibilidad</h4>
                    
                    <label className="flex items-center space-x-3 mb-5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentClassroomForm.accessToggle} 
                        onChange={e => setCurrentClassroomForm({...currentClassroomForm, accessToggle: e.target.checked})} 
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" 
                      />
                      <span className="font-medium text-lg text-gray-800 select-none">Salón accesible</span>
                    </label>
                    
                    {currentClassroomForm.accessToggle && (
                      <div className="pl-8 space-y-5 animate-fade-in">
                        <div className="flex space-x-8">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="accessMode" 
                              value="siempre" 
                              checked={currentClassroomForm.accessMode === 'siempre'} 
                              onChange={() => setCurrentClassroomForm({...currentClassroomForm, accessMode: 'siempre'})} 
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500" 
                            />
                            <span className="font-medium text-gray-700">Siempre</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="accessMode" 
                              value="dias" 
                              checked={currentClassroomForm.accessMode === 'dias'} 
                              onChange={() => setCurrentClassroomForm({...currentClassroomForm, accessMode: 'dias'})} 
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500" 
                            />
                            <span className="font-medium text-gray-700">Días específicos</span>
                          </label>
                        </div>
                        
                        {currentClassroomForm.accessMode === 'dias' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            {['L', 'M', 'I', 'J', 'V', 'S'].map(day => (
                              <div key={day} className={`flex items-center justify-between p-3 border rounded-md transition ${currentClassroomForm.days[day].active ? 'bg-white border-purple-300 shadow-sm' : 'bg-transparent border-gray-300 opacity-70'}`}>
                                <label className="flex items-center space-x-3 font-medium w-32 cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={currentClassroomForm.days[day].active} 
                                    onChange={e => setCurrentClassroomForm({
                                      ...currentClassroomForm, 
                                      days: { ...currentClassroomForm.days, [day]: { ...currentClassroomForm.days[day], active: e.target.checked } }
                                    })} 
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" 
                                  />
                                  <span>{DAYS_MAP[day]}</span>
                                </label>
                                <div className="flex items-center space-x-2">
                                  <select
                                    disabled={!currentClassroomForm.days[day].active}
                                    value={currentClassroomForm.days[day].start || ''}
                                    onChange={e => setCurrentClassroomForm({
                                      ...currentClassroomForm, 
                                      days: { ...currentClassroomForm.days, [day]: { ...currentClassroomForm.days[day], start: e.target.value } }
                                    })}
                                    className={`border p-1.5 rounded-md text-sm w-24 text-center outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                      currentClassroomForm.days[day].active 
                                        ? 'border-gray-300 bg-white shadow-sm cursor-pointer text-gray-700 font-medium' 
                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <option value="" disabled>--:--</option>
                                    {Array.from({ length: 14 }, (_, i) => {
                                      const h = (i + 7).toString().padStart(2, '0');
                                      return <option key={`${h}:00`} value={`${h}:00`}>{h}:00</option>;
                                    })}
                                  </select>
                                  
                                  <span className="text-purple-400 font-bold mx-1">-</span>
                                  
                                  <select
                                    disabled={!currentClassroomForm.days[day].active}
                                    value={currentClassroomForm.days[day].end || ''}
                                    onChange={e => setCurrentClassroomForm({
                                      ...currentClassroomForm, 
                                      days: { ...currentClassroomForm.days, [day]: { ...currentClassroomForm.days[day], end: e.target.value } }
                                    })}
                                    className={`border p-1.5 rounded-md text-sm w-24 text-center outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                      currentClassroomForm.days[day].active 
                                        ? 'border-gray-300 bg-white shadow-sm cursor-pointer text-gray-700 font-medium' 
                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <option value="" disabled>--:--</option>
                                    {Array.from({ length: 14 }, (_, i) => {
                                      const h = (i + 7).toString().padStart(2, '0');
                                      return <option key={`${h}:55`} value={`${h}:55`}>{h}:55</option>;
                                    })}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
                      <h4 className="font-bold text-gray-800">Servicios y equipamiento</h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentClassroomForm.services.length > 4) {
                            setCurrentClassroomForm({ ...currentClassroomForm, services: [] });
                          } else {
                            setCurrentClassroomForm({ 
                              ...currentClassroomForm, 
                              services: SERVICES_MAP.map(srv => srv.id) 
                            });
                          }
                        }}
                        className="text-sm font-bold text-purple-600 hover:text-purple-800 transition px-2 py-1 rounded hover:bg-purple-100"
                      >
                        {currentClassroomForm.services.length > 4 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {SERVICES_MAP.map(srv => (
                        <label key={srv.id} className="flex items-center space-x-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={currentClassroomForm.services.includes(srv.id)} 
                            onChange={e => {
                              const newServices = e.target.checked 
                                ? [...currentClassroomForm.services, srv.id] 
                                : currentClassroomForm.services.filter(id => id !== srv.id);
                              setCurrentClassroomForm({ ...currentClassroomForm, services: newServices });
                            }} 
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="text-gray-700">{srv.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 bg-white rounded-b-lg flex flex-col md:flex-row justify-between items-center gap-4">
              
              {classroomManagerView === 'list' && (
                <>
                  <button onClick={() => setShowConfirmResetAccess(true)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition w-full md:w-auto font-medium">
                    Restablecer accesibilidad
                  </button>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowClassroomManager(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition w-full md:w-auto font-medium">
                      Cancelar
                    </button>
                    <button onClick={handleSaveAllClassroomsToBackend} className="px-6 py-2 background-aplicar text-white rounded shadow-sm w-full md:w-auto font-medium">
                      Guardar
                    </button>
                  </div>
                </>
              )}

              {classroomManagerView === 'form' && (
                <>
                  <div className="flex w-full justify-between items-center">
                    {originalClassroomName ? (
                      <button onClick={() => requestDeleteClassroom(currentClassroomForm)} className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded transition">
                        Eliminar salón
                      </button>
                    ) : (
                      <div className="w-1"></div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => setClassroomManagerView('list')} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition font-medium">
                        Cancelar
                      </button>
                      <button onClick={handleAcceptLocalForm} className="px-6 py-2 background-aplicar text-white rounded shadow-sm font-medium">
                        {originalClassroomName ? 'Agregar cambios' : 'Agregar salón'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4 text-gray-800">¿Eliminar este salón?</h3>
            <p className="mb-2 text-xl text-purple-700 font-semibold">{classroomToDelete?.name}</p>
            <p className="mb-6 text-gray-600">Esta acción eliminará el salón de la configuración del edificio al guardar los cambios.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmDeleteClassroom(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium">
                Cancelar
              </button>
              <button onClick={confirmDeleteLocalClassroom} className="px-4 py-2 background-eliminar text-white rounded font-medium">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmResetAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 custom-shadow-border-reports">
            <h3 className="text-lg font-bold mb-4 text-gray-800">¿Restablecer la accesibilidad de todos los salones?</h3>
            <p className="mb-6 text-gray-600">Esta acción quitará la configuración de accesibilidad de todos los salones de este edificio de manera inmediata.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmResetAccess(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium">
                Cancelar
              </button>
              <button onClick={executeResetAccessibility} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium">
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}