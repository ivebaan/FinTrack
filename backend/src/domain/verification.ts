export type VerificationStatus =
  | "EMAIL_PENDING"
  | "TIN_PENDING"
  | "MANUAL_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type VerificationDecision = "APPROVED" | "REJECTED" | "SUSPENDED";

export function transitionStatus(
  current: VerificationStatus,
  decision: VerificationDecision,
  emailVerified: boolean
): VerificationStatus {
  if (!emailVerified && (decision === "APPROVED" || decision === "SUSPENDED")) {
    throw new Error("EMAIL_VERIFICATION_REQUIRED");
  }
  if (decision === "APPROVED") {
    if (current !== "TIN_PENDING" && current !== "MANUAL_REVIEW") {
      throw new Error("INVALID_VERIFICATION_TRANSITION");
    }
    return "APPROVED";
  }
  if (decision === "REJECTED") {
    if (current !== "TIN_PENDING" && current !== "MANUAL_REVIEW") {
      throw new Error("INVALID_VERIFICATION_TRANSITION");
    }
    return "REJECTED";
  }
  if (current !== "APPROVED" && current !== "MANUAL_REVIEW") {
    throw new Error("INVALID_VERIFICATION_TRANSITION");
  }
  return "SUSPENDED";
}
