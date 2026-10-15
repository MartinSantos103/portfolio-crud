# Portfolio Web Fullstack con panel de control

> Proyecto Fullstack de portfolio: Todo se persiste en PostgreSQL (Neon) y se administra desde un panel de control con roles.

---

## 1. Requisitos Previos

Instalar las siguientes herramientas:

- **Node.js**: Versión **`v24.x`** (recomendado `v24.21.0` o superior; compatible con `node >= 20.x` / `22 LTS`).  
  Verificar con:
  ```bash
  node -v
  ```
- **npm**: Versión **`10.x`** o superior.  
  Verificar con:
  ```bash
  npm -v
  ```
- **Git**: Configurado con nombre y correo personal:
  ```bash
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu-email@ucasal.edu.ar"
  ```

---

## 2. Configuración de Entorno (.env)

El proyecto utiliza variables de entorno separadas para el cliente (`client/`) y el servidor (`server/`). **Nunca se deben subir los archivos `.env` al repositorio** (ya están ignorados en el `.gitignore`).

### 2.1 Frontend (`client/`)

Copiar el archivo de plantilla `.env.example` a `.env`:

```powershell
# En PowerShell (Windows)
Copy-Item client\.env.example client\.env
```
```bash
# En Bash / Git Bash
cp client/.env.example client/.env
```

Contenido de `client/.env`:
```env
VITE_API_URL=http://localhost:3000
```
> **Nota**: Las variables con prefijo `VITE_` son públicas y se empaquetan en el navegador. Nunca almacenar secretos en `client/`.

---

### 2.2 Backend (`server/`)

Copiar el archivo de plantilla `.env.example` a `.env`:

```powershell
# En PowerShell (Windows)
Copy-Item server\.env.example server\.env
```
```bash
# En Bash / Git Bash
cp server/.env.example server/.env
```

Variables de `server/.env`:
```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secreto_para_firmar_tokens_jwt
```
*(Solicitar la cadena de conexión de Neon al Integrante 1 para el entorno de desarrollo compartido)*.

---

### 2.3 Cuentas de Prueba para Desarrollo (Seed)

Para poblar la base de datos con el esquema inicial y las cuentas de prueba, ejecutar:
```bash
cd server
npm run seed
```

## 3. Comandos de Desarrollo

El proyecto cuenta con frontend y backend desacoplados. Se deben levantar en dos terminales separadas.

### 3.1 Instalación de Dependencias

```bash
# Terminal 1 - Frontend
cd client
npm install

# Terminal 2 - Backend
cd server
npm install
```

---

### 3.2 Ejecución en Desarrollo

```bash
# Terminal 1: Iniciar Frontend (Vite)
cd client
npm run dev
# -> Disponible en: http://localhost:5173
```

```bash
# Terminal 2: Iniciar Backend (Express en modo watch)
cd server
npm run dev
# -> Disponible en: http://localhost:3000
```

---

### 3.3 Verificación Rápida del Sistema

Con el servidor corriendo, puedes verificar el estado de la API y la conexión a la base de datos Neon abriendo en el navegador o ejecutando en terminal:

1. **Estado de la API**: [`http://localhost:3000/api/test`](http://localhost:3000/api/test)  
   Respuesta esperada: `{"ok": true, "message": "API funcionando", "time": "..."}`
2. **Estado de conexión a Neon**: [`http://localhost:3000/api/health`](http://localhost:3000/api/health)  
   Respuesta esperada: `{"ok": true, "dbTime": "..."}`

---

## 4. Convención de Git y Ramas

Para evitar colisiones y mantener la rama `main` siempre desplegable y funcional en producción:

### 4.1 Reglas Fundamentales
1. **La rama `main` está protegida**: Nadie realiza `git push` directamente a `main`. Todo cambio entra exclusivamente mediante **Pull Request (PR)** revisado y aprobado.
2. **Ramas cortas**: Las ramas deben representar tareas puntuales y tener una vida útil corta (1 a 2 días como máximo).

### 4.2 Nomenclatura de Ramas
Nombrar las ramas según el tipo de cambio y funcionalidad:

- `feat/<nombre-modulo>`: Nueva funcionalidad.  
  *Ejemplos*: `feat/proyectos-listado`, `feat/auth-login`, `feat/contacto-form`, `feat/metricas-graficos`.
- `fix/<descripcion-corta>`: Corrección de un error detectado.  
  *Ejemplos*: `fix/cors-preview-url`, `fix/db-pool-timeout`.
- `docs/<tema>`: Documentación, manual de diseño o diagramas.  
  *Ejemplos*: `docs/arquitectura-api`, `docs/anteproyecto`.

### 4.3 Flujo Diario de Trabajo
Antes de comenzar a programar o antes de abrir un PR, incorporar siempre lo último de `main`:

```bash
# 1. Traer novedades remotas
git checkout main
git pull origin main

# 2. Volver a la rama de trabajo y fusionar main
git checkout feat/mi-funcionalidad
git merge main

# 3. Trabajar, commitear y subir la rama
git add .
git commit -m "feat(proyectos): agrega tarjetas y modal de acceso"
git push origin feat/mi-funcionalidad
```

### 4.4 Revisión de Pull Requests 
Para que nadie dependa de una sola persona y todos conozcan el código del proyecto, la revisión la hacen los demas integrantes del grupo:

**Checklist obligatorio antes de aprobar un PR**:
- [ ] La funcionalidad se probó localmente y funciona sin errores en consola.
- [ ] No incluye archivos `.env`, credenciales ni secretos.
- [ ] Los formularios y archivos subidos cuentan con validación estricta.
- [ ] La descripción del PR explica qué se hizo e incluye descripciones de los cambios visuales si existen.

---

## 5. Distribución de Responsabilidades y Dueños de Carpetas

Para erradicar conflictos de fusión (*merge conflicts*), el trabajo se organizó de manera **vertical**: cada integrante es dueño de módulos de punta a punta y trabaja en sus propias carpetas.

### 5.1 Integrante 1 — Núcleo, Plataforma, Auth, Servidor de Mensajes y Métricas

- **Responsabilidades**:
  - Infraestructura, pool de conexión a Neon (`pg`), migraciones y script de seed con datos iniciales.
  - Autenticación: registro y login con JWT y contraseñas con bcrypt (backend y control de sesión).
  - Protección de rutas en frontend por rol de usuario (`admin` / `usuario`).
  - Panel de gestión de usuarios en el admin.
  - Servidor de mensajes: endpoints para recepción de mensajes, servicio de correo con Nodemailer, guardado en base de datos y registro de respuestas.
  - Registro de eventos: visitas públicas y vistas de proyecto.
  - Consultas SQL complejas de métricas agregadas con filtros para el dashboard.
  - Soporte de despliegue en Vercel, auditoría de seguridad y documentación de arquitectura.

- **Carpetas y Archivos asignados**:
  - `server/src/db/` (`pool.js`, migraciones, `seed.js`)
  - `server/src/middleware/` (`authMiddleware.js`, validadores de sesión)
  - `server/src/routes/auth.js`
  - `server/src/routes/users.js`
  - `server/src/routes/messages.js` *(Servidor y lógica de mensajes)*
  - `server/src/routes/metrics.js` *(Servidor y consultas SQL de métricas)*
  - `server/src/services/mail.js` *(Nodemailer)*
  - `client/src/features/auth/` *(Lógica de autenticación, AuthContext y RouteGuards)*
  - `client/src/features/users/` *(Vistas y componentes del panel de usuarios)*

---

### 5.2 Integrante 2 — Experiencia Pública, UI Kit, Figma y Visualización de Métricas

- **Responsabilidades**:
  - Diseño integral en Figma (manual de estilo, paleta de colores, tipografía, layouts y prototipos).
  - Componentes base reutilizables de UI (botón, input, modal, tabla, tarjeta).
  - Estructura general de interfaz: Navbar, Footer, temas y variables CSS en Tailwind v4.
  - Páginas públicas: Home (presentación, sobre mí, trayectoria), Stack tecnológico y Servicios públicos.
  - Listado de proyectos público: tarjetas con candado para proyectos privados y ventana modal de acceso.
  - Pantallas visuales de Registro e Inicio de sesión.
  - Página de detalle del proyecto para usuarios registrados.
  - Animaciones visuales fluidas con Framer Motion y animación Lottie.
  - Adaptación 100% responsiva para celulares y tablets, y chequeo de accesibilidad.
  - Tablero visual de métricas en el panel de administración utilizando Recharts.

- **Carpetas y Archivos asignados**:
  - `client/src/components/ui/` *(Botones, inputs, modales, tarjetas, spinners)*
  - `client/src/components/layout/` *(Navbar, Footer, Sidebar, Layout público y privado)*
  - `client/src/features/public/` *(Home, About, Skills, Stack, Servicios públicos)*
  - `client/src/features/projects/public/` *(Listado de proyectos y vista detallada `ProjectDetail.jsx`)*
  - `client/src/features/auth/pages/` *(Vistas visuales `Login.jsx` y `Register.jsx`)*
  - `client/src/features/metrics/` *(Tablero con gráficos interactivos Recharts)*

---

### 5.3 Integrante 3 — Contenido del Lienzo, CRUDs de Administración y Demos

- **Responsabilidades**:
  - Gestión y CRUDs completos en el panel de administración: Proyectos, Servicios, Demos y Perfil del desarrollador.
  - Subida de imágenes a Cloudinary: configuración del backend y componente reutilizable de subida en frontend.
  - Formulario de contacto público: selector dinámico por tipo de consulta con campos contextuales según el tipo elegido.
  - Gestión de demos interactivas y visor de demos en frontend (soporte para iframe, videos y galería de imágenes).
  - Bandeja de entrada de mensajes en el panel de administración: listado, filtros por estado, vista de detalle y cambio de estado.
  - Validación exhaustiva de archivos, tipos MIME y pesos de imágenes de punta a punta.
  - Desarrollo de dos o tres mini-aplicaciones funcionales de demostración y carga del contenido inicial del portfolio.

- **Carpetas y Archivos asignados**:
  - `server/src/routes/projects.js`
  - `server/src/routes/services.js`
  - `server/src/routes/demos.js`
  - `server/src/routes/profile.js`
  - `server/src/routes/uploads.js`
  - `server/src/services/cloudinary.js`
  - `client/src/features/contact/` *(Formulario dinámico de contacto público)*
  - `client/src/features/admin/projects/` *(Gestión de proyectos)*
  - `client/src/features/admin/services/` *(Gestión de servicios)*
  - `client/src/features/admin/demos/` *(Gestión de demos)*
  - `client/src/features/admin/profile/` *(Edición de perfil del lienzo)*
  - `client/src/features/admin/messages/` *(Bandeja de mensajes de administración)*
  - `client/src/features/demos/` *(Visor interactivo de demos)*
  - `client/src/components/uploader/` *(Componente reutilizable de subida de imágenes)*

---

## 6. Puntos de Encuentro Centrales (Archivos Compartidos)

Para garantizar que nadie bloquee a otro integrante, solo existen **dos archivos de encuentro central** en todo el monorepo. Ambos ya fueron pre-creados en el esqueleto inicial con todas sus rutas y placeholders declarados:

### 1. Frontend: [`client/src/routes/AppRouter.jsx`](client/src/routes/AppRouter.jsx)
Contiene la declaración de todas las rutas de la aplicación con componentes `<Placeholder />`.  
**Regla de edición**: Cuando termines una vista (por ejemplo, el login o la gestión de proyectos), simplemente reemplaza el `<Placeholder title="..." />` correspondiente por tu componente importado. No elimines ni modifiques las rutas de tus compañeros.

```jsx
// Ejemplo: reemplazar el placeholder por el componente terminado
// Antes:
<Route path="/login" element={<Placeholder title="Iniciar sesión" />} />
// Después:
<Route path="/login" element={<LoginPage />} />
```

### 2. Backend: [`server/src/routes/index.js`](server/src/routes/index.js)
Monta todos los enrutadores modulares de Express (`auth`, `projects`, `messages`, etc.).  
**Regla de edición**: Todos los routers ya se encuentran importados y montados en `/api/...`. Cada integrante desarrolla dentro de su archivo específico (`server/src/routes/projects.js`, `messages.js`, etc.) sin necesidad de tocar `index.js`.

---

## 7. Estructura General del Proyecto

```text
portfolio-crud/
├── client/                     # Frontend (React 19, Vite, Tailwind CSS v4)
│   ├── public/                 # Archivos estáticos y favicon
│   ├── src/
│   │   ├── components/         # UI Kit base y Layouts (Integrante 2)
│   │   │   ├── ui/             # Botones, inputs, modales, tablas, cards
│   │   │   └── layout/         # Navbar, Footer, Sidebar
│   │   ├── features/           # Módulos verticales por funcionalidad
│   │   │   ├── auth/           # Lógica y sesión (Int. 1) | Vistas Login/Register (Int. 2)
│   │   │   ├── public/         # Home, About, Skills, Servicios (Integrante 2)
│   │   │   ├── contact/        # Formulario de contacto dinámico (Integrante 3)
│   │   │   ├── projects/       # Listado público y detalle (Integrante 2)
│   │   │   ├── demos/          # Visor de demos interactivas (Integrante 3)
│   │   │   ├── admin/          # Panel de control del lienzo (Integrante 3)
│   │   │   ├── users/          # Panel de gestión de usuarios (Integrante 1)
│   │   │   └── metrics/        # Dashboard interactivo con Recharts (Integrante 2)
│   │   ├── pages/              # Ensamblado de pantallas
│   │   ├── routes/
│   │   │   └── AppRouter.jsx   # ⭐️ Punto de encuentro de rutas frontend
│   │   ├── services/
│   │   │   └── api.js          # Instancia base de Axios / Fetch configurada
│   │   ├── App.jsx
│   │   ├── index.css           # Configuración de Tailwind CSS
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend (Node.js, Express, PostgreSQL)
│   ├── src/
│   │   ├── db/                 # Pool pg, migraciones y seed (Integrante 1)
│   │   ├── middleware/         # Autenticación, roles y validaciones (Integrante 1)
│   │   ├── routes/             # Endpoints modulares
│   │   │   ├── index.js        # ⭐️ Punto de encuentro de rutas backend
│   │   │   ├── auth.js         # Rutas de autenticación (Integrante 1)
│   │   │   ├── users.js        # Rutas de usuarios (Integrante 1)
│   │   │   ├── messages.js     # Rutas y guardado de mensajes (Integrante 1)
│   │   │   ├── metrics.js      # Consultas SQL de métricas (Integrante 1)
│   │   │   ├── projects.js     # CRUD de proyectos (Integrante 3)
│   │   │   ├── services.js     # CRUD de servicios (Integrante 3)
│   │   │   ├── demos.js        # CRUD de demos (Integrante 3)
│   │   │   ├── profile.js      # CRUD de perfil del lienzo (Integrante 3)
│   │   │   └── uploads.js      # Subida de imágenes a Cloudinary (Integrante 3)
│   │   ├── services/           # Servicios externos
│   │   │   ├── mail.js         # Nodemailer (Integrante 1)
│   │   │   └── cloudinary.js   # Cloudinary SDK (Integrante 3)
│   │   └── app.js              # Inicialización de Express y CORS
│   ├── .env.example
│   └── package.json
│
└── README.md                   # Esta guía de trabajo y onboarding
```