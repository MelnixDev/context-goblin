# Development and benchmarks

## Local loading

Run `npm install` and `npm run build` in the checkout.

For OpenCode 2, configure the compiled directory in `opencode.json(c)`:

```json
{
  "plugins": ["/absolute/path/to/context-goblin/dist/src"]
}
```

The configured-local loader in `2.0.26` requires a directory. For optional TUI loading, add the same entry to `cli.json(c)`.

For OpenCode 1, use a local shim instead of a configured package entry:

```js
export { default } from "file:///absolute/path/to/context-goblin/dist/src/index.js"
```

Place it in `.opencode/plugins/context-goblin.js` or `~/.config/opencode/plugins/context-goblin.js`. The optional V1 TUI shim exports `dist/src/tui.js` instead. Remove old shims when switching to a configured V2 entry to avoid duplicate plugin IDs.

The V2 SDK imports are type-only development dependencies. The public V1 entrypoints remain available, and the published code does not import the V2 SDK at runtime. Native hooks and transforms are scoped to plugin lifetime; the event subscription is aborted and awaited on unload. Server tools resolve the actual session directory before accessing its cache.

## Checks

```bash
npm run typecheck
npm test
npm run build
npm run check:reports
npm run smoke:opencode
npm run smoke:opencode:v2
```

The V2 smoke installs the packed package into an isolated temporary workspace and executes all six tools without calling a model. V1 scripts use the explicit V1 CLI binary so the V2 dependency cannot change the benchmark runner implicitly.

`npm run smoke:opencode:live` runs a real V1 model session and requires provider credentials. Override the defaults with `OPENCODE_MODEL` or `OPENCODE_BIN`.

## Model comparisons

### OpenCode 2: GPT 6 and GPT 6.1

```bash
npm run check:tokens:v2
```

Defaults: OpenCode 2.0.26, `openai/gpt-6-sol` and `openai/gpt-6.1-sol`, variant `low`, one baseline and one cold-cache Goblin session per model. Both arms use the same synthetic shop fixture, task, and permissions. Each session is limited to 12 steps and 180 seconds. Override `OPENCODE_MODELS`, `OPENCODE_VARIANT`, `OPENCODE_V2_BIN`, or `OPENCODE_TIMEOUT_MS` when needed.

A read-only observer captures native tool completions and `session.step.ended` events without editing prompts or tools. Counters are deduplicated; missing token data and failed arms stop the run and preserve any completed report. A six-topic answer checklist measures coverage, while the report includes the answers for correctness review.

Raw evidence stays under ignored `benchmark-results/v2-*` directories. The report is written to `examples/opencode-v2-ab-report.md` only after every arm completes. To resume a specific run:

```bash
AB_V2_RESUME=benchmark-results/v2-TL4nkL npm run check:tokens:v2
```

Resume verifies package and CLI versions, models, variant, fixture, prompts, and measurement code. It revalidates completed arms against their raw evidence and executes only unfinished arms in fresh fixtures. A recorded quota reset blocks requests until the specified time. Provider cache state may change during a break, so resumed comparisons remain one-shot evidence.

### OpenCode 1: historical protocol

These runners target OpenCode 1.18.20. They are not V2 benchmarks.

```bash
OPENCODE_MODELS="openai/gpt-5.5 openai/gpt-5.6-sol" npm run check:tokens
OPENCODE_MODELS="openai/gpt-5.5 openai/gpt-5.6-sol" npm run check:models:general
```

Both reports use fresh fixtures and the same A/B protocol. Each arm denies `task`, `bash`, and `edit`; the Goblin arm calls `context_goblin_get` once before focused reads. The token report emphasizes accounting, while the general report includes answer and compatibility checks.

Optional groups: `MODEL_GROUP=free` or `MODEL_GROUP=all`. Each invocation has a 180-second timeout, configurable through `OPENCODE_TIMEOUT_MS`. A provider error stops remaining calls and preserves the last completed report.

To generate the general report from an existing token run without another model call:

```bash
REUSE_EXISTING=1 AB_METADATA_PATH="$PWD/examples/token-usage-ab.metadata.tsv" \
OPENCODE_MODELS="openai/gpt-5.5 openai/gpt-5.6-sol" npm run check:models:general
```

Reused events must match the current package version and requested models. Raw event logs and metadata are ignored by Git; generated Markdown reports are committed. Older reports retain their tested version and must be labelled historical evidence.

## Result criteria

- Compatibility passes when both arms complete, required tool-flow and cache-size checks pass, both answers cover the benchmark checklist, and no secret leakage is detected.
- Efficiency passes only when distinct file reads, uncached input tokens, and total event tokens all improve.
- A regression on any efficiency signal is a failure. Flat or unavailable signals without a regression produce a mixed result.
- The checklist measures coverage of requested topics. Review the recorded answers to assess correctness.

Total event tokens include the provider/OpenCode records for cache reads, reasoning, output, and multiple steps. They are not guaranteed invoice totals.

## Repeated stability

```bash
npm run benchmark:stable
```

The runner uses fresh fixture copies, alternating execution order, a cold-cache refresh control, and warm-cache rounds. Timeouts are execution failures and are not converted into zero-token measurements. The current repeated protocol is deferred because sessions stalled before their first event; see [the stability report](../examples/model-stability-ab-report.md).
