import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../config/api';


import axios from 'axios';
import './interfaz_calendar/calendar.css'; // Importa el archivo de estilos CSS

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
    document.title = "TRACS - Configuración";
  }, []);

  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/info`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUserInfo(res.data);
        setNewUsername(res.data.username);
      } catch (err) {
        if (err.response) {
          if (err.response.status === 403) {
            localStorage.clear();
            navigate("/");
            return;
          }
          else if (err.response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
            return;
          }
        }
        console.error(err);
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

    if (newUsername.match(/[A-ZÁÉÍÓÚÜÑ!@#$%^&*]/)) {
        toast.error('Usuario sólo admite letras minúsculas.', {
          autoClose: 1500,
          closeOnClick: true,
        });
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/api/account/username`,
        { newUsername },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setUsernameMessage(res.data.message);
      setUserInfo((prev) => ({ ...prev, username: newUsername }));
      localStorage.clear();
      toast.success("Se cerrará su sesión.",  {autoClose: 400});
      setTimeout(() => {
        window.location.href = "/";
      }, 900);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 403) {
          localStorage.clear();
          navigate("/");
          return;
        }
        else if (err.response.status === 401) {
          localStorage.clear();
          window.location.href = '/';
          return;
        }
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
        `${API_URL}/api/account/password`,
        { currentPassword, newPassword: cleanedNewPassword, confirmPassword: cleanedConfirmPassword },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setPasswordMessage(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      localStorage.clear();
      toast.success("Se cerrará su sesión.", {autoClose: 400});
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 403) {
          localStorage.clear();
          navigate("/");
          return;
        }
        else if (err.response.status === 401) {
          localStorage.clear();
          window.location.href = '/';
          return;
        }
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
      <div className="ml-5 mr-5 mb-2 mx-auto mt-10 p-6 bg-white shadow-md rounded-lg custom-shadow-border">
        <h2 className="text-2xl text-purple-900 text-center font-bold mb-4">Configuración de Cuenta</h2>
        <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #4629ba' }} />
        <p className="mb-4 text-center text-xl">Configura algunos datos de tu cuenta.</p>

        {/* Mostrar rol y usuario actual */}
        <div className="mb-7 text-xl text-center">
          <p><strong>Nombre:</strong> {userInfo.username}</p>
          <p><strong>Rol:</strong> {
            userInfo.role === 'superuser'
              ? 'Super usuario'
              : userInfo.role === 'user'
              ? 'Usuario'
              : 'Técnico'
          }
          </p>
        </div>
        {/* Cambiar nombre de usuario */}
        <form onSubmit={handleUsernameChange} className="mb-6 flex flex-col items-center w-full max-w-md mx-auto">
          <div className="mb-4 w-full max-w-sm">
            <h3 className="font-semibold mb-2 text-xl text-center">Cambiar nombre de usuario</h3>
            <input
              type="text"
              className="p-3 border rounded w-full text-lg"
              minLength={3}
              maxLength={20}
              value={newUsername}
              onChange={(e) => {
                const val = e.target.value;
                const filtered = val.replace(/[^a-zA-Z0-9_]/g, '');
                setNewUsername(filtered);
                if (filtered.length >= 20) {
                  toast.info('Máximo de 20 caracteres alcanzado.', {
                    autoClose: 2000,
                    closeOnClick: true,
                  });
                }
              }}
            />
          </div>
          <button
            type="submit"
            className="background-button3 text-white px-4 py-3 max-w-sm rounded text-lg"
          >
            Guardar nuevo nombre
          </button>
          {usernameMessage && (
            <p className="mt-2 text-sm text-gray-700">{usernameMessage}</p>
          )}
        </form>

        <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid rgb(142, 127, 206)' }} />

        {/* Cambiar contraseña */}
        <form onSubmit={handlePasswordChange} className="flex flex-col items-center w-full max-w-md mx-auto">
          <h3 className="font-semibold mb-2 text-xl">Cambiar contraseña</h3>

          <div className="relative mb-4 flex items-center w-full max-w-sm">
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Contraseña actual"
              className="w-68 p-3 border rounded w-full text-lg"
              maxLength={50}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              title={showPasswords ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPasswords((prev) => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
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

          <div className="mb-4 w-full max-w-sm">
            <input
              type={'password'}
              placeholder="Nueva contraseña"
              className="w-full p-3 border rounded text-lg"
              minLength={6}
              maxLength={50}
              value={newPassword}
              onChange={(e) => {
                const val = e.target.value;
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setNewPassword(filtered);
              }}
              required
            />
          </div>

          <div className="mb-4 w-full max-w-sm">
            <input
              type={'password'}
              placeholder="Confirmar nueva contraseña"
              className="w-full p-3 border rounded text-lg"
              maxLength={50}
              value={confirmPassword}
              onChange={(e) => {
                const val = e.target.value;
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setConfirmPassword(filtered);
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="background-button4 text-white px-4 py-3 rounded text-lg"
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
