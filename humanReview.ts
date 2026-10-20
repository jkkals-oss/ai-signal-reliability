import type { ReliabilityResult } from "./confidence";

export type ReviewDisposition = "APPROVED" | "REJECTED" | "MORE_EVIDENCE";
export type ReviewStatus = "PENDING_REVIEW" | "AWAITING_EVIDENCE" | "CLOSED";
export type ReviewRecord = Readonly<{
  caseId: string;
  status: ReviewStatus;
  reliability: ReliabilityResult;
  decisions: ReadonlyArray<ReviewDecision>;
}>;
export type ReviewDecision = Readonly<{
  reviewerId: string;
  disposition: ReviewDisposition;
  rationale: string;
  recordedAt: string;
}>;
export type Reviewer = Readonly<{
  id: string;
  permissions: ReadonlyArray<"review:decide">;
}>;

/** Example case state. No automated approval is possible, even for HIGH reliability. */
export function openReview(caseId: string, reliability: ReliabilityResult): ReviewRecord {
  if (!caseId.trim()) throw new Error("A case identifier is required");
  return { caseId, status: "PENDING_REVIEW", reliability, decisions: [] };
}

/**
 * Pure, in-memory example; caller authenticates the reviewer and supplies time.
 * A production system must enforce identity, durable audit storage and concurrent writes.
 */
export function recordHumanDecision(
  record: ReviewRecord,
  reviewer: Reviewer,
  disposition: ReviewDisposition,
  rationale: string,
  recordedAt: string,
): ReviewRecord {
  if (!reviewer.id.trim() || !reviewer.permissions.includes("review:decide")) {
    throw new Error("Reviewer is not authorized");
  }
  if (!rationale.trim()) throw new Error("A decision rationale is required");
  if (!Number.isFinite(Date.parse(recordedAt))) throw new Error("Valid decision timestamp required");
  if (record.status !== "PENDING_REVIEW") throw new Error("Case is not pending human review");
  if (!["APPROVED", "REJECTED", "MORE_EVIDENCE"].includes(disposition)) {
    throw new Error("Unknown review disposition");
  }

  const decision: ReviewDecision = {
    reviewerId: reviewer.id,
    disposition,
    rationale: rationale.trim(),
    recordedAt,
  };
  return {
    ...record,
    status: disposition === "MORE_EVIDENCE" ? "AWAITING_EVIDENCE" : "CLOSED",
    decisions: [...record.decisions, decision],
  };
}

/** Submission of additional evidence reopens review; it does not imply approval. */
export function reopenWithEvidence(record: ReviewRecord, reliability: ReliabilityResult): ReviewRecord {
  if (record.status !== "AWAITING_EVIDENCE") {
    throw new Error("Additional evidence can only reopen a case awaiting evidence");
  }
  return { ...record, reliability, status: "PENDING_REVIEW" };
}
