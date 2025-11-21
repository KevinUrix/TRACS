import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_URL from '../../config/api';
import BASENAME from '../../config/baseName';

export default function Registro() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  /* 
  isSaving es para que no se guarden dos reportes desde una misma modal, el problema es que si faltan o colocas datos incorrectos NO puedes volver a presionar el botón.
  */
  // const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "TRACS - Registro";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (usuario.match(/[A-ZÁÉÍÓÚÜÑ!@#$%^&*]/)) {
      toast.error('Usuario solo admite letras minúsculas.', {
        autoClose: 1500,
        closeOnClick: true,
      });
      return;
    }

    if (/^[0-9]+$/.test(usuario)) {
      toast.error('El nombre de usuario no puede ser solo números.', {
        autoClose: 1500,
        closeOnClick: true,
      });
      return;
    }

    // if (isSaving) return; // Evita clics múltiples
    
    // Validar contraseña mínima
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.', {
        autoClose: 1500,
        closeOnClick: true,
      });
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // setIsSaving(true); // Inicia la "protección"

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ username: usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          window.location.href = `${BASENAME}/calendar`;
          return;
        }
        else {
          setError(data.error || 'Error al registrar usuario');
        }
        return;
      }

      toast.success('Usuario registrado con éxito');
      setError('');
      setTimeout(() => navigate('/crud'), 0);
    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor');
    } finally {
      // setIsSaving(false); // Vuelve a permitir guardar
    }
  };

  const handleCancel = () => {
    navigate('/crud');
  };

  return (
    <div className="content relative full-viewport w-screen bg-black">
      {/* Fondos animados */}
      <div className="bg"></div>
      <div className="bg bg2"></div>
      <div className="bg bg3"></div>

      <div className="relative flex justify-center items-center min-h-screen py-7">
        <form onSubmit={handleRegister} className="bg-white p-8 rounded-lg shadow-lg w-90 z-10 custom-shadow-border">
          <h2 className="text-2xl font-bold mb-4 text-purple-800">Registrar Usuario</h2>

          {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
          {success && <div className="mb-4 text-green-600 font-semibold">{success}</div>}

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Nombre de usuario</label>
            <input
              type="text"
              value={usuario}
              minLength={3}
              maxLength={20}
              onChange={(e) => {
                const val = e.target.value;
                // Solo letras, números y guion bajo
                const filtered = val.replace(/[^a-zA-Z0-9_]/g, '');
                setUsuario(filtered);
                
                if (filtered.length >= 20) {
                  toast.info('Máximo de 20 caracteres alcanzado.', {
                    autoClose: 1000,
                    closeOnClick: true,
                  });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={password}
                minLength={6}
                maxLength={30}
                onChange={(e) => {
                  const val = e.target.value;
                  const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                  setPassword(filtered);
                }}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg"
                placeholder="Contraseña"
                required
              />
              <button
                type="button"
                title={showPasswords ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPasswords((prev) => !prev)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPasswords ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-5-10-5s2.879-3.82 6.863-4.826M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Confirmar contraseña</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              minLength={6}
              maxLength={30}
              onChange={(e) => {
                const val = e.target.value;
                // Solo letras, números y algunos símbolos comunes para contraseñas
                const filtered = val.replace(/[^a-zA-Z0-9!@#$%^&*]/g, '');
                setConfirmPassword(filtered);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Repite la contraseña"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full background-button3 text-white py-2 px-4 rounded-lg mb-2"
            // disabled={isSaving}
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
          <div className="flex justify-between items-center gap-8 mt-6 text-sm md:text-base text-gray-600 px-2">
            <a href={`${BASENAME}/privacy`} className="hover:underline hover:text-purple-800 transition-colors duration-200" target="_blank">
              Política de privacidad
            </a>
            <a href={`${BASENAME}/terms`} className="hover:underline hover:text-purple-800 transition-colors duration-200" target="_blank">
              Términos y condiciones
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
