# Habit Tracker — Backend (NestJS)

## Setup

```bash
npm install
cp .env.example .env
# edit .env: DATABASE_URL, JWT secrets, GOOGLE_CLIENT_ID/SECRET,
# WHATSAPP_SESSION_ENCRYPTION_KEY (32-byte hex — generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# )

npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed   # creates thafsi@example.com / naju@example.com (password123)

npm run start:dev
```

API listens on `http://localhost:3000` by default.

## Verification (run these locally — this sandbox has no network access)

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test
npx prisma validate
```

## Notes

- **WhatsApp sessions** are persisted in Postgres (`WhatsAppSession` /
  `WhatsAppSessionKey` tables), encrypted at rest with
  `WHATSAPP_SESSION_ENCRYPTION_KEY`, so they survive backend restarts —
  this replaces Baileys' default on-disk `useMultiFileAuthState`.
- **Swapping to the Meta Cloud API later**: implement `WhatsAppProvider`
  (see `src/whatsapp/whatsapp-provider.interface.ts`) in a new
  `MetaWhatsAppProvider`, then change the `useClass` binding in
  `whatsapp.module.ts`. Nothing in `NotificationsService` or the scheduler
  needs to change.
- **Email invitations** currently log to the console
  (`src/invitations/email.service.ts`) since no SMTP/API provider was
  specified. Swap the body of `EmailService.send` for a real provider.
- Every mutating endpoint resolves the authenticated user from the JWT
  (never a client-supplied `userId`) and checks tracker membership/role via
  `AuthorizationService` before touching data — see
  `src/common/authorization.service.ts`.
