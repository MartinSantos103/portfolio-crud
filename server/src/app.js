import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : []),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

// Acepta el dominio principal y cualquier preview de Vercel del cliente
const vercelPreviewRegex = /^https:\/\/portfolio(-crud)?-client(-[a-z0-9-]+)?\.vercel\.app$/i;
const isDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

const corsOptions = {
  origin(origin, callback) {
    // Permitir peticiones sin origin (como Postman, curl o tests)
    if (!origin) return callback(null, true);

    // En desarrollo local, permitir cualquier puerto de localhost y 127.0.0.1
    if (
      isDev &&
      (/^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Bloqueado por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('{*splat}', cors(corsOptions)); // Asegura que el preflight OPTIONS responda siempre en Express 5

app.use(express.json());
app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API en http://localhost:${port}`));
}

export default app;
