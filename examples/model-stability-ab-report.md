# Context Goblin Repeated Stability A/B Report

Status updated: 2026-10-09 (no new stability run)
OpenCode version: 1.18.20
Context Goblin version: 0.1.23
Historical attempted run: Context Goblin 0.1.21, 2026-09-04
Protocol: repeated agentic A/B with cold-refresh and warm-cache controls

## Status

Deferred — the repeated agentic run is not a valid performance result yet. OpenCode's
`run` command completed the short live smoke and one-shot A/B sessions, but the
longer tool-use fixture stalled before emitting its first event (both tested models).
Those attempts are recorded as execution timeouts, not as zero-token or zero-read
measurements. No stability claim is made from them.

## Valid evidence already available

The latest completed one-shot comparison used Context Goblin `0.1.22` on
2026-10-08. Both models passed compatibility and efficiency checks, with answer
coverage `6/6` and no detected secret leakage. Coverage is not proof of semantic
correctness, and one-shot results do not establish repeatable savings.

See the [current token report](./token-usage-ab-report.md) and
[previous run history](./ab-run-history.md) for measurements and variability.
The `0.1.23` release updates documentation and package version only; it does not
represent a new model or stability benchmark.

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
