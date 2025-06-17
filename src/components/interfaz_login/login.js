import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
    useEffect(() => {
      const userRole = localStorage.getItem('role');
  
      if (userRole === 'superuser' || userRole === 'user' || userRole === "tecnico") {
        toast.error('Tu sesión sigue activa.');
        navigate('/');
      }
    }, [navigate]);

  useEffect(() => {
    document.title = "Quill - Login";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/login', {
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
        const { selectedCycle, selectedBuilding, selectedDay } = JSON.parse(savedState);
        toast.success('Se ha iniciado la sesión.');
        // Redirigir al calendario y enviar el estado
        navigate(`/`, {
          state: { selectedCycle, selectedBuilding, selectedDay }
        });
      } else {
        toast.success('Se ha iniciado la sesión.');
        navigate('/');
      }

    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor');
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
          <input
            type="password"
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
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 mb-2"
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
