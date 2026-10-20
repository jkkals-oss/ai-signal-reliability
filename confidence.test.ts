import test from "node:test";
import assert from "node:assert/strict";
import { evaluateReliability } from "./confidence";

test("strong evidence receives HIGH indicator without triggering this review rule", () => {
  const result = evaluateReliability({
    quality: 0.95, completeness: 0.95, consistency: 0.95,
  });
  assert.equal(result.status, "HIGH");
  assert.equal(result.score, 0.857);
  assert.equal(result.signalReviewRecommended, false);
});

test("partially complete evidence requires review", () => {
  const result = evaluateReliability({
    quality: 0.9, completeness: 0.7, consistency: 0.9,
  });
  assert.equal(result.status, "REVIEW");
  assert.equal(result.signalReviewRecommended, true);
});

test("missing evidence yields insufficient reliability", () => {
  const result = evaluateReliability({
    quality: 0.9, completeness: 0, consistency: 0.9,
  });
  assert.equal(result.score, 0);
  assert.equal(result.status, "INSUFFICIENT");
  assert.equal(result.signalReviewRecommended, true);
});

test("contradictory evidence represented by zero consistency is insufficient", () => {
  const result = evaluateReliability({
    quality: 1, completeness: 1, consistency: 0,
  });
  assert.equal(result.status, "INSUFFICIENT");
});

test("NaN and infinite values are rejected", () => {
  for (const quality of [NaN, Infinity, -Infinity]) {
    assert.throws(() => evaluateReliability({
      quality, completeness: 0.9, consistency: 0.9,
    }), RangeError);
  }
});

test("out-of-range values are rejected", () => {
  for (const quality of [-0.01, 1.01]) {
    assert.throws(() => evaluateReliability({
      quality, completeness: 0.9, consistency: 0.9,
    }), RangeError);
  }
});

test("threshold boundaries are deterministic", () => {
  assert.equal(evaluateReliability({quality: 0.8, completeness: 1, consistency: 1}).status, "HIGH");
  assert.equal(evaluateReliability({quality: 0.5, completeness: 1, consistency: 1}).status, "REVIEW");
  assert.equal(evaluateReliability({quality: 0.499, completeness: 1, consistency: 1}).status, "INSUFFICIENT");
});
