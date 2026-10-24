import cors from 'cors';

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

// Acepta el dominio principal y cualquier preview de Vercel del cliente
const vercelPreviewRegex = /^https:\/\/portfolio-crud-client(-[a-z0-9-]+)?\.vercel\.app$/i;

const corsOptions = {
  origin(origin, callback) {
    // Permitir peticiones sin origin (como Postman, curl o tests)
    if (!origin) return callback(null, true);

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
app.options('*', cors(corsOptions)); // Asegura que el preflight OPTIONS responda siempre