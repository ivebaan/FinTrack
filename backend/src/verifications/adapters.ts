export interface VerificationResult {
  outcome: "PENDING" | "MATCH" | "MISMATCH" | "REVIEW_REQUIRED";
  reasonCode?: string;
  evidenceRedacted: true;
}

export function verifyTin(_tenantId: string, _tin: string): VerificationResult {
  return { outcome: "REVIEW_REQUIRED", reasonCode: "MANUAL_REQUIRED", evidenceRedacted: true };
}

export function verifyTaxpayerIdentity(_tenantId: string): VerificationResult {
  return { outcome: "REVIEW_REQUIRED", reasonCode: "MANUAL_REQUIRED", evidenceRedacted: true };
}

export function verifyBusinessRegistration(_tenantId: string): VerificationResult {
  return { outcome: "REVIEW_REQUIRED", reasonCode: "MANUAL_REQUIRED", evidenceRedacted: true };
}

export function verifyTaxClassification(_tenantId: string): VerificationResult {
  return { outcome: "REVIEW_REQUIRED", reasonCode: "MANUAL_REQUIRED", evidenceRedacted: true };
}
