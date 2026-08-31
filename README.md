# React Three Fiber Skills for Claude Code & Codex

Focused guidance for building React Three Fiber scenes with current, compatible APIs. Each skill keeps decisions, pitfalls, and one checked example in `SKILL.md`; substantial optional recipes live in that skill's `references/` directory.

## Install

```bash
npx skills add EnzeD/r3f-skills
```

The [skills CLI](https://github.com/vercel-labs/skills) lets you choose skills and target agents. For manual installation, copy the individual skill folders into your agent's skills directory, including their `references/` subfolders. Repository development dependencies are **not** needed to use the skills.

## Available skills

| Skill | Focus |
| --- | --- |
| [r3f-fundamentals](skills/r3f-fundamentals/SKILL.md) | Canvas, typed JSX, hooks, renderer choice, ownership |
| [r3f-geometry](skills/r3f-geometry/SKILL.md) | Geometry, buffers, instancing, points, lines |
| [r3f-materials](skills/r3f-materials/SKILL.md) | PBR, transparency, transmission, material cost |
| [r3f-lighting](skills/r3f-lighting/SKILL.md) | Direct lights, environments, shadows |
| [r3f-textures](skills/r3f-textures/SKILL.md) | Color spaces, UVs, sampling, render targets |
| [r3f-loaders](skills/r3f-loaders/SKILL.md) | Assets, Suspense, decoders, caching, clones |
| [r3f-animation](skills/r3f-animation/SKILL.md) | Delta-based motion, demand rendering, clip playback |
| [r3f-shaders](skills/r3f-shaders/SKILL.md) | GLSL, uniforms, deformation, optional TSL |
| [r3f-postprocessing](skills/r3f-postprocessing/SKILL.md) | Composer, selective bloom, depth, output color |
| [r3f-interaction](skills/r3f-interaction/SKILL.md) | Pointer events, dragging, picking, controls |
| [r3f-physics](skills/r3f-physics/SKILL.md) | Rapier bodies, colliders, simulation steps, joints |

Descriptions guide skill selection; only relevant optional references should be loaded. Every skill is independently installable and tells the agent to inspect the consuming project's versions before choosing APIs.

## Compatibility

Reviewed **2026-08-31** against current stable npm releases. Exact direct versions are pinned in [package.json](package.json), and transitive versions in [package-lock.json](package-lock.json).

| Package | Verified fixture version |
| --- | --- |
| React / React DOM | 19.2.8 |
| `@react-three/fiber` | 9.7.0 |
| `@react-three/drei` | 10.7.8 |
| `three` | 0.185.1 (r185) |
| `@react-three/rapier` | 2.2.0 |
| `@react-three/postprocessing` | 3.1.1 |
| `postprocessing` | 6.39.4 |

Fiber 8 / React 18 remain a distinct legacy pairing; these fixtures do not test that stack. Fiber 10 alpha APIs are excluded. WebGPU/TSL recipes are optional and type-checked; the browser smoke suite targets WebGL and does not certify WebGPU compatibility.

A compatible package range is not a promise that every feature combination works. The [maintenance notes](docs/maintenance.md) record coverage, known upstream warnings, and how to review updates.

## Validate changes

Use Node.js 22.12+ and the public npm registry (override a private corporate registry only for these commands if needed).

```bash
npm ci --registry=https://registry.npmjs.org
npm run check
npx playwright install chromium
npm run test:browser
npm run check:releases
```

- `check` validates frontmatter and local skill references, warns above 200 entrypoint lines, and type-checks **all 18 TypeScript examples extracted directly from Markdown**.
- `test:browser` renders the 11 main examples in Chromium with local generated assets, checks key behavior and remounts, and saves screenshots to ignored `output/playwright/`.
- `check:releases` compares pinned versions with public npm stable dist-tags and reports affected skills. It does not install packages, rewrite skills, or mark a review complete.
- `npm run dev` opens a local example gallery for visual inspection. Illustrative asset URLs are served by the validation harness; they are not bundled with installed skills.

[CI](.github/workflows/validate.yml) runs the same structural, type, and browser checks on pushes and pull requests. Release monitoring remains a read-only command, not a scheduled auto-update.

## Contributing

Keep guidance that changes a decision, prevents a likely mistake, or demonstrates a necessary pattern. Prefer deleting generic tutorials and exhaustive API catalogs to moving them into references. Add sources for version-sensitive claims and update the fixtures when changing examples. See [the maintenance workflow](docs/maintenance.md).

## License

MIT — use freely in your projects.
