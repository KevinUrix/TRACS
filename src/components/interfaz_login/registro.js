import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';


export default function Registro() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    
    if (userRole !== 'superuser') {
      toast.error('Debes está logeado para entrar a esta página.');
        navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Quill - Registro";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrar usuario');
        return;
      }

      setSuccess('Usuario registrado con éxito');
      setError('');
      setTimeout(() => navigate('/crud'), 1500);
    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor');
    }
  };

  const handleCancel = () => {
    navigate('/crud');
  };

  return (
    <div className="relative full-viewport w-screen bg-black">
      <div
        className="bg-blurred"
    ></div>
      <div className="relative flex justify-center items-center min-h-screen py-7">
        <form onSubmit={handleRegister} className="bg-white p-8 rounded-lg shadow-lg w-80 z-10 custom-shadow-border-reports">
          <h2 className="text-2xl font-bold mb-4">Registrar Usuario</h2>

          {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
          {success && <div className="mb-4 text-green-600 font-semibold">{success}</div>}

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Nombre de usuario</label>
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

                // Solo letras, números y guion bajo
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
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              maxLength={50}
              minLength={5}
              onChange={(e) => {
                const val = e.target.value;
                // Solo letras, números y algunos símbolos comunes para contraseñas
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setPassword(filtered);

                if (filtered.length < 5) {
                  toast.error('La contraseña debe tener al menos 5 caracteres.', {
                    autoClose: 1000,
                    closeOnClick: true,
                  });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Contraseña"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                const val = e.target.value;
                // Solo letras, números y algunos símbolos comunes para contraseñas
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setConfirmPassword(filtered);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Repite la contraseña"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 mb-2"
          >
            Crear cuenta
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="w-full bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
