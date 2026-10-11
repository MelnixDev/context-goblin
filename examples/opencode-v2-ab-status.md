# OpenCode V2 A/B run history

Status updated: 2026-10-11
OpenCode version: 2.0.26
Context Goblin version: 0.2.2
Models: openai/gpt-6-sol, openai/gpt-6.1-sol
Reasoning variant: low
Protocol: v2-single-call-cold-v1

The run started at 2026-10-11 13:37 UTC. GPT 6 Sol baseline completed with 12 distinct file reads, 4 model steps, and answer-topic coverage 6/6. Observed step totals: 4,341 uncached input tokens, 652 visible output tokens, 0 reported reasoning tokens, 6,144 cache-read tokens, and 11,137 total event tokens.

The first GPT 6 Sol Goblin attempt stopped with `provider.quota / usage_limit_reached` before a completed model step. The provider reported reset at 2026-10-11 16:58:13 UTC (19:58:13 Kyiv). That attempt is excluded from metrics, not counted as a zero-token result.

The run resumed after the reset, reusing the verified baseline and running only the three remaining arms. All four measured sessions completed by 2026-10-11 18:59 UTC. See [the completed report](./opencode-v2-ab-report.md). The GPT 6 pair has a roughly five-hour gap; provider caching was uncontrolled. One session per arm does not establish stability.

Raw evidence remains locally in the ignored benchmark directory. Completed arms can be revalidated without model calls:

```bash
AB_V2_RESUME=benchmark-results/v2-TL4nkL npm run check:tokens:v2
```

The historical OpenCode 1.18.20 comparison remains dated 2026-10-08 in [the token report](./token-usage-ab-report.md). See [development instructions](../docs/development.md) for the V2 protocol and resume checks.
