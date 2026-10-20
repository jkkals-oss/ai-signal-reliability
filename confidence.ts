/**
 * Standalone, synthetic illustration of deterministic reliability screening.
 * These inputs are assumed normalized; this code does not validate source truth.
 * Scores are indicators, not probabilities or authorization decisions.
 */
export type EvidenceSignals = Readonly<{
  quality: number;
  completeness: number;
  consistency: number;
}>;

export type ReliabilityResult = Readonly<{
  score: number;
  status: "HIGH" | "REVIEW" | "INSUFFICIENT";
  requiresHumanReview: boolean;
}>;

export function evaluateReliability(signals: EvidenceSignals): ReliabilityResult {
  const values = [signals.quality, signals.completeness, signals.consistency];

  if (values.some(value => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new RangeError("Evidence signals must be finite numbers between 0 and 1.");
  }

  // Deliberately simple model, chosen for explainability rather than calibration.
  // A zero on any dimension produces a zero composite indicator.
  const score = signals.quality * signals.completeness * signals.consistency;
  const status: ReliabilityResult["status"] =
    score >= 0.8 ? "HIGH" : score >= 0.5 ? "REVIEW" : "INSUFFICIENT";

  return {
    score: Math.round(score * 1000) / 1000,
    status,
    requiresHumanReview: status !== "HIGH",
  };
}
