import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

/**
 * Guardián de ruta protegida.
 * Redirecciona automáticamente según los permisos:
 * - Si no está autenticado -> a /login (guardando la ruta de origen en state.from)
 * - Si está autenticado pero no tiene el rol necesario -> a su ruta permitida (/admin si es admin, /proyectos si es user)
 *
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Roles permitidos para acceder (ej: ['admin'] o ['admin', 'user'])
 * @param {string} [props.redirectTo='/login'] - Ruta a redirigir si no está autenticado
 * @param {React.ReactNode} [props.children] - Componente hijo opcional
 */
export default function ProtectedRoute({ allowedRoles, redirectTo = '/login', children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verificando permisos de acceso..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
    // Redirección automática según el rol del usuario, sin pantalla de error 403
    const target = user?.role === 'admin' ? '/admin' : '/proyectos';
    return <Navigate to={target} replace />;
  }

  return children ? children : <Outlet />;
}
