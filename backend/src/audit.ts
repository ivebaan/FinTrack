import crypto from "node:crypto";
import type { PoolClient } from "pg";

export async function writeAudit(
  db: PoolClient,
  input: {
    actorId?: string;
    actorRole?: string;
    tenantId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome: "SUCCESS" | "DENIED" | "FAILED";
    reason?: string;
    correlationId?: string;
    safeDiff?: Record<string, unknown>;
  }
) {
  await db.query(
    `INSERT INTO audit_events
      (actor_id, actor_role, tenant_id, action, resource_type, resource_id,
       outcome, reason, correlation_id, safe_diff)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      input.actorId ?? null,
      input.actorRole ?? null,
      input.tenantId ?? null,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.outcome,
      input.reason ?? null,
      input.correlationId ?? crypto.randomUUID(),
      input.safeDiff ?? {}
    ]
  );
}
