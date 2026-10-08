# Previous One-Shot A/B Results

The latest completed comparison is in the README and the general/token reports.
These snapshots preserve earlier completed comparisons when a rerun replaces those
reports. Each snapshot is one run per model and arm, not a controlled repeated
stability benchmark. Positive reductions mean savings; negative reductions mean
increased usage. Input counts are uncached input tokens.

## 2026-10-08 — initial 0.1.22 comparison

OpenCode: 1.18.20. Context Goblin: 0.1.22. Cache size: 2,449 bytes.
Both models passed the six-item answer checklist and tool-flow/safety checks.

| Model | Files B/G | Input B/G | Total B/G | File Reduction | Input Reduction | Total Reduction | Compatibility | Efficiency |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| openai/gpt-5.5 | 17 / 8 | 11,610 / 14,880 | 36,385 / 33,824 | 53% | -28% | 7% | pass | fail |
| openai/gpt-5.6-sol | 17 / 9 | 16,542 / 8,051 | 40,999 / 27,056 | 47% | 51% | 34% | pass | pass |

B/G means baseline / Context Goblin. The combined efficiency gate failed because
gpt-5.5 used more uncached input tokens, despite fewer file reads and total tokens.

Full answers and accounting: [token report at the release commit](https://github.com/MelnixDev/context-goblin/blob/6a6477a5a634c9b13b98923dfddd82a4e274476b/examples/token-usage-ab-report.md).
