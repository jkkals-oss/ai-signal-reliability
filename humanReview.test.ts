import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReliability } from "./confidence";
import { openReview, recordHumanDecision, reopenWithEvidence } from "./humanReview";

const high = evaluateReliability({ quality: 1, completeness: 1, consistency: 1 });
const low = evaluateReliability({ quality: 0.8, completeness: 0.3, consistency: 0.9 });
const reviewer = { id: "reviewer-1", permissions: ["review:decide"] as const };
const timestamp = "2026-10-19T12:00:00.000Z";

test("HIGH reliability never auto-approves", () => {
  const record = openReview("case-1", high);
  assert.equal(record.status, "PENDING_REVIEW");
  assert.equal(high.signalReviewRecommended, false); // Independent policy still requires human decision.
  assert.equal(record.decisions.length, 0);
});

test("authorized human can approve with reason and attribution", () => {
  const result = recordHumanDecision(openReview("case-1", low), reviewer, "APPROVED", "Verified supporting document", timestamp);
  assert.equal(result.status, "CLOSED");
  assert.deepEqual(result.decisions[0], {
    reviewerId: "reviewer-1", disposition: "APPROVED", rationale: "Verified supporting document", recordedAt: timestamp,
  });
});

test("human can reject even a HIGH indicator", () => {
  const result = recordHumanDecision(openReview("case-2", high), reviewer, "REJECTED", "Independent control failed", timestamp);
  assert.equal(result.status, "CLOSED");
  assert.equal(result.decisions[0].disposition, "REJECTED");
});

test("unauthorized reviewer is rejected", () => {
  assert.throws(() => recordHumanDecision(openReview("case-3", low), {id: "guest", permissions: []}, "APPROVED", "Looks fine", timestamp), /not authorized/);
});

test("missing rationale and invalid timestamp are rejected", () => {
  const record = openReview("case-4", low);
  assert.throws(() => recordHumanDecision(record, reviewer, "APPROVED", " ", timestamp), /rationale/);
  assert.throws(() => recordHumanDecision(record, reviewer, "APPROVED", "Checked", "not-a-time"), /timestamp/);
});

test("request evidence blocks final disposition until re-review", () => {
  const initial = openReview("case-5", low);
  const waiting = recordHumanDecision(initial, reviewer, "MORE_EVIDENCE", "Need source documentation", timestamp);
  assert.equal(waiting.status, "AWAITING_EVIDENCE");
  assert.throws(() => recordHumanDecision(waiting, reviewer, "APPROVED", "Approved", timestamp), /not pending/);
  const reopened = reopenWithEvidence(waiting, high);
  assert.equal(reopened.status, "PENDING_REVIEW");
  assert.equal(reopened.decisions.length, 1);
  const closed = recordHumanDecision(reopened, reviewer, "REJECTED", "Documentation conflicts", timestamp);
  assert.equal(closed.decisions.length, 2);
  assert.equal(closed.status, "CLOSED");
});

test("closed cases cannot receive a second decision", () => {
  const closed = recordHumanDecision(openReview("case-6", low), reviewer, "REJECTED", "Insufficient evidence", timestamp);
  assert.throws(() => recordHumanDecision(closed, reviewer, "APPROVED", "Override", timestamp), /not pending/);
});

test("unknown disposition is rejected at runtime", () => {
  assert.throws(() => recordHumanDecision(openReview("case-7", low), reviewer, "UNKNOWN" as "APPROVED", "Test", timestamp), /Unknown/);
});
