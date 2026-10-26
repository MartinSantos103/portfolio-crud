import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

/**
 * Guardián para rutas de invitados (login, registro).
 * Redirige automáticamente según los permisos del usuario autenticado:
 * - Admin -> /admin (o la ruta previa si era accesible)
 * - User -> /proyectos (o la ruta previa si no era de admin)
 */
export default function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Cargando sesión..." />;
  }

  if (isAuthenticated) {
    const origin = location.state?.from?.pathname;
    const defaultTarget = user?.role === 'admin' ? '/admin' : '/proyectos';

    // Si un usuario común venía de una ruta /admin, no lo mandamos allí; va a su destino por rol
    const target =
      origin && (user?.role === 'admin' || !origin.startsWith('/admin'))
        ? origin
        : defaultTarget;

    return <Navigate to={target} replace />;
  }

  return children ? children : <Outlet />;
}
