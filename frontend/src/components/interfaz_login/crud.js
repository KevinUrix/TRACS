import { getDecodedToken } from '../../utils/auth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../../config/api';
import './crud.css';
import Footer from '../interfaz_calendar/footer';

/* ---------- CONSTANTES Y UTILIDADES ---------- */
const DAYS_MAP = { L: 'Lunes', M: 'Martes', I: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };
const SERVICES_MAP = [
  { id: 'aire', label: 'Aire acondicionado' }, { id: 'proyector', label: 'Proyector' },
  { id: 'pantalla', label: 'Pantalla' }, { id: 'audio', label: 'Bocinas' },
  { id: 'ventilador', label: 'Ventilador' }, { id: 'red', label: 'Internet' },
  { id: 'computadora', label: 'Computadoras' }, { id: 'pintarron', label: 'Pintarrón' },
  { id: 'enchufe', label: 'Enchufes' }
];

const validBuildingField = (str, { allowSpaces = true } = {}) => {
  if (typeof str !== 'string' || str.startsWith(' ')) return false;
  const allowedRegex = allowSpaces ? /^[0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,\s]+$/ : /^[0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,]+$/;
  if (!allowedRegex.test(str)) return false;
  const trimmed = str.trim();
  return trimmed && /[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]/.test(trimmed);
};

const toBackendTime = (start, end) => (start && end) ? `${start.replace(':', '')}-${end.replace(':', '')}` : null;
const toUiTime = (backendStr) => {
  if (!backendStr || !backendStr.includes('-')) return { start: '', end: '' };
  const [s, e] = backendStr.split('-');
  return { start: `${s.slice(0, 2)}:${s.slice(2, 4)}`, end: `${e.slice(0, 2)}:${e.slice(2, 4)}` };
};

const handleAuthError = (res, navigate) => {
  if (res.status === 403 || res.status === 401) {
    localStorage.clear();
    if (res.status === 403) navigate("/calendar");
    else window.location.href = `/calendar`;
    return true;
  }
  return false;
};

/* ---------- COMPONENTES REUTILIZABLES ---------- */
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Eliminar", confirmClass = "background-eliminar" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="mb-6 text-gray-700">{message}</div>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded font-medium ${confirmClass}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

const BuildingFormModal = ({ isOpen, title, initialData, onSave, onCancel }) => {
  const [data, setData] = useState({ value: '', text: '' });
  
  useEffect(() => {
    if (isOpen) setData(initialData || { value: '', text: '' });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value: raw } = e.target;
    let val = name === 'value' ? raw.replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÜüÑñ_.\-,]/g, '') : raw;
    if (val === '' || validBuildingField(val, { allowSpaces: name === 'text' })) {
      setData(prev => ({ ...prev, [name]: val }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 custom-shadow-border-reports">
        <h3 className="text-lg font-bold mb-4 text-center">{title}</h3>
        <label className="block text-gray-700 font-medium mb-1">Nombre del edificio:</label>
        <input name="value" value={data.value} onChange={handleChange} placeholder="Nombre del Edificio" className="w-full mb-3 p-2 border rounded" maxLength={10} />
        <label className="block text-gray-700 font-medium mb-1">Seudónimo:</label>
        <input name="text" value={data.text} onChange={handleChange} placeholder="Seudónimo" className="w-full mb-3 p-2 border rounded" maxLength={10} />
        <div className="flex justify-center gap-4 mt-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancelar</button>
          <button onClick={() => onSave(data)} className="px-4 py-2 background-aplicar text-white rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
};

/* ---------- ADMINISTRACIÓN DE SALONES ---------- */
const ClassroomManager = ({ building, onClose, navigate }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(null);
  const [originalName, setOriginalName] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (building) {
      setView('list');
      setForm(null);
      setOriginalName(null);
      setDeleteTarget(null);
      setShowResetConfirm(false);
      setClassrooms([]);
      loadClassrooms();
    }
  }, [building]);

  const loadClassrooms = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classrooms?buildingName=${encodeURIComponent(building.value)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        if (handleAuthError(res, navigate)) return;
        throw new Error();
      }
      const data = await res.json();
      setClassrooms((Array.isArray(data) ? data : []).map(c => typeof c === 'string' 
        ? { name: c, capacity: null, isAccessible: false, services: [], floor: '' } 
        : { name: c.name || '', capacity: c.capacity || null, isAccessible: c.isAccessible ?? false, services: c.services || [], floor: c.floor || '' }
      ));
    } catch {
      toast.error('No se pudieron cargar los salones del edificio.');
      handleClose();
    }
  };

  const openForm = (c = null) => {
    setOriginalName(c ? c.name : null);
    
    const emptyDays = () => ({ 
      L: { active: false, intervals: [{ start: '', end: '' }] }, 
      M: { active: false, intervals: [{ start: '', end: '' }] }, 
      I: { active: false, intervals: [{ start: '', end: '' }] }, 
      J: { active: false, intervals: [{ start: '', end: '' }] }, 
      V: { active: false, intervals: [{ start: '', end: '' }] }, 
      S: { active: false, intervals: [{ start: '', end: '' }] } 
    });
    
    let defaultForm = { name: '', capacity: '', accessToggle: false, accessMode: 'dias', days: emptyDays(), services: [], floor: '' };
    
    if (c) {
      defaultForm = { ...defaultForm, name: c.name, capacity: c.capacity ? String(c.capacity) : '', accessToggle: !!c.isAccessible, accessMode: c.isAccessible === true ? 'siempre' : 'dias', services: c.services || [], floor: c.floor || '' };
      if (c.isAccessible && typeof c.isAccessible === 'object') {
        Object.keys(c.isAccessible).forEach(day => {
          if (defaultForm.days[day]) {
            const hours = c.isAccessible[day];
            if (hours && hours.length > 0) {
              defaultForm.days[day].active = true;
              defaultForm.days[day].intervals = hours.map(h => {
                return h === '0000-2355' ? { start: '', end: '' } : toUiTime(h);
              });
            }
          }
        });
      }
    }
    setForm(defaultForm);
    setView('form');
  };

  const saveLocalForm = () => {
    const cleanName = form.name.trim();
    if (!cleanName) return toast.error("El nombre del salón es obligatorio.");
    if (classrooms.some(c => c.name === cleanName && c.name !== originalName)) return toast.error("Ya existe un salón con ese nombre en este edificio.");
    
    const validFloors = ['', 'PB', '1', '2', '3'];
    if (!validFloors.includes(form.floor)) return toast.error("El piso seleccionado no es válido o ha sido alterado.");

    let isAccessible = false;
    if (form.accessToggle) {
      if (form.accessMode === 'siempre') isAccessible = true;
      else {
        isAccessible = {};
        let hasActiveDays = false;
        
        for (const [day, d] of Object.entries(form.days)) {
          if (d.active) {
            const validIntervals = [];
            
            for (let i = 0; i < d.intervals.length; i++) {
              const interval = d.intervals[i];
              if (!interval.start || !interval.end) return toast.error(`Debes seleccionar hora de inicio y fin para el día ${DAYS_MAP[day]}.`);
              if (interval.start >= interval.end) return toast.error(`La hora inicial debe ser menor a la final en el día ${DAYS_MAP[day]}.`);
            }

            for (let i = 0; i < d.intervals.length; i++) {
              for (let j = i + 1; j < d.intervals.length; j++) {
                const intA = d.intervals[i];
                const intB = d.intervals[j];
                
                if (intA.start < intB.end && intB.start < intA.end) {
                  return toast.error(`Los horarios seleccionados para el día ${DAYS_MAP[day]} se sobreponen.`);
                }
              }
              validIntervals.push(toBackendTime(d.intervals[i].start, d.intervals[i].end));
            }

            if (validIntervals.length > 0) {
              hasActiveDays = true;
              isAccessible[day] = validIntervals;
            }
          }
        }
        if (!hasActiveDays) return toast.error("Debes seleccionar al menos un día válido.");
      }
    }

    const updated = { name: cleanName, capacity: form.capacity.trim() || null, isAccessible, services: form.services, floor: form.floor };
    setClassrooms(prev => originalName ? prev.map(c => c.name === originalName ? updated : c) : [...prev, updated]);
    setView('list');
  };

  const saveAllToBackend = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classrooms?buildingName=${encodeURIComponent(building.value)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ classrooms })
      });
      if (!res.ok) {
        if (handleAuthError(res, navigate)) return;
        throw new Error();
      }
      toast.success('Salones guardados correctamente.');
      handleClose();
    } catch {
      toast.error('Error al guardar los salones.');
    }
  };

  const executeResetAccess = async () => {
    try {
      const res = await fetch(`${API_URL}/api/classrooms/resetAccessibility?buildingName=${encodeURIComponent(building.value)}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      setClassrooms(prev => prev.map(c => ({ ...c, isAccessible: false })));
      toast.success('Accesibilidad restablecida.');
    } catch {
      toast.error('Error al restablecer accesibilidad.');
    } finally {
      setShowResetConfirm(false);
    }
  };

  if (!building) return null;

  const handleClose = () => {
    setView('list');
    setForm(null);
    setOriginalName(null);
    setClassrooms([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl flex flex-col w-full max-w-4xl max-h-[90vh] custom-shadow-border-reports">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-2xl font-bold text-purple-900">Administración de Salones - {building.value}</h2>
          {view === 'list' && <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold px-2">&times;</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {view === 'list' ? (
            <div>
              <div className="flex justify-between mb-4 items-center">
                <p className="text-gray-700 text-lg">Salones: <strong>{classrooms.length}</strong></p>
                <button onClick={() => openForm()} className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 font-medium">+ Agregar salón</button>
              </div>
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-purple-100 text-purple-900">
                    <tr><th className="py-3 px-4 text-left">Salón</th><th className="py-3 px-4 text-left">Capacidad</th><th className="py-3 px-4 text-left">Accesibilidad</th><th className="py-3 px-4 text-center">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classrooms.map(c => (
                      <tr key={c.name} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{c.name}</td>
                        <td className="py-3 px-4 text-gray-600">{c.capacity || <span className="italic text-gray-400">N/D</span>}</td>
                        <td className="py-3 px-4 text-gray-600">{c.isAccessible === false ? 'No accesible' : c.isAccessible === true ? 'Siempre' : 'Días específicos'}</td>
                        <td className="py-3 px-4 text-center flex justify-center gap-2">
                          <button onClick={() => openForm(c)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm">✏️ Editar</button>
                          <button onClick={() => setDeleteTarget(c)} className="background-eliminar text-white px-3 py-1.5 rounded text-sm">🗑️ Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {classrooms.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500">No hay salones configurados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">{originalName ? `Editar Salón: ${originalName}` : 'Crear Nuevo Salón'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nombre del salón <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value.replace(/[^a-zA-Z0-9]/g, '')})} className="w-full p-2.5 border rounded" maxLength={10} />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Capacidad (Opcional)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full p-2.5 border rounded" min="1" />
                </div>
              </div>

              {/* Accesibilidad */}
              <div className="mb-8 p-5 border rounded-lg bg-gray-50">
                <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Accesibilidad</h4>
                <label className="flex items-center space-x-3 mb-5 cursor-pointer">
                  <input type="checkbox" checked={form.accessToggle} onChange={e => setForm({...form, accessToggle: e.target.checked})} className="w-5 h-5 text-purple-600 rounded" />
                  <span className="font-medium text-lg text-gray-800 select-none">Salón accesible</span>
                </label>
                {form.accessToggle && (
                  <div className="pl-8 space-y-5">
                    <div className="flex space-x-8">
                      {['siempre', 'dias'].map(mode => (
                        <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="accessMode" checked={form.accessMode === mode} onChange={() => setForm({...form, accessMode: mode})} className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-700">{mode === 'siempre' ? 'Siempre' : 'Días específicos'}</span>
                        </label>
                      ))}
                    </div>
                    {form.accessMode === 'dias' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        {['L', 'M', 'I', 'J', 'V', 'S'].map(day => (
                          <div key={day} className={`flex flex-col p-3 border rounded-md transition ${form.days[day].active ? 'bg-white border-purple-300' : 'bg-transparent border-gray-300 opacity-70'}`}>
                            
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center space-x-3 font-medium w-32 cursor-pointer select-none">
                                <input type="checkbox" checked={form.days[day].active} onChange={e => setForm({...form, days: {...form.days, [day]: {...form.days[day], active: e.target.checked}}})} className="w-4 h-4 text-purple-600 rounded" />
                                <span>{DAYS_MAP[day]}</span>
                              </label>
                              {form.days[day].active && (
                                <button type="button" onClick={() => setForm({...form, days: {...form.days, [day]: {...form.days[day], intervals: [...form.days[day].intervals, { start: '', end: '' }]}}})} className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-100 px-2 py-1 rounded">
                                  + Agregar hora
                                </button>
                              )}
                            </div>

                            {/* Intervalos */}
                            {form.days[day].intervals.map((interval, idx) => (
                              <div key={idx} className="flex items-center justify-between space-x-2 mt-2">
                                <div className="flex items-center space-x-2">
                                  <select disabled={!form.days[day].active} value={interval.start} onChange={e => {
                                    const newInt = [...form.days[day].intervals]; newInt[idx].start = e.target.value;
                                    setForm({...form, days: {...form.days, [day]: {...form.days[day], intervals: newInt}}});
                                  }} className="border p-1.5 rounded-md text-sm w-24 text-center">
                                    <option value="" disabled>--:--</option>
                                    {Array.from({ length: 14 }, (_, i) => { const h = (i+7).toString().padStart(2,'0'); return <option key={`${h}:00`} value={`${h}:00`}>{h}:00</option>; })}
                                  </select>
                                  <span className="text-purple-400 font-bold mx-1">-</span>
                                  <select disabled={!form.days[day].active} value={interval.end} onChange={e => {
                                    const newInt = [...form.days[day].intervals]; newInt[idx].end = e.target.value;
                                    setForm({...form, days: {...form.days, [day]: {...form.days[day], intervals: newInt}}});
                                  }} className="border p-1.5 rounded-md text-sm w-24 text-center">
                                    <option value="" disabled>--:--</option>
                                    {Array.from({ length: 14 }, (_, i) => { const h = (i+7).toString().padStart(2,'0'); return <option key={`${h}:55`} value={`${h}:55`}>{h}:55</option>; })}
                                  </select>
                                </div>
                                {form.days[day].intervals.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const newInt = form.days[day].intervals.filter((_, i) => i !== idx);
                                    setForm({...form, days: {...form.days, [day]: {...form.days[day], intervals: newInt}}});
                                  }} className="text-red-500 hover:text-red-700 font-bold px-2" title="Eliminar horario">×</button>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Servicios */}
              <div className="p-5 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h4 className="font-bold text-gray-800">Servicios y equipamiento</h4>
                  <button type="button" onClick={() => setForm({...form, services: form.services.length > 4 ? [] : SERVICES_MAP.map(s => s.id)})} className="text-sm font-bold text-purple-600 hover:text-purple-800">
                    {form.services.length > 4 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
                <div className="mb-5 pb-5 border-b border-gray-200">
                  <label className="block text-gray-700 font-medium mb-1">Piso</label>
                  <select value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} className="w-full md:w-1/2 p-2 border rounded bg-white">
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="PB">PB</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SERVICES_MAP.map(srv => (
                    <label key={srv.id} className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={form.services.includes(srv.id)} onChange={e => setForm({...form, services: e.target.checked ? [...form.services, srv.id] : form.services.filter(id => id !== srv.id)})} className="w-4 h-4 text-purple-600 rounded" />
                      <span className="text-gray-700">{srv.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-white rounded-b-lg flex flex-col md:flex-row justify-between items-center gap-4">
          {view === 'list' ? (
            <>
              <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium">Restablecer accesibilidad</button>
              <div className="flex gap-3">
                <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800  rounded hover:bg-gray-400 font-medium">Cancelar</button>
                <button onClick={saveAllToBackend} className="px-6 py-2 background-aplicar text-white rounded font-medium">Guardar</button>
              </div>
            </>
          ) : (
            <div className="flex w-full justify-between items-center">
              {originalName ? <button onClick={() => setDeleteTarget(form)} className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded">Eliminar salón</button> : <div />}
              <div className="flex gap-3">
                <button onClick={() => { setView('list'); setForm(null); setOriginalName(null); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium">Cancelar</button>
                <button onClick={saveLocalForm} className="px-6 py-2 background-aplicar text-white rounded font-medium">{originalName ? 'Agregar cambios' : 'Agregar salón'}</button>
              </div>
            </div>
          )}
        </div>

        <ConfirmModal isOpen={!!deleteTarget} title="¿Eliminar este salón?" 
          message={<>Esta acción eliminará el salón <strong>{deleteTarget?.name}</strong> de la configuración al guardar.</>} 
          onConfirm={() => { setClassrooms(prev => prev.filter(c => c.name !== deleteTarget.name)); setDeleteTarget(null); setView('list'); }} 
          onCancel={() => setDeleteTarget(null)} />
          
        <ConfirmModal isOpen={showResetConfirm} title="¿Restablecer accesibilidad?" 
          message="Quitará la configuración de accesibilidad de todos los salones inmediatamente." 
          confirmText="Restablecer" confirmClass="bg-gray-600 hover:bg-gray-700" 
          onConfirm={executeResetAccess} onCancel={() => setShowResetConfirm(false)} />
      </div>
    </div>
  );
};

/* ---------- COMPONENTE PRINCIPAL ---------- */
export default function Crud() {
  const navigate = useNavigate();
  const username = getDecodedToken()?.username ?? null;

  // Estados Globales
  const [users, setUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // Estados UI - Modales
  const [roleModal, setRoleModal] = useState({ show: false, user: null, role: '' });
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteBuilding, setDeleteBuilding] = useState(null);
  const [editBuilding, setEditBuilding] = useState(null);
  const [addBuildingModal, setAddBuildingModal] = useState(false);
  const [activeBuildingForClassrooms, setActiveBuildingForClassrooms] = useState(null);

  useEffect(() => {
    document.title = "TRACS - CRUD";
    const handleRefresh = () => {
      Object.keys(sessionStorage).filter(key => key.startsWith("full_schedule_")).forEach(key => sessionStorage.removeItem(key));
      sessionStorage.removeItem('cached_cycles');
    };
    window.addEventListener('beforeunload', handleRefresh);
    return () => window.removeEventListener('beforeunload', handleRefresh);
  }, []);

  // Carga inicial
  useEffect(() => {
    fetch(`${API_URL}/api/users?exclude=${username}`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }})
      .then(res => {
        if (!res.ok) { handleAuthError(res, navigate); throw new Error('Error usuarios'); }
        return res.json();
      })
      .then(data => setUsers(Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : []))
      .catch(console.error);

    fetch(`${API_URL}/api/buildings`)
      .then(res => res.json())
      .then(data => {
        const b = data.edifp || [];
        setBuildings([...b.filter(x => x.value === "DUCT1" || x.value === "DUCT2"), ...b.filter(x => x.value !== "DUCT1" && x.value !== "DUCT2")]);
      })
      .catch(console.error);
  }, [username, navigate]);

  // Acciones de Usuario
  const confirmRoleChange = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${roleModal.user.id}/role`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ role: roleModal.role }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => (u.id === roleModal.user.id ? { ...u, role: roleModal.role } : u)));
        toast.success(`Rol de usuario actualizado`);
      } else if (!handleAuthError(res, navigate)) toast.error(`Error al actualizar rol.`);
    } catch (err) { console.error(err); }
    finally { setRoleModal({ show: false, user: null, role: '' }); }
  };

  const confirmDeleteUserAction = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${deleteUser.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
        toast.success('Usuario eliminado');
      } else if (!handleAuthError(res, navigate)) toast.error('Fallo al eliminar usuario');
    } catch (err) { toast.error('Error al eliminar usuario'); } 
    finally { setDeleteUser(null); }
  };

  // Acciones de Edificio
  const saveBuilding = async (data) => {
    if (!data.value || !data.text) return toast.error("Todos los campos son obligatorios");
    if (!validBuildingField(data.value, { allowSpaces: false }) || !validBuildingField(data.text)) return toast.error("Formato inválido.");

    const isEdit = !!editBuilding;
    const url = isEdit ? `${API_URL}/api/buildings?buildingName=${editBuilding.value}&buildingText=${editBuilding.text}` : `${API_URL}/api/buildings`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ value: data.value.trim(), text: data.text.trim() }),
      });

      if (res.ok) {
        if (isEdit) {
          setBuildings(prev => prev.map(b => b.value === editBuilding.value ? { ...b, ...data } : b));
          setEditBuilding(null);
        } else {
          setBuildings(prev => [...prev, { value: data.value.trim(), text: data.text.trim() }]);
          setAddBuildingModal(false);
          setActiveBuildingForClassrooms({ value: data.value.trim(), text: data.text.trim() });
        }
        toast.success(`Edificio ${isEdit ? 'actualizado' : 'agregado'} correctamente`);
        toast.warn("Es necesario que los usuarios recarguen la página para ver los horarios del edificio en el calendario.", { autoClose: 10000, style: { backgroundColor: '#e65100', color: '#ffffff' } });
      } else {
        if (handleAuthError(res, navigate)) return;
        if (res.status === 409) return toast.error('El edificio ya existe.');
        toast.error(`Error al ${isEdit ? 'actualizar' : 'agregar'} edificio.`);
      }
    } catch (error) { console.error(error); }
  };

  const confirmDeleteBuildingAction = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buildings?buildingName=${deleteBuilding.value}&buildingText=${deleteBuilding.text}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        if (activeBuildingForClassrooms?.value === deleteBuilding.value) {
            setActiveBuildingForClassrooms(null);
        }
        setBuildings(prev => prev.filter(b => b.value !== deleteBuilding.value));
        toast.success('Edificio eliminado.');
      } else if (!handleAuthError(res, navigate)) toast.error('Fallo al eliminar edificio');
    } catch (err) { alert("Error al eliminar el edificio."); } 
    finally { setDeleteBuilding(null); }
  };

  return (
    <div className="bg-gray-100 flex min-h-screen">
      <div className="main-content flex flex-col w-full">
        <div className="pt-12 p-4 ml-4 mr-4">
          <div className="bg-white p-4 rounded-lg shadow-md custom-shadow-border-reports">
            <h2 className="text-3xl font-bold mb-8 tracking-wide text-center text-purple-900">Administración</h2>
            <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />
            
            <div className="flex flex-col md:flex-row md:flex-wrap gap-8">
              {/* USUARIOS */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-center text-purple-800">USUARIOS</h3>
                <div className="flex justify-end mb-4">
                  <button onClick={() => navigate('/signup')} className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition">+ Registrar nuevo usuario</button>
                </div>
                <div className={`max-h-96 min-h-96 ${users.length < 7 ? 'overflow-y-hidden' : 'overflow-y-auto'} rounded-lg shadow`}>
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="sticky top-0 bg-gray-200 z-1">
                      <tr className="bg-gray-200 text-purple-900"><th className="py-2 px-4 text-left bg-purple-200">Usuario</th><th className="py-2 px-4 text-left bg-purple-200">Rol</th><th className="py-2 px-4 text-left bg-purple-200">Acciones</th></tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {users.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{user.username}</td>
                          <td className="py-2 px-4">
                            <select value={(roleModal.show && roleModal.user?.id === user.id) ? roleModal.role : user.role} onChange={e => setRoleModal({ show: true, user, role: e.target.value })} className="px-3 py-1.5 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-600 text-sm bg-white">
                              <option value="user">Usuario</option><option value="superuser">Superusuario</option><option value="tecnico">Técnico</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-4"><button onClick={() => setDeleteUser(user)} className="background-eliminar text-white px-3 py-1.5 rounded transition w-28">🗑️ Eliminar</button></td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-gray-500">No hay usuarios registrados</td></tr>}
                      {Array.from({ length: Math.max(0, 7 - users.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b invisible select-none"><td className="py-2 px-4">&nbsp;</td><td className="py-2 px-4">&nbsp;</td><td className="py-2 px-4">&nbsp;</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EDIFICIOS */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-center text-pink-800">EDIFICIOS</h3>
                <div className="flex justify-end mb-4">
                  <button className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition" onClick={() => setAddBuildingModal(true)}>+ Agregar nuevo edificio</button>
                </div>
                <div className="max-h-96 min-h-96 overflow-y-auto rounded-lg shadow">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="sticky top-0 bg-gray-200 z-1">
                      <tr className="text-pink-900"><th className="py-2 px-4 text-left bg-pink-200">Edificios</th><th className="py-2 px-4 text-left bg-pink-200">Seudónimo</th><th className="py-2 px-4 text-left bg-pink-200">Acciones</th></tr>
                    </thead>
                    <tbody>
                      {buildings.map(b => (
                        <tr key={b.value} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{b.value}</td><td className="py-2 px-4">{b.text}</td>
                          <td className="py-2.5 px-4 flex">
                            <button onClick={() => setEditBuilding(b)} className="background-aplicar text-white px-3 py-1.5 rounded transition mr-2 w-28">✏️ Editar</button>
                            <button onClick={() => setActiveBuildingForClassrooms(b)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition mr-2 w-28">🏫 Salones</button>
                            <button onClick={() => setDeleteBuilding(b)} className="background-eliminar text-white px-3 py-1.5 rounded transition w-28">🗑️ Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {buildings.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-gray-500">No hay edificios registrados</td></tr>}
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
              Realizar cambios requiere de autorización previa. Si usted no es un usuario con un rol que permita estos cambios, favor de abandonar este apartado y notificarlo inmediatamente.</p>
        </div>
        <Footer />
      </div>

      {/* RENDERIZADO DE MODALES */}
      <ConfirmModal isOpen={roleModal.show} title="¿Confirmar cambio de rol?" confirmText="Sí" confirmClass="background-aplicar"
        message={<>¿Estás seguro de cambiar el rol de <strong>{roleModal.user?.username}</strong> a <strong>{roleModal.role === 'superuser' ? 'Superusuario' : roleModal.role === 'user' ? 'Usuario' : 'Técnico'}</strong>?</>}
        onConfirm={confirmRoleChange} onCancel={() => setRoleModal({ show: false, user: null, role: '' })} />

      <ConfirmModal isOpen={!!deleteUser} title="¿Eliminar usuario?" 
        message={<>¿Estás seguro de eliminar al usuario <strong>{deleteUser?.username}</strong>? Esta acción no se puede deshacer.</>}
        onConfirm={confirmDeleteUserAction} onCancel={() => setDeleteUser(null)} />

      <ConfirmModal isOpen={!!deleteBuilding} title="¿Eliminar edificio?" 
        message={<>¿Estás seguro de eliminar el edificio <strong>{deleteBuilding?.value}</strong>? Esta acción no se puede deshacer.</>}
        onConfirm={confirmDeleteBuildingAction} onCancel={() => setDeleteBuilding(null)} />

      <BuildingFormModal isOpen={!!editBuilding} title="Modificar Edificio" initialData={editBuilding} onSave={saveBuilding} onCancel={() => setEditBuilding(null)} />
      <BuildingFormModal isOpen={addBuildingModal} title="Agregar Edificio" onSave={saveBuilding} onCancel={() => setAddBuildingModal(false)} />

      {/* SALONES */}
      <ClassroomManager 
        building={activeBuildingForClassrooms} 
        onClose={() => setActiveBuildingForClassrooms(null)} 
        navigate={navigate} 
      />
    </div>
  );
}