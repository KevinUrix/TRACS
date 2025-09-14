import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export function NormalizeURL() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;

    let nextPath = pathname;
    const params = new URLSearchParams(search);
    let changed = false;

    const hadTrailing = nextPath.length > 1 && /\/+$/.test(nextPath);
    if (hadTrailing) {
      nextPath = nextPath.replace(/\/+$/, '');
      changed = true;
    }

    const fromGoogle = params.get('fromGoogle') === 'true';
    if (params.has('fromGoogle')) {
      params.delete('fromGoogle');
      changed = true;
    }

    const guardKey = `toast:${pathname}${search}`;
    const shouldToast = fromGoogle && !sessionStorage.getItem(guardKey);

    if (shouldToast) {
      sessionStorage.setItem(guardKey, '1');
      toast.success('¡Sesión iniciada con Google! Ya puedes realizar tu reserva en Google Calendar.');
    }

    if (changed) {
      const q = params.toString();
      ranRef.current = true;
      navigate(`${nextPath}${q ? `?${q}` : ''}${hash}`, { replace: true });
    }
  }, [pathname, search, hash, navigate]);

  return null;
}
