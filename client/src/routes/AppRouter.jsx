import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Placeholder from '../pages/Placeholder.jsx';
import HomePage from '../features/public/pages/HomePage.jsx';
import ProjectDetail from '../features/projects/public/ProjectDetail.jsx';
import Login from '../features/auth/pages/Login.jsx';
import Register from '../features/auth/pages/Register.jsx';
import {
  AuthProvider,
  ProtectedRoute,
  PublicOnlyRoute,
} from '../features/auth/index.js';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas: accesibles para cualquier visitante */}
          <Route path="/" element={<HomePage />} />
          <Route path="/proyectos" element={<HomePage initialSection="proyectos" />} />
          <Route path="/contacto" element={<HomePage initialSection="contacto" />} />

          {/* Rutas de Invitados: no accesibles si ya se tiene sesión activa (redirige según rol) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
          </Route>

          {/* Rutas Protegidas de Usuario Autenticado (admin o user) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
            <Route path="/proyectos/:id" element={<ProjectDetail />} />
          </Route>

          {/* Rutas Protegidas Exclusivas de Administrador (solo admin) */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Placeholder title="Panel" />} />
            <Route path="/admin/proyectos" element={<Placeholder title="Gestión de proyectos" />} />
            <Route path="/admin/servicios" element={<Placeholder title="Gestión de servicios" />} />
            <Route path="/admin/demos" element={<Placeholder title="Gestión de demos" />} />
            <Route path="/admin/perfil" element={<Placeholder title="Edición de perfil" />} />
            <Route path="/admin/mensajes" element={<Placeholder title="Bandeja de mensajes" />} />
            <Route path="/admin/usuarios" element={<Placeholder title="Gestión de usuarios" />} />
            <Route path="/admin/metricas" element={<Placeholder title="Métricas" />} />
          </Route>

          {/* Ruta por defecto para URLs no coincidentes (404) */}
          <Route path="*" element={<Placeholder title="404 - Página no encontrada" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
