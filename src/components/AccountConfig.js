// src/components/AccountConfig.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import axios from 'axios';
import '../components/interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS

export default function AccountConfig() {
    const [userInfo, setUserInfo] = useState({ username: '', role: '' });
    const [newUsername, setNewUsername] = useState('');
    const [usernameMessage, setUsernameMessage] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const [showPasswords, setShowPasswords] = useState(false);

    const navigate = useNavigate();

   useEffect(() => {
       const userRole = localStorage.getItem('role');
   
       if (userRole !== 'superuser' && userRole !== 'user' && userRole !== 'tecnico') {
         navigate('/');
       }
     }, [navigate]);
    
    useEffect(() => {
      document.title = "Quill - Configuración";
    }, []);

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

    // Validar que el nuevo nombre no sea igual al actual
    if (newUsername === userInfo.username) {
      setUsernameMessage('El nuevo nombre de usuario debe ser diferente al actual.');
      return;
    }

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

    const cleanedNewPassword = newPassword.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
    const cleanedConfirmPassword = confirmPassword.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');

    if (cleanedNewPassword.length < 5) {
      toast.error('La nueva contraseña debe tener al menos 5 caracteres válidos.');
      return;
    }

    if (cleanedNewPassword !== cleanedConfirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    try {
      const res = await axios.put(
        '/api/account/password',
        { currentPassword, newPassword: cleanedNewPassword, confirmPassword: cleanedConfirmPassword },
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

      {/* Columna izquierda: Configuración de cuenta */}
      <div className="ml-5 mr-5 mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl text-blue-900 text-center font-bold mb-4">Configuración de Cuenta</h2>
        <hr className="my-4 border-t-2 border-blue-900" />
        <p className="mb-4">Configura algunos datos de tu cuenta.</p>

        {/* Mostrar rol y usuario actual */}
        <div className="mb-6">
          <p><strong>Nombre:</strong> {userInfo.username}</p>
          <p><strong>Rol:</strong> {userInfo.role}</p>
        </div>

        {/* Cambiar nombre de usuario */}
        <form onSubmit={handleUsernameChange} className="mb-6">
          <div className='mb-2'>
            <h3 className="font-semibold mb-2">Cambiar nombre de usuario</h3>
            <input
              type="text"
              className="w-86 p-2 border rounded"
              value={newUsername}
              onChange={(e) => {
                const val = e.target.value;
                const lastChar = val.slice(-1);
                if (lastChar.match(/[A-ZÁÉÍÓÚÜÑ!@#$%^&*]/)) {
                  toast.error('Usuario sólo admite letras minúsculas.', {
                    autoClose: 2000,
                    closeOnClick: true,
                  });
                }
                const filtered = val.replace(/[^a-z0-9_]/g, '');
                setNewUsername(filtered);
                if (filtered.length >= 20) {
                  toast.info('Máximo de 20 caracteres alcanzado.', {
                    autoClose: 2000,
                    closeOnClick: true,
                  });
                }
              }}
              maxLength={20}
            />
          </div>
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

        <hr className="my-4 border-t-2 border-gray-300" />

        {/* Cambiar contraseña */}
        <form onSubmit={handlePasswordChange}>
          <h3 className="font-semibold mb-2">Cambiar contraseña</h3>

          <div className="mb-2">
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Contraseña actual"
              className="w-68 p-2 border rounded"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              title={showPasswords ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPasswords((prev) => !prev)}
              className="ml-2 p-3 hover:bg-gray-300 rounded"
            >
              {showPasswords ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-5-10-5s2.879-3.82 6.863-4.826M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="mb-2">
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Nueva contraseña"
              className="w-68 p-2 border rounded"
              value={newPassword}
              onChange={(e) => {
                const val = e.target.value;
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setNewPassword(filtered);
              }}
              maxLength={50}
              required
            />
          </div>

          <div className="mb-2 flex items-center gap-2">
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Confirmar nueva contraseña"
              className="w-68 p-2 border rounded"
              value={confirmPassword}
              onChange={(e) => {
                const val = e.target.value;
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setConfirmPassword(filtered);
              }}
              maxLength={50}
              required
            />
          </div>

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
