# AI Signal Reliability

[![TypeScript Validation](https://github.com/jkkals-oss/ai-signal-reliability/actions/workflows/tests.yml/badge.svg)](https://github.com/jkkals-oss/ai-signal-reliability/actions/workflows/tests.yml)

An independent, lightweight TypeScript reference implementation showing how AI-enabled enterprise workflows can **make uncertainty explicit and route low-reliability evidence to human review**.

## Why this exists

AI models can generate confident interpretations even when the information supporting them is incomplete or contradictory. Decision-oriented products need explicit, testable boundaries between **interpreting evidence** and **authorizing action**.

This demo illustrates one deterministic screening rule. It does **not** use an LLM, validate the truth of its inputs, or make actual business decisions.

## The design

The function accepts three independently supplied, normalized values between 0 and 1:

- **Quality** — an illustrative measure of source trustworthiness
- **Completeness** — an illustrative measure of required information available
- **Consistency** — an illustrative measure of agreement among evidence

It multiplies them into a composite *indicator* and applies deliberately illustrative thresholds:

| Indicator | Status | Demo review flag |
| --- | --- | --- |
| >= 0.8 | HIGH | false |
| >= 0.5 and < 0.8 | REVIEW | true |
| < 0.5 | INSUFFICIENT | true |

The calculation is simple by design: a zero in any dimension drops the result to zero. The returned score is rounded to three decimals **after** threshold classification. These thresholds are **not empirically calibrated**, the factors are not necessarily statistically independent, and the result is **not a probability of correctness**.

**Important:** A `HIGH` result only means this *particular example rule* does not trigger review. It does not authorize payment, hiring, medical, or other consequential decisions. Production policy can require review regardless of this output.

## Example

```typescript
import { evaluateReliability } from "./confidence";

const result = evaluateReliability({
  quality: 0.9,
  completeness: 0.7,
  consistency: 0.9,
});
// { score: 0.567, status: "REVIEW", requiresHumanReview: true }
```

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run typecheck
npm test
```

The GitHub Actions workflow also runs type checking and tests on commits and pull requests.

## Design decisions and tradeoffs

1. **Deterministic gate, not LLM authority.** A typed function evaluates predefined inputs; it cannot independently authorize downstream actions.
2. **Fail on malformed inputs.** Non-finite and out-of-range values raise an explicit error instead of silently producing an apparently valid answer.
3. **Explicit uncertainty.** Low completeness or consistency reduces the indicator rather than being treated as absence of risk.
4. **Small and testable.** Node's built-in test runner covers expected outputs, missing evidence, invalid inputs, and boundary behavior.

## Scope and limitations

This is a **synthetic educational example**, not a validated production confidence model. The sample does not derive or calibrate input scores, authenticate provenance, detect contradictions directly, evaluate fairness, or implement authorization, auditing, privacy controls, or a complete human-review workflow. It only returns a review recommendation flag. An operational implementation needs domain-specific evidence collection, expert validation, monitoring, security, testing, and enforceable policy controls.

## Provenance

Independently written for public technical demonstration. It contains **no AdaptiHire production code, proprietary prompts, customer data, internal evaluations, or scoring algorithms**.
