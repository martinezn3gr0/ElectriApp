<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ElectriApp

Marketplace para conectar electricistas y clientes. React + Vite + Firebase + Express.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set:
   - `RESEND_API_KEY` — emails de proyecto completado
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — service account JSON (string) para Admin SDK (`/api/submit-review` y writes privilegiados)
3. Run the app:
   `npm run dev`

## Firebase Cloud Functions

La función `onReviewCreated` actualiza `rating` / `reviewCount` con privilegios de admin.

```bash
cd functions && npm install && npm run build
firebase deploy --only functions
```

## Scripts

- `npm run dev` — Express + Vite (puerto 3000)
- `npm run build` — build de frontend
- `npm run lint` — `tsc --noEmit`
