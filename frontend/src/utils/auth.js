import { jwtDecode } from 'jwt-decode';

export function getDecodedToken() {
  const token = localStorage.getItem('token');

  if (!token || typeof token !== 'string') return null;

  try {
    const decoded = jwtDecode(token);

    return {
      token,
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error('Token inválido o no existe:', error);
    return null;
  }
}
