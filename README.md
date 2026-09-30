# ElectriApp

Marketplace para conectar electricistas y clientes.

**Stack:** React 19 · Vite · Firebase Auth/Firestore · Express · Resend · Cloud Functions

## Requisitos

- Node.js 20+
- Proyecto Firebase (Auth + Firestore)
- Service account de Firebase (Admin SDK)
- (Opcional) API key de Resend para emails

## Setup local

```bash
npm install
cp .env.example .env
# Completa FIREBASE_SERVICE_ACCOUNT_JSON y RESEND_API_KEY
npm run dev
```

Abre http://localhost:3000

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (string) para Admin SDK |
| `GOOGLE_APPLICATION_CREDENTIALS` | Alternativa: path al JSON del service account |
| `RESEND_API_KEY` | Envío de emails de proyecto completado |
| `RESEND_FROM_EMAIL` | Remitente verificado (prod) |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma (**requerido en producción**) |
| `PORT` | Puerto del server (default `3000`) |
| `NODE_ENV` | `production` / `development` |

## Producción

```bash
npm run build
NODE_ENV=production CORS_ORIGINS=https://tu-dominio.com npm start
```

Despliegue Firebase:

```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting,functions
```

Cloud Functions (`functions/`):

- `onReviewCreated` — agrega ratings con privilegios
- `onUserWritten` — sincroniza `publicProfiles` sin email

```bash
cd functions && npm install && npm run build
firebase deploy --only functions
```

### Checklist de producción

1. Desplegar `firestore.rules` e índices
2. Configurar `CORS_ORIGINS` y `RESEND_FROM_EMAIL` con dominio verificado
3. Restringir dominios autorizados en Firebase Auth / App Check
4. Admin: asignar custom claim `{ "admin": true }` (ya no hay email hardcodeado)
5. Verificar `/api/health`

## Seguridad (modelo de datos)

- `users/{uid}` — perfil privado (incluye email); solo el dueño lee/escribe
- `publicProfiles/{uid}` — tarjeta pública **sin email**
- Reseñas y ratings solo vía Admin SDK (`/api/submit-review`) / Cloud Functions
- Mensajes solo entre partes del proyecto
- Rol e email **inmutables** tras el alta

## Scripts

- `npm run dev` — Express + Vite (puerto 3000)
- `npm run build` — build frontend
- `npm start` — server producción (sirve `dist/`)
- `npm run lint` — TypeScript check
- `npm test` — tests unitarios (sanitización)

## API

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /api/health` | No | Health check |
| `POST /api/submit-review` | Bearer ID token | Crear reseña + actualizar rating |
| `POST /api/send-completion-email` | Bearer ID token | Notificar completado |
