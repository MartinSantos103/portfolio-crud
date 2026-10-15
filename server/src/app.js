import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
];
const previewPattern = /^https:\/\/portfolio-client-[a-z0-9-]+\.vercel\.app$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || previewPattern.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Origen no permitido por CORS'));
  },
}));
app.use(express.json());
app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API en http://localhost:${port}`));
}

export default app;