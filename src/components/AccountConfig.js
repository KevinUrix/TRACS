// src/components/AccountConfig.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import '../components/interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS
import NavbarGlobal from './NavbarGlobal';

export default function AccountConfig() {
    const [userInfo, setUserInfo] = useState({ username: '', role: '' });
    const [newUsername, setNewUsername] = useState('');
    const [usernameMessage, setUsernameMessage] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const navigate = useNavigate();

   useEffect(() => {
       const userRole = localStorage.getItem('role');
   
       if (userRole !== 'superuser' && userRole !== 'user' && userRole !== 'tecnico') {
         navigate('/');
       }
     }, [navigate]);

    // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get('/api/info', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUserInfo(res.data);
        setNewUsername(res.data.username);
      } catch (err) {
        console.error(err);
        console.log(localStorage.getItem('token'));

      }
    };

    fetchUserInfo();
  }, []);

  // Cambiar nombre de usuario
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameMessage('');
    try {
      const res = await axios.put(
        '/api/account/username',
        { newUsername },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setUsernameMessage(res.data.message);
      setUserInfo((prev) => ({ ...prev, username: newUsername }));
    } catch (err) {
      if (err.response) {
        setUsernameMessage(err.response.data.message);
      } else {
        setUsernameMessage('Error al actualizar nombre de usuario');
      }
    }
  };

  // Cambiar contraseña
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    try {
      const res = await axios.put(
        '/api/account/password',
        { currentPassword, newPassword, confirmPassword },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setPasswordMessage(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.response) {
        setPasswordMessage(err.response.data.message);
      } else {
        setPasswordMessage('Error al cambiar contraseña');
      }
    }
  };


  return (
    <div className="bg-gray-100 flex min-h-screen">
        <div className="main-content flex-2 flex flex-col">
            {/*<NavbarGlobal/>*/}
            <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Configuración de Cuenta</h2>

                {/* Mostrar rol y usuario actual */}
                <div className="mb-6">
                    <p><strong>Nombre de usuario actual:</strong> {userInfo.username}</p>
                    <p><strong>Rol:</strong> {userInfo.role}</p>
                </div>

                {/* Cambiar nombre de usuario */}
                <form onSubmit={handleUsernameChange} className="mb-6">
                    <h3 className="font-semibold mb-2">Cambiar nombre de usuario</h3>
                    <input
                    type="text"
                    className="w-full p-2 border rounded mb-2"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                    Guardar nuevo nombre
                    </button>
                    {usernameMessage && (
                    <p className="mt-2 text-sm text-gray-700">{usernameMessage}</p>
                    )}
                </form>

                {/* Cambiar contraseña */}
                <form onSubmit={handlePasswordChange}>
                    <h3 className="font-semibold mb-2">Cambiar contraseña</h3>
                    <input
                    type="password"
                    placeholder="Contraseña actual"
                    className="w-full p-2 border rounded mb-2"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    />
                    <input
                    type="password"
                    placeholder="Nueva contraseña"
                    className="w-full p-2 border rounded mb-2"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    />
                    <input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    className="w-full p-2 border rounded mb-2"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    />
                    <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                    Cambiar contraseña
                    </button>
                    {passwordMessage && (
                    <p className="mt-2 text-sm text-gray-700">{passwordMessage}</p>
                    )}
                </form>
            </div>
        </div>
    </div>
  );
}
