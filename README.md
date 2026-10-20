# AI Signal Reliability

[![TypeScript Validation](https://github.com/jkkals-oss/ai-signal-reliability/actions/workflows/tests.yml/badge.svg)](https://github.com/jkkals-oss/ai-signal-reliability/actions/workflows/tests.yml)

A small TypeScript demonstration of how evidence reliability can be made explicit **before a human or a governed workflow makes a decision**. Inspired by R&D on [AdaptiHire.ai](https://adaptihire.ai), developed by Jasleen Kals; the code here is independently written and domain-neutral.

## Decision Philosophy in the Age of AI

AI is changing how we interpret information, evaluate options, and make decisions. But better intelligence doesn't automatically produce better decisions.

I believe the value of AI lies not simply in automating decisions, but in improving the quality, speed, and consistency of human judgment.

That requires designing systems that distinguish between **what is known, what is inferred, what remains uncertain, and who has the authority to act.**

My approach to building intelligent products follows four principles:

1. **Intelligence informs; authority is designed.** AI can interpret evidence and recommend actions, but decision rights should be explicit.
2. **Uncertainty is a product signal.** Missing, contradictory, or low-confidence information should be surfaced, not concealed behind a definitive answer.
3. **Human judgment is part of the architecture.** Human oversight should be embedded into decision workflows, not treated as an exception when automation fails.
4. **Intelligence must produce measurable value.** The objective isn't more AI. It's better decisions, less operational friction, and improved business outcomes.

This philosophy informs my work on AdaptiHire.ai and the broader challenge of designing intelligent enterprise products.

The code below demonstrates two narrow parts of that thinking: a transparent reliability calculation and a separate, human-attributed review decision flow. It does not implement AI interpretation or real-world authorization and execution.

## The product problem

As AI systems take on more interpretation and decision-support work, product teams face a tradeoff: **automate too aggressively and uncertain evidence can become consequential action; require human approval for every low-risk step and the operating cost rises.** The product challenge is to improve decision quality without adding unnecessary friction.

That requires two distinct controls: a **signal-level recommendation** about evidence reliability and a **policy-level decision** about who is permitted to act. A strong signal does not override mandatory approval requirements.

In a real product, I would evaluate this tradeoff through decision quality, exception rates, review time, cost per decision, and traceability. These are proposed success measures, **not outcomes claimed for this demonstration**.

## What this implementation demonstrates

Two small, independently written TypeScript modules: [`confidence.ts`](confidence.ts), a deterministic evidence-reliability indicator, and [`humanReview.ts`](humanReview.ts), a human-review state machine. The model does **not** generate or verify evidence, authenticate people, persist decisions, or make real-world decisions.

## The design

The function accepts three independently supplied, normalized values between 0 and 1:

- **Quality** — an illustrative measure of source trustworthiness
- **Completeness** — an illustrative measure of required information available
- **Consistency** — an illustrative measure of agreement among evidence

It multiplies them into a composite *indicator* and applies illustrative thresholds to return a review **flag**. The output flag is advisory. The separate human-review example illustrates a policy that requires an explicitly recorded human decision regardless of the reliability category:

| Indicator | Status | Signal recommends additional review |
| --- | --- | --- |
| >= 0.8 | HIGH | false |
| >= 0.5 and < 0.8 | REVIEW | true |
| < 0.5 | INSUFFICIENT | true |

The calculation is simple by design: a zero in any dimension drops the result to zero. The returned score is rounded to three decimals **after** threshold classification. These thresholds are **not empirically calibrated**, the factors are not necessarily statistically independent, and the result is **not a probability of correctness**.

**Important:** A `HIGH` result only means this *particular example rule* does not trigger review. It does not authorize payment, hiring, medical, or other consequential decisions. Production policy can require review regardless of this output.

## Reliability example

```typescript
import { evaluateReliability } from "./confidence";

const result = evaluateReliability({
  quality: 0.9,
  completeness: 0.7,
  consistency: 0.9,
});
// { score: 0.567, status: "REVIEW", signalReviewRecommended: true }
```

## Human-in-the-loop demonstration

The separate `humanReview.ts` module models a small in-memory case workflow where **policy requires human approval of every case**, even if the signal-level check does not recommend additional review:

```text
Evidence indicator (HIGH / REVIEW / INSUFFICIENT)
   ↓
Case opened → PENDING_REVIEW
   ↓
Reviewer with a supplied decision permission records a rationale
   ├── APPROVED → CLOSED
   ├── REJECTED → CLOSED
   └── MORE_EVIDENCE → AWAITING_EVIDENCE
                                  ↓
                       Additional evidence submitted
                                  ↓
                             PENDING_REVIEW
```

For example:

```typescript
import { openReview, recordHumanDecision } from "./humanReview";

const review = openReview("demo-case", result);
const reviewed = recordHumanDecision(
  review,
  { id: "example-reviewer", permissions: ["review:decide"] },
  "MORE_EVIDENCE",
  "Supporting source record is missing",
  "2026-10-19T12:00:00.000Z",
);
// reviewed.status === "AWAITING_EVIDENCE"
```

A `HIGH` indicator **never automatically approves a case**. The advisory `signalReviewRecommended` field is not an authorization policy: `openReview` requires human decision-making for every opened case. A reviewer can also reject a case with high reliability based on other information. The sample records reviewer ID, decision, reason, and timestamp, and rejects reviewers lacking the supplied permission as well as invalid state transitions.

This is **illustrative authorization using supplied reviewer attributes**, not authenticated access control. Records are in memory, not a durable audit system. A production deployment would need verified identity, server-side permissions, persistence, and concurrency controls.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run typecheck
npm test
```

The GitHub Actions workflow is configured to run type checking and tests on commits and pull requests. Check the Actions tab for the latest execution result.

## Design decisions and tradeoffs

1. **Deterministic gate, not LLM authority.** A typed function evaluates predefined inputs; it cannot independently authorize downstream actions.
2. **Fail on malformed inputs.** Non-finite and out-of-range values raise an explicit error instead of silently producing an apparently valid answer.
3. **Explicit uncertainty.** Low completeness or consistency reduces the indicator rather than being treated as absence of risk.
4. **Keep recommendation separate from authority.** `signalReviewRecommended` is advisory; the example's independent policy requires a human disposition for every opened case. Humans can approve, reject, or request evidence, with a reason recorded.
5. **Small and testable.** Node's built-in test runner covers reliability boundaries, invalid inputs, authorization checks, decision history, and invalid state transitions.

## Origin, portability and boundaries

This illustrative method is inspired by **[AdaptiHire.ai](https://adaptihire.ai)**, a hiring decision intelligence R&D product in development by **Jasleen Kals**. The design principle—separating interpreted signals, uncertainty, policy and human authority—can apply to payments, enterprise operations, or other evidence-driven workflows without transferring hiring-specific logic.

This is **one synthetic technical artifact, not AdaptiHire's complete system or production methodology**. It includes no AdaptiHire proprietary source code or internal evaluation logic. It does not run an LLM, authenticate reviewers, enforce a production permission model, or durably store decisions. Scores and thresholds are illustrative, not validated probabilities; real deployment would require domain validation and operational controls.
