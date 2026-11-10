import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Placeholder from '../pages/Placeholder.jsx';
import HomePage from '../features/public/pages/HomePage.jsx';
import ProjectDetail from '../features/projects/public/ProjectDetail.jsx';
import {
  AuthProvider,
  ProtectedRoute,
  PublicOnlyRoute,
} from '../features/auth/index.js';
import { ToastProvider } from '../components/ui/Toast.jsx';
import CustomCursor from '../components/ui/CustomCursor.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import DashboardPage from '../features/admin/dashboard/DashboardPage.jsx';
import ProfileEditPage from '../features/admin/profile/ProfileEditPage.jsx';
import ProjectsListPage from '../features/admin/projects/ProjectsListPage.jsx';
import ProjectFormPage from '../features/admin/projects/ProjectFormPage.jsx';
import DemosListPage from '../features/admin/demos/DemosListPage.jsx';
import DemoFormPage from '../features/admin/demos/DemoFormPage.jsx';
import ServicesListPage from '../features/admin/services/ServicesListPage.jsx';
import ServiceFormPage from '../features/admin/services/ServiceFormPage.jsx';
import MessagesInboxPage from '../features/admin/messages/MessagesInboxPage.jsx';
import UsersManagementPage from '../features/users/UsersManagementPage.jsx';
import { apiFetch } from '../services/api.js';
import {
  getCachedPublicData,
  updatePortfolioProfileCache,
  syncDocumentTitle,
  PROFILE_UPDATED_EVENT,
} from '../features/public/hooks/usePortfolioData.js';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function RootProvidersLayout() {
  useEffect(() => {
    let isMounted = true;
    const cached = getCachedPublicData();
    if (cached?.profile) {
      syncDocumentTitle(cached.profile);
    }

    apiFetch('/profile')
      .then((res) => {
        if (isMounted && res?.data) {
          updatePortfolioProfileCache(res.data);
        }
      })
      .catch(() => {});

    const handleProfileUpdated = (event) => {
      if (event?.detail?.profile) {
        syncDocumentTitle(event.detail.profile);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key !== 'pf_public_cache_v1' || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.profile) {
          syncDocumentTitle(parsed.profile);
        }
      } catch {
        // Ignorar errores de parseo
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ToastProvider>
          <Outlet />
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

/**
 * PublicShellLayout — Envoltorio exclusivo del sitio público (fuera de /admin/*).
 * Monta una sola vez el cursor luminoso (y ASTRO en Parte 4) sin desmontarlos al navegar entre secciones.
 */
function PublicShellLayout() {
  return (
    <>
      <CustomCursor />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootProvidersLayout />,
    children: [
      {
        element: <PublicShellLayout />,
        children: [
          /* Rutas Públicas: accesibles para cualquier visitante */
          { path: '/', element: <HomePage /> },
          { path: '/proyectos', element: <HomePage initialSection="proyectos" /> },
          { path: '/contacto', element: <HomePage initialSection="contacto" /> },

          /* Rutas de Invitados: no accesibles si ya se tiene sesión activa (redirige según rol) */
          {
            element: <PublicOnlyRoute />,
            children: [
              { path: '/login', element: <Navigate to="/" replace /> },
              { path: '/registro', element: <Navigate to="/" replace /> },
            ],
          },

          /* Rutas Protegidas de Usuario Autenticado (admin o user) */
          {
            element: <ProtectedRoute allowedRoles={['admin', 'user']} redirectTo="/" />,
            children: [{ path: '/proyectos/:id', element: <ProjectDetail /> }],
          },
        ],
      },

      /* Rutas Protegidas Exclusivas de Administrador (solo admin) — 15 rutas del CMS v2 */
      {
        path: '/admin',
        element: <ProtectedRoute allowedRoles={['admin']} redirectTo="/" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'perfil', element: <ProfileEditPage /> },
              { path: 'proyectos', element: <ProjectsListPage /> },
              { path: 'proyectos/nuevo', element: <ProjectFormPage /> },
              { path: 'proyectos/:id/editar', element: <ProjectFormPage /> },
              { path: 'demos', element: <DemosListPage /> },
              { path: 'demos/nuevo', element: <DemoFormPage /> },
              { path: 'demos/:id/editar', element: <DemoFormPage /> },
              { path: 'servicios', element: <ServicesListPage /> },
              { path: 'servicios/nuevo', element: <ServiceFormPage /> },
              { path: 'servicios/:id/editar', element: <ServiceFormPage /> },
              { path: 'mensajes', element: <MessagesInboxPage /> },
              { path: 'mensajes/:id', element: <MessagesInboxPage /> },
              { path: 'usuarios', element: <UsersManagementPage /> },
              { path: 'metricas', element: <Navigate to="/admin" replace /> },
            ],
          },
        ],
      },

      /* Ruta por defecto para URLs no coincidentes (404) */
      { path: '*', element: <Placeholder title="404 - Página no encontrada" /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
