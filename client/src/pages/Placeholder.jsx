import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api.js';

export default function Placeholder({ title }) {
  const [status, setStatus] = useState('consultando API...');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/test').then((d) => setStatus(d.message)).catch((e) => setStatus(e.message));
  }, []);

  const handleFetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{title}</h1>
      <p>Estado de la API: {status}</p>

      <button
        onClick={handleFetchUsers}
        disabled={loading}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: '1px solid #1d4ed8',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Cargando...' : 'Datos de Usuarios'}
      </button>

      {error && <p>Error: {error}</p>}

      {users.length > 0 && (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} - {user.email} (Rol: {user.role})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
