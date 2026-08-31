# Skill evals

Measures whether a skill changes what an agent produces, rather than whether it reads well.

## Method

For one skill, run realistic prompts twice: once with `SKILL.md` available, once without.
Both arms run in a **bare temp directory** with no `node_modules` and no repo access, so the
control cannot read installed package source. The only difference is the skill file.

Outputs are graded here, against this repo's pinned versions:

- **Type check** — every `Solution.tsx` is staged into `.generated-eval/` and compiled by the
  repo's own `tsc`. This is the assertion that cannot be argued with.
- **Rubric** — per-skill predicates over `Solution.tsx` and `ANSWER.md`, in `rubrics/<name>.mjs`.

```sh
sh evals/collect-sandbox.sh <sandbox-dir> evals/workspace/<skill>-iteration-N
node evals/grade.mjs --rubric <name> --iteration evals/workspace/<skill>-iteration-N
```

## Writing rubrics that are worth running

Record the failure you predict **before** running. An assertion you cannot imagine failing is
not measuring the skill; it is measuring whether the model can do the task at all. In the first
two rounds every assertion passed in both arms, which told us nothing.

Comments are stripped before structural checks, so a doc block naming an API does not count as
using it. Runs missing either output file are reported incomplete rather than scored.

## What has been measured

| Skill | Model | Pass rate (skill / none) | Tokens | Time |
| --- | --- | --- | --- | --- |
| r3f-postprocessing | Opus 5, repo access | 100% / 100% | +9.5k | -41s |
| r3f-shaders | Sonnet 5, bare dir | 94.4% / 100% | -6.5k | -60s |

No correctness benefit has been demonstrated for either skill. The consistent effect is cost:
in a bare environment the skill is cheaper and faster, because it substitutes for source reading.

Known limits: one run per cell, three prompts per skill, nine of eleven skills unmeasured.
The r3f-shaders loss is a single `TS1005` from backticks inside a GLSL template literal, not a
content error; that observation is what added the template-literal line to `r3f-shaders`.
