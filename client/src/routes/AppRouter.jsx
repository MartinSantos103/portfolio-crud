import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Placeholder from '../pages/Placeholder.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder title="Home" />} />
        <Route path="/proyectos" element={<Placeholder title="Proyectos" />} />
        <Route path="/proyectos/:id" element={<Placeholder title="Detalle de proyecto" />} />
        <Route path="/contacto" element={<Placeholder title="Contacto" />} />
        <Route path="/login" element={<Placeholder title="Iniciar sesión" />} />
        <Route path="/registro" element={<Placeholder title="Registro" />} />
        <Route path="/admin" element={<Placeholder title="Panel" />} />
        <Route path="/admin/proyectos" element={<Placeholder title="Gestión de proyectos" />} />
        <Route path="/admin/servicios" element={<Placeholder title="Gestión de servicios" />} />
        <Route path="/admin/demos" element={<Placeholder title="Gestión de demos" />} />
        <Route path="/admin/perfil" element={<Placeholder title="Edición de perfil" />} />
        <Route path="/admin/mensajes" element={<Placeholder title="Bandeja de mensajes" />} />
        <Route path="/admin/usuarios" element={<Placeholder title="Gestión de usuarios" />} />
        <Route path="/admin/metricas" element={<Placeholder title="Métricas" />} />
      </Routes>
    </BrowserRouter>
  );
}