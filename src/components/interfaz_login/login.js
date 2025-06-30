import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../../config/api';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "Quill - Login";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isSaving) return; // Evita clics múltiples
    setIsSaving(true); // Inicia la "protección"

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('token', data.token);

      // Decodifica el token y guarda el rol
      const decoded = jwtDecode(data.token);
      localStorage.setItem('role', decoded.role); // Ahora puedes usarlo para mostrar/ocultar cosas
      localStorage.setItem('username', decoded.username);
      
      const savedState = sessionStorage.getItem('reservationState');

      if (savedState) {
        const { selectedCycle, selectedBuilding } = JSON.parse(savedState);
        toast.success('Se ha iniciado la sesión.');
        // Redirigir al calendario y enviar el estado
        navigate(`/`, {
          state: { selectedCycle, selectedBuilding }
        });
      } else {
        toast.success('Se ha iniciado la sesión.');
        navigate('/');
      }

    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor');
    }
    finally {
      setIsSaving(false); // Vuelve a permitir guardar
    }
  };

  const goToSignup = () => {
    navigate('/');
  };

return (
  <div className="relative h-screen w-screen bg-black">
    {/* Fondo con imagen difuminada */}
    <div
      className="bg-blurred"
    ></div>

    {/* Capa frontal (formulario) */}
    <div className="relative flex justify-center items-center h-full">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-80 z-10 custom-shadow-border-reports">
        <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>

        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Usuario</label>
          <input
            type="text"
            value={usuario}
            maxLength={20}
            onChange={(e) => {
              const val = e.target.value;
              const lastChar = val.slice(-1);
              if (lastChar.match(/[A-ZÁÉÍÓÚÜÑ!@#$%^&*]/)) {
                toast.error('Usuario sólo admite letras minúsculas.', {
                  autoClose: 1000,
                  closeOnClick: true,
                });
              }
              const filtered = val.replace(/[^a-z0-9_]/g, '');
              setUsuario(filtered);
              if (filtered.length >= 20) {
                toast.info('Máximo de 20 caracteres alcanzado.', {
                  autoClose: 1000,
                  closeOnClick: true,
                });
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ingresa tu nombre de usuario"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
          <div className='relative'>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              const val = e.target.value;
              const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
              setPassword(filtered);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ingresa tu contraseña"
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
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 mb-2"
          disabled={isSaving}
        >
          Iniciar Sesión
        </button>

        <button
          type="button"
          onClick={goToSignup}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
        >
          Cancelar
        </button>
      </form>
    </div>
  </div>
);

}
