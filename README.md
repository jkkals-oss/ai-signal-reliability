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

The code below demonstrates a narrow part of that thinking: a transparent calculation that flags when additional human review may be warranted. It does not implement AI interpretation, human approval, or decision execution.

## Why this exists

AI models can generate confident interpretations even when the information supporting them is incomplete or contradictory. Decision-oriented products need explicit, testable boundaries between **interpreting evidence** and **authorizing action**.

This example implements one deterministic **reliability-checking rule**. It does **not** use an LLM, establish whether the input evidence is true, route a case to a reviewer, or make a business decision.

## The design

The function accepts three independently supplied, normalized values between 0 and 1:

- **Quality** — an illustrative measure of source trustworthiness
- **Completeness** — an illustrative measure of required information available
- **Consistency** — an illustrative measure of agreement among evidence

It multiplies them into a composite *indicator* and applies illustrative thresholds to return a review **flag**—not to trigger an approval workflow:

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

The GitHub Actions workflow is configured to run type checking and tests on commits and pull requests. Check the Actions tab for the latest execution result.

## Design decisions and tradeoffs

1. **Deterministic gate, not LLM authority.** A typed function evaluates predefined inputs; it cannot independently authorize downstream actions.
2. **Fail on malformed inputs.** Non-finite and out-of-range values raise an explicit error instead of silently producing an apparently valid answer.
3. **Explicit uncertainty.** Low completeness or consistency reduces the indicator rather than being treated as absence of risk.
4. **Small and testable.** Node's built-in test runner covers expected outputs, missing evidence, invalid inputs, and boundary behavior.

## Connection to AdaptiHire and reuse across domains

This is a simplified demonstration of a type of signal evaluation explored in **[AdaptiHire.ai](https://adaptihire.ai)**, a hiring decision intelligence R&D product under development by **Jasleen Kals**.

The broader methodology is to separate **interpreted signals**, **evaluation of uncertainty**, **explicit decision authority**, and **human review where needed**. That separation is relevant beyond hiring—to enterprise operations, payments, and other evidence-driven workflows. The example here only covers the reliability-evaluation slice; the other layers are design context, not features implemented in this repository.

This is **one illustrative artifact, not the complete AdaptiHire system or its production methodology**. Inputs and thresholds are synthetic; outputs are not validated probabilities. The code is independently written for demonstration and does not disclose AdaptiHire's proprietary implementation.
