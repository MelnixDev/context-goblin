# Context Goblin Repeated Stability A/B Report

Generated: 2026-09-04
OpenCode version: 1.18.20
Context Goblin version: 0.1.20
Protocol: repeated agentic A/B with cold-refresh and warm-cache controls

## Status

Deferred — the repeated agentic run is not a valid performance result yet. OpenCode's
`run` command completed the short live smoke and one-shot A/B sessions, but the
longer tool-use fixture stalled before emitting its first event (both tested models).
Those attempts are recorded as execution timeouts, not as zero-token or zero-read
measurements. No stability claim is made from them.

## Valid evidence already available

- Live smoke passed on `openai/gpt-5.5` and `openai/gpt-5.6-sol` with the required
  `status → refresh → read → stats` tool sequence.
- Single-call one-shot A/B passed on both models with answer quality `6/6` and no
  secret leakage. File-read reductions were 44% (`gpt-5.5`) and 35% (`gpt-5.6-sol`).
- Input-token reductions were 28% and 45%; total-event-token reductions were 47%
  and 35%, respectively.

## Reproduction

The staged runner remains available for a later retry when the provider/session path is
healthy:

```bash
STABILITY_RUNS=3 STABILITY_COLD_RUNS=1 \
OPENCODE_MODELS="openai/gpt-5.5 openai/gpt-5.6-sol" \
npm run benchmark:stable
```

It resumes only valid matching-protocol sidecars and fails closed on timeouts, provider
errors, tool-order violations, cache leaks, or quality failures.

## Decision

The current evidence is sufficient to proceed with compatibility documentation and
release work, but not to claim repeatable multi-run savings. Re-run this report before
publishing a stability percentage.
