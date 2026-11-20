# FinTrack

FinTrack is a mobile-first bookkeeping and tax-compliance tracking application for Philippine non-VAT micro and small businesses. It is not a registered tax practitioner, a guarantee of BIR compliance, or a direct BIR e-filing/e-invoicing system.

## Monorepo

- `backend/` - Node.js/TypeScript REST API, PostgreSQL, tenant authorization, audit and verification lifecycle.
- `mobile/` - React Native (Expo) application with secure token storage and state-aware onboarding.
- `docs/architecture.md` - system boundaries and data invariants.

## Initial implementation

The first release foundation implements:

- tenant memberships and server-enforced RBAC;
- fixed-precision PHP amounts and Asia/Manila date handling;
- append-only audit events with TIN masking;
- email verification and approval state machine;
- registration, pending-state dashboard, and modular verification API stubs;
- 7-day server-committed trial activation.

## Run

```powershell
npm install
Copy-Item backend/.env.example backend/.env
npm run backend:dev
npm run mobile:start
```

PostgreSQL must be running and `DATABASE_URL` must point to a database. Apply `backend/migrations/001_priority0_priority1.sql` before starting.
