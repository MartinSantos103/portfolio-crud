import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  nodeEnv: process.env.NODE_ENV || 'development',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  githubUsername: process.env.GITHUB_USERNAME || '',
  githubToken: process.env.GITHUB_TOKEN || '',
};

export default config;
