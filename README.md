# Olimpia - Gestión de Canchas de Fútbol 5

Olimpia es una plataforma integral para la gestión y reserva de turnos de canchas de Fútbol 5. El sistema cuenta con un frontend público para los clientes, un panel de administración protegido para los dueños, y un backend robusto que gestiona las reservas, los clientes y la configuración.

URL de Producción: [https://olimpiafutbol5.com.ar](https://olimpiafutbol5.com.ar)

## Arquitectura y Stack Tecnológico

El proyecto está dividido en dos partes principales (monorepo):

### Frontend (Angular)
- **Framework:** Angular 19 (Standalone Components).
- **Estilos:** CSS Vanilla.
- **Autenticación:** Supabase Auth-JS.
- **Estructura:**
  - `src/app/components/slots`: Vista pública con la grilla de turnos.
  - `src/app/components/admin`: Panel de control (requiere login).
  - `src/app/services`: Conexión con el Backend REST y Supabase.

### Backend (NestJS + Prisma)
- **Framework:** NestJS.
- **Base de Datos:** PostgreSQL alojada en [Supabase](https://supabase.com).
- **ORM:** Prisma.
- **Seguridad:** JWT Validation Guards y políticas estricta de CORS.
- **Estructura:**
  - `src/slots`: API para obtener y gestionar turnos.
  - `src/settings`: API para configuración dinámica (e.g., monto de seña).
  - `src/auth`: Validadores de JWT inyectado por el Frontend.

---

## Funcionalidades Principales

### Panel Público
- Visualización de la grilla horaria dividida por canchas.
- Estados visuales: Libre, Reservado, Fijo.
- Enlaces rápidos de WhatsApp para solicitar reservas.

### Panel Administrativo
- Protegido mediante usuario y contraseña (vía Supabase Auth).
- Modificación en tiempo real del estado de los turnos.
- Tipos de reserva: Normal, Fijo, Cumpleaños.
- Modificación dinámica del monto de la seña.

---

## Ejecución en Entorno Local (Desarrollo)

Para levantar el entorno completo de desarrollo, debes correr ambos servicios en paralelo.

### 1. Requisitos Previos
- Node.js (v20+ recomendado).
- Cuenta en Supabase (o las credenciales del proyecto actual).

### 2. Configuración del Backend
1. Navegar al directorio backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   Crea un archivo `.env` en `backend/` basado en `.env.example` e incluye:
   - `DATABASE_URL` (URL de conexión del pooler de Supabase).
   - `DIRECT_URL` (URL de conexión directa, si corresponde).
   - `SUPABASE_JWT_SECRET` (Secreto del proyecto Supabase para verificar tokens).
4. Sincronizar Prisma:
   ```bash
   npx prisma generate
   ```
5. Iniciar servidor (corre en puerto 3000 por defecto):
   ```bash
   npm run start:dev
   ```

### 3. Configuración del Frontend
1. Navegar al directorio frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar entornos:
   - Los archivos en `src/environments/` apuntarán por defecto a `http://localhost:3000` (desarrollo) y a la URL real en producción.
4. Iniciar servidor (corre en puerto 4200 por defecto):
   ```bash
   ng serve
   ```

---

## Entornos y Despliegue

### Configuración CORS
El Backend está configurado con un modo estricto de CORS para proteger los endpoints. Solo responde a solicitudes de:
- `http://localhost:4200` y `http://localhost:3000` (Local)
- `https://olimpiafutbol5.com.ar` y `https://www.olimpiafutbol5.com.ar` (Producción)

### Variables del Frontend
Angular utiliza inyección de entornos mediante `angular.json` (`fileReplacements`).
- Ejecutando `ng build` se utilizará por defecto el perfil de producción y compilará con `environment.prod.ts`.
- Ejecutando `ng serve` (o `ng build --configuration development`) se utilizará `environment.ts`.

---

## Estructura de la Base de Datos (Prisma Schema)

Las entidades principales son:
- **Appointment:** Reserva individual (tiene fecha, estado, cancha y tipo).
- **FixedSlot:** Reserva recurrente semanal.
- **Setting:** Pares clave-valor para configuraciones globales.

Para realizar migraciones o cambios en el esquema:
```bash
cd backend
npx prisma db push
```
*(Nota: Para comandos como `db push` se debe asegurar usar una cadena de conexión con el modo de sesión `5432` activo)*.
