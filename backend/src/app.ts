import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import crypto from "node:crypto";
import { z } from "zod";
import { pool } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  sha256,
  randomToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "./auth.js";
import { writeAudit } from "./audit.js";
import { transitionStatus, type VerificationStatus } from "./domain/verification.js";
import { maskTin } from "./domain/tin.js";

type AuthedRequest = Request & {
  user?: { id: string; email: string };
  correlationId?: string;
};

export const app = express();
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.use((req, _res, next) => {
  (req as AuthedRequest).correlationId = crypto.randomUUID();
  next();
});

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  registeredBusinessName: z.string().min(2).max(200),
  businessTin: z.string().regex(/^\d{9,12}(-\d{5})?$/, "TIN format is invalid"),
  legalForm: z.enum(["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "NON_VAT_CORPORATION"]),
  businessAddress: z.string().min(5).max(500),
  taxClassification: z.enum(["NON_VAT"]),
  contactNumber: z.string().min(7).max(30),
  consentVersion: z.string().min(1).max(30),
  consentTimestamp: z.string().datetime()
});

app.post("/v1/auth/register", async (req: AuthedRequest, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT" });
  const input = parsed.data;
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [input.email.toLowerCase()]);
    if ((existing.rowCount ?? 0) > 0) {
      await db.query("ROLLBACK");
      return res.status(200).json({ message: "If the account is eligible, registration instructions were sent." });
    }
    const passwordHash = await hashPassword(input.password);
    const tinDigits = input.businessTin.replace(/\D/g, "");
    const emailCipher = input.email.toLowerCase();
    const user = await db.query(
      `INSERT INTO users (email, password_hash, consent_version, consent_at)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [emailCipher, passwordHash, input.consentVersion, input.consentTimestamp]
    );
    const userId = user.rows[0].id as string;
    const business = await db.query(
      `INSERT INTO businesses
       (registered_name, tin_ciphertext, tin_last_four, legal_form, address,
        tax_classification, contact_number, verification_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'EMAIL_PENDING')
       RETURNING id`,
      [input.registeredBusinessName, tinDigits, tinDigits.slice(-4), input.legalForm,
       input.businessAddress, input.taxClassification, input.contactNumber]
    );
    const tenantId = business.rows[0].id as string;
    await db.query(
      "INSERT INTO business_memberships (tenant_id,user_id,role) VALUES ($1,$2,'BUSINESS_OWNER')",
      [tenantId, userId]
    );
    const token = randomToken();
    await db.query(
      "INSERT INTO email_verification_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,now() + interval '24 hours')",
      [userId, sha256(token)]
    );
    await writeAudit(db, {
      actorId: userId,
      actorRole: "BUSINESS_OWNER",
      tenantId,
      action: "registration.created",
      resourceType: "business",
      resourceId: tenantId,
      outcome: "SUCCESS",
      correlationId: req.correlationId,
      safeDiff: { verificationStatus: "EMAIL_PENDING", tin: maskTin(tinDigits) }
    });
    await db.query("COMMIT");
    return res.status(201).json({
      message: "Registration received.",
      verificationStatus: "EMAIL_PENDING",
      nextStep: "Verify your email",
      tenantId
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
});

app.post("/v1/auth/verify-email", async (req: AuthedRequest, res) => {
  const token = z.string().min(20).safeParse(req.body?.token);
  if (!token.success) return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const found = await db.query(
      `SELECT t.id,t.user_id,b.id AS tenant_id,b.verification_status
       FROM email_verification_tokens t
       JOIN business_memberships m ON m.user_id=t.user_id
       JOIN businesses b ON b.id=m.tenant_id
       WHERE t.token_hash=$1 AND t.consumed_at IS NULL AND t.expires_at > now()
       FOR UPDATE`,
      [sha256(token.data)]
    );
    if ((found.rowCount ?? 0) !== 1) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
    }
    const row = found.rows[0];
    await db.query(
      "UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()),updated_at=now() WHERE id=$1",
      [row.user_id]
    );
    await db.query("UPDATE email_verification_tokens SET consumed_at=now() WHERE id=$1", [row.id]);
    await db.query("UPDATE businesses SET verification_status='TIN_PENDING',updated_at=now() WHERE id=$1", [row.tenant_id]);
    await db.query(
      "INSERT INTO verification_transitions (tenant_id,from_status,to_status,reason_code,actor_id) VALUES ($1,'EMAIL_PENDING','TIN_PENDING','EMAIL_VERIFIED',$2)",
      [row.tenant_id, row.user_id]
    );
    await writeAudit(db, {
      actorId: row.user_id,
      actorRole: "BUSINESS_OWNER",
      tenantId: row.tenant_id,
      action: "email.verified",
      resourceType: "business",
      resourceId: row.tenant_id,
      outcome: "SUCCESS",
      correlationId: req.correlationId,
      safeDiff: { before: "EMAIL_PENDING", after: "TIN_PENDING" }
    });
    await db.query("COMMIT");
    return res.json({ verificationStatus: "TIN_PENDING", nextStep: "Complete business and tax profile review" });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
});

app.post("/v1/auth/login", async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(12) }).safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  const found = await pool.query("SELECT id,email,password_hash,email_verified_at FROM users WHERE email=$1", [parsed.data.email.toLowerCase()]);
  if ((found.rowCount ?? 0) !== 1 || !(await verifyPassword(found.rows[0].password_hash, parsed.data.password))) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }
  const user = found.rows[0];
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const refreshToken = await signRefreshToken({ sub: user.id, sessionId: crypto.randomUUID() });
    const sessionId = (await verifyRefreshToken(refreshToken)).payload.sessionId as string;
    const session = await db.query(
      "INSERT INTO refresh_sessions (id,user_id,refresh_hash,expires_at) VALUES ($1,$2,$3,now()+interval '30 days') RETURNING id",
      [sessionId, user.id, sha256(refreshToken)]
    );
    await db.query("COMMIT");
    return res.json({
      accessToken: await signAccessToken({ sub: user.id, email: user.email }),
      refreshToken
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
});

app.post("/v1/auth/refresh", async (req, res) => {
  const parsed = z.object({ refreshToken: z.string().min(20) }).safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: "SESSION_INVALID" });
  try {
    const payload = await verifyRefreshToken(parsed.data.refreshToken);
    const sub = String(payload.payload.sub);
    const sessionId = String(payload.payload.sessionId);
    const found = await pool.query(
      "SELECT id,user_id FROM refresh_sessions WHERE id=$1 AND user_id=$2 AND refresh_hash=$3 AND revoked_at IS NULL AND expires_at>now()",
      [sessionId, sub, sha256(parsed.data.refreshToken)]
    );
    if ((found.rowCount ?? 0) !== 1) return res.status(401).json({ error: "SESSION_INVALID" });
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const newRefreshToken = await signRefreshToken({ sub, sessionId: crypto.randomUUID() });
      const replacementId = (await verifyRefreshToken(newRefreshToken)).payload.sessionId as string;
      const replacement = await db.query(
        "INSERT INTO refresh_sessions (id,user_id,refresh_hash,expires_at) VALUES ($1,$2,$3,now()+interval '30 days') RETURNING id",
        [replacementId, sub, sha256(newRefreshToken)]
      );
      await db.query("UPDATE refresh_sessions SET revoked_at=now(),replaced_by=$1 WHERE id=$2", [replacement.rows[0].id, sessionId]);
      await db.query("COMMIT");
      const user = await pool.query("SELECT id,email FROM users WHERE id=$1", [sub]);
      return res.json({
        accessToken: await signAccessToken({ sub, email: user.rows[0].email }),
        refreshToken: newRefreshToken
      });
    } finally {
      db.release();
    }
  } catch {
    return res.status(401).json({ error: "SESSION_INVALID" });
  }
});

app.post("/v1/auth/logout", requireAuth, async (req: AuthedRequest, res) => {
  const refreshToken = z.string().min(20).safeParse(req.body?.refreshToken);
  if (!refreshToken.success) return res.status(400).json({ error: "INVALID_INPUT" });
  await pool.query(
    "UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND refresh_hash=$2 AND revoked_at IS NULL",
    [req.user!.id, sha256(refreshToken.data)]
  );
  return res.status(204).send();
});

app.post("/v1/auth/logout-all", requireAuth, async (req: AuthedRequest, res) => {
  await pool.query(
    "UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",
    [req.user!.id]
  );
  return res.status(204).send();
});

app.post("/v1/auth/password-reset/request", async (req: AuthedRequest, res) => {
  const email = z.string().email().safeParse(req.body?.email);
  if (!email.success) return res.status(200).json({ message: "If an eligible account exists, reset instructions were sent." });
  const found = await pool.query("SELECT id FROM users WHERE email=$1", [email.data.toLowerCase()]);
  if ((found.rowCount ?? 0) === 1) {
    const token = randomToken();
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,now()+interval '30 minutes')",
      [found.rows[0].id, sha256(token)]
    );
  }
  return res.status(200).json({ message: "If an eligible account exists, reset instructions were sent." });
});

app.post("/v1/auth/password-reset/confirm", async (req: AuthedRequest, res) => {
  const parsed = z.object({
    token: z.string().min(20),
    password: z.string().min(12).max(128)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const found = await db.query(
      "SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
      [sha256(parsed.data.token)]
    );
    if ((found.rowCount ?? 0) !== 1) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await db.query("UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2", [passwordHash, found.rows[0].user_id]);
    await db.query("UPDATE password_reset_tokens SET consumed_at=now() WHERE id=$1", [found.rows[0].id]);
    await db.query("UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL", [found.rows[0].user_id]);
    await db.query("COMMIT");
    return res.json({ message: "Password reset. Please sign in again." });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
});

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return res.status(401).json({ error: "UNAUTHENTICATED" });
  try {
    const payload = await verifyAccessToken(authorization.slice(7));
    req.user = { id: String(payload.payload.sub), email: String(payload.payload.email) };
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}

app.get("/v1/me", requireAuth, async (req: AuthedRequest, res) => {
  const memberships = await pool.query(
    `SELECT b.id AS tenant_id,b.registered_name,b.verification_status,m.role
     FROM business_memberships m JOIN businesses b ON b.id=m.tenant_id
     WHERE m.user_id=$1 AND m.active=true`,
    [req.user!.id]
  );
  return res.json({
    id: req.user!.id,
    email: req.user!.email,
    businesses: memberships.rows.map((row) => ({
      tenantId: row.tenant_id,
      name: row.registered_name,
      role: row.role,
      verificationStatus: row.verification_status
    }))
  });
});

app.post("/v1/verifications/resubmit", requireAuth, async (req: AuthedRequest, res) => {
  const tenantId = req.header("x-tenant-id");
  if (!tenantId) return res.status(403).json({ error: "FORBIDDEN" });
  const membership = await pool.query(
    "SELECT role FROM business_memberships WHERE tenant_id=$1 AND user_id=$2 AND active=true",
    [tenantId, req.user!.id]
  );
  if ((membership.rowCount ?? 0) !== 1 || membership.rows[0].role !== "BUSINESS_OWNER") {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  const schema = z.object({
    adapter: z.enum(["TIN", "TAXPAYER_IDENTITY", "BUSINESS_REGISTRATION", "TAX_CLASSIFICATION"]),
    reason: z.string().max(500).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT" });
  const result = await pool.query(
    `UPDATE businesses SET verification_status='MANUAL_REVIEW',updated_at=now()
     WHERE id=$1 AND verification_status IN ('TIN_PENDING','REJECTED','SUSPENDED')
     RETURNING verification_status`
  , [tenantId]);
  if ((result.rowCount ?? 0) !== 1) return res.status(409).json({ error: "INVALID_VERIFICATION_TRANSITION" });
  await pool.query(
    "INSERT INTO verification_requests (tenant_id,requested_state,adapter,outcome,notes) VALUES ($1,'MANUAL_REVIEW',$2,'PENDING',$3)",
    [tenantId, parsed.data.adapter, parsed.data.reason ?? null]
  );
  return res.json({ verificationStatus: "MANUAL_REVIEW" });
});

async function requireTenant(req: AuthedRequest, res: Response, next: NextFunction) {
  const tenantId = req.header("x-tenant-id");
  if (!tenantId) return res.status(403).json({ error: "FORBIDDEN" });
  const found = await pool.query(
    "SELECT role FROM business_memberships WHERE tenant_id=$1 AND user_id=$2 AND active=true",
    [tenantId, req.user!.id]
  );
  if ((found.rowCount ?? 0) !== 1) return res.status(403).json({ error: "FORBIDDEN" });
  (req as AuthedRequest & { tenantId: string; role: string }).tenantId = tenantId;
  (req as AuthedRequest & { tenantId: string; role: string }).role = found.rows[0].role;
  next();
}

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  reasonCode: z.enum(["DOCUMENT_MATCH", "DOCUMENT_MISMATCH", "MANUAL_REQUIRED", "FRAUD_RISK", "APPEAL_APPROVED"])
});

app.get("/v1/admin/verifications", requireAuth, requireTenant, async (req: Request, res) => {
  const tenantReq = req as AuthedRequest & { tenantId: string; role: string };
  if (tenantReq.role !== "SYSTEM_ADMINISTRATOR") return res.status(403).json({ error: "FORBIDDEN" });
  const result = await pool.query(
    `SELECT b.id AS tenant_id,b.registered_name,b.verification_status,
            b.verification_reason_code,b.verification_notes,b.updated_at,
            ('•••-•••-' || b.tin_last_four) AS masked_tin
     FROM businesses b
     WHERE b.id=$1
     ORDER BY b.updated_at DESC`,
    [tenantReq.tenantId]
  );
  return res.json({ items: result.rows, page: 1, pageSize: 50 });
});

app.post("/v1/admin/verifications/:tenantId/decision", requireAuth, requireTenant, async (req: Request, res) => {
  const tenantReq = req as AuthedRequest & { tenantId: string; role: string };
  if (tenantReq.role !== "SYSTEM_ADMINISTRATOR") return res.status(403).json({ error: "FORBIDDEN" });
  if (req.params.tenantId !== tenantReq.tenantId) return res.status(403).json({ error: "FORBIDDEN" });
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT" });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const found = await db.query(
      `SELECT b.verification_status,u.email_verified_at
       FROM businesses b
       JOIN business_memberships m ON m.tenant_id=b.id
       JOIN users u ON u.id=m.user_id
       WHERE b.id=$1 AND m.role='BUSINESS_OWNER'
       FOR UPDATE`,
      [tenantReq.tenantId]
    );
    if ((found.rowCount ?? 0) !== 1) {
      await db.query("ROLLBACK");
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    const row = found.rows[0];
    const nextStatus = transitionStatus(row.verification_status as VerificationStatus, parsed.data.decision, Boolean(row.email_verified_at));
    await db.query(
      "UPDATE businesses SET verification_status=$1,verification_reason_code=$2,verification_notes=NULL,updated_at=now() WHERE id=$3",
      [nextStatus, parsed.data.reasonCode, tenantReq.tenantId]
    );
    if (nextStatus === "APPROVED") {
      await db.query(
        `UPDATE businesses
         SET trial_started_at=COALESCE(trial_started_at,now()),
             trial_expires_at=COALESCE(trial_expires_at,now()+interval '7 days')
         WHERE id=$1`,
        [tenantReq.tenantId]
      );
    }
    await db.query(
      "INSERT INTO verification_transitions (tenant_id,from_status,to_status,reason_code,actor_id) VALUES ($1,$2,$3,$4,$5)",
      [tenantReq.tenantId, row.verification_status, nextStatus, parsed.data.reasonCode, tenantReq.user!.id]
    );
    await writeAudit(db, {
      actorId: tenantReq.user!.id,
      actorRole: tenantReq.role,
      tenantId: tenantReq.tenantId,
      action: "verification.decision",
      resourceType: "business",
      resourceId: tenantReq.tenantId,
      outcome: "SUCCESS",
      reason: parsed.data.reasonCode,
      correlationId: tenantReq.correlationId,
      safeDiff: { before: row.verification_status, after: nextStatus }
    });
    await db.query("COMMIT");
    return res.json({ verificationStatus: nextStatus });
  } catch (error) {
    await db.query("ROLLBACK");
    if (error instanceof Error && ["EMAIL_VERIFICATION_REQUIRED", "INVALID_VERIFICATION_TRANSITION"].includes(error.message)) {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  } finally {
    db.release();
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("request_failed", err instanceof Error ? err.name : "UNKNOWN");
  res.status(500).json({ error: "INTERNAL_ERROR" });
});
