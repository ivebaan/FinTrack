# FinTrack System Architecture

## Trust boundaries

```text
React Native client
  |  HTTPS + bearer token + active tenant
REST API (Node.js/TypeScript)
  |  membership/RBAC, Zod validation, idempotency, audit
PostgreSQL

Private receipt storage (future) <-> malware scanner -> signed URL worker
Email provider (verification/reset)
```

The API is the authority for roles, memberships, totals, statuses, verification decisions, dates and trial timestamps. A mobile UI state is never authorization evidence.

## Runtime components

- **API**: Express HTTP routes, PostgreSQL repositories, JWT access tokens and rotating refresh sessions.
- **Workers**: idempotent jobs for email, verification adapters, malware scanning and expiry handling.
- **Mobile**: Expo/React Native; secure refresh-token storage; verification and next-action states delivered by API.
- **Database**: PostgreSQL with tenant composite keys, `NUMERIC(20,6)` ledger/money values and append-only audit tables.
- **Private storage**: S3-compatible object store; only short-lived signed URLs are returned for authorized downloads.

## PostgreSQL isolation

Every tenant-owned table contains `tenant_id NOT NULL`. Parent-to-child foreign keys include the tenant key:

```sql
FOREIGN KEY (tenant_id, customer_id)
  REFERENCES customers (tenant_id, id)
```

Every read and mutation includes `tenant_id`, never just a record ID. API middleware requires an active membership and an explicit tenant header. Composite uniqueness prevents duplicate tenant-local references.

## Authorization

Roles are `BUSINESS_OWNER`, `ACCOUNTANT_BOOKKEEPER`, `EMPLOYEE`, and `SYSTEM_ADMINISTRATOR`. Permissions are stored in `role_permissions` and are checked server-side for each operation. Unknown tenants, inaccessible tenants and missing memberships return the same deny response.

## Money and Manila time

Persisted money is `NUMERIC(20,6)` and API values are decimal strings. The client uses decimal-string-safe formatting and never JavaScript binary floating point for persisted values. Line totals, document totals and tax calculations use explicit half-up rules; historical tax snapshots retain their effective-dated rule version.

Business dates and deadlines are interpreted in `Asia/Manila`. UTC timestamps are stored internally. Trial start is set once by a database transaction after server approval.

## Verification state machine

```text
EMAIL_PENDING
  -> TIN_PENDING
  -> MANUAL_REVIEW (if configured)
  -> APPROVED
  -> REJECTED

APPROVED -> SUSPENDED
REJECTED -> TIN_PENDING or MANUAL_REVIEW (resubmission)
SUSPENDED -> MANUAL_REVIEW (appeal)
```

Every transition is atomic and writes an append-only audit event. Email verification cannot grant approval. Trial activation is server-generated, idempotent and occurs only at the first approval commit.

## Priority 1 API

- `POST /v1/auth/register`
- `POST /v1/auth/verify-email`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/auth/logout-all`
- `GET /v1/me`
- `POST /v1/verifications/resubmit`
- `POST /v1/admin/verifications/:id/decision`
- `GET /v1/admin/verifications`
