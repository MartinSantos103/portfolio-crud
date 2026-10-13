import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api.js';

export default function Placeholder({ title }) {
  const [status, setStatus] = useState('consultando API...');
  useEffect(() => {
    apiFetch('/test').then((d) => setStatus(d.message)).catch((e) => setStatus(e.message));
  }, []);
  return (
    <div>
      <h1>{title}</h1>
      <p>Estado de la API: {status}</p>
    </div>
  );
}