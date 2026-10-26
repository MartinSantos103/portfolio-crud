import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Placeholder from '../pages/Placeholder.jsx';
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
          <Route path="/" element={<Placeholder title="Home" />} />
          <Route path="/proyectos" element={<Placeholder title="Proyectos" />} />
          <Route path="/contacto" element={<Placeholder title="Contacto" />} />

          {/* Rutas de Invitados: no accesibles si ya se tiene sesión activa (redirige según rol) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Placeholder title="Iniciar sesión" />} />
            <Route path="/registro" element={<Placeholder title="Registro" />} />
          </Route>

          {/* Rutas Protegidas de Usuario Autenticado (admin o user) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
            <Route path="/proyectos/:id" element={<Placeholder title="Detalle de proyecto" />} />
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
