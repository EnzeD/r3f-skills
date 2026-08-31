# Maintaining concise, current skills

## Baseline and evidence

The 2026-08-31 review used npm's public stable dist-tags and peer dependencies, Fiber 9.7 migration/API documentation, Drei 10.7.8 documentation, Three.js migration notes through r185, and installed source/types for all packages in the fixture. Do not treat unreleased sections of the Three.js migration guide or Fiber alpha documentation as stable APIs.

Direct versions live in `package.json`; the lockfile captures the dependency graph. `validation/baseline.json` records the review date and which skills each upstream package affects. Updating a dependency does not by itself verify a skill or advance that date.

| Skill | Main correction / retained decision |
| --- | --- |
| Fundamentals | Explicit React/Fiber pairing, current JSX types, flat versus linear, resource ownership |
| Animation | Delta-independent damping, demand wake/idle, separate mixers/poses, no false claim that ordinary React renders interrupt animation |
| Geometry | Merged consumes meshes and provides instancing; buffer constructor args, bounds, modern UV channels |
| Materials | Shared lifetime, color/data maps, transparency versus transmission, extra-render cost |
| Lighting | PCF shadows after r182, real target transforms, capture lifetime, no per-light layer-mask claim |
| Textures | NoColorSpace for data, channel-based UVs, cached mutations, no blanket power-of-two rule |
| Loaders | Safe conditional mounting, distinct clones, shared cache ownership, decoder/retry boundaries |
| Interaction | Propagation versus raycast cost, additive pointer capture, world/local coordinates, control ownership |
| Postprocessing | SelectiveBloom actually consumes selection; composer tone mapping, SSAO normal pass, DOF position target |
| Shaders | Fiber 9 typed extend, output conversion, consistent coordinate spaces, distinct WebGPU path |
| Physics | Persistent accumulated forces, simulation-tick control, collider dimensions, velocity-kinematic semantics |

Generic tutorials, exhaustive prop/enum catalogs, outdated state-library snippets, and redundant scene setup were removed. Six independently installable skills retain focused local references for substantial optional tasks. Git history preserves the old catalog; it is not loaded as a second maintained manual.

## Review loop

1. Run `npm run check:releases` monthly or when an upstream update matters. It only reads registry metadata. A fetch failure is reported as unavailable, never as current.
2. Read release notes/migration guides for changed packages, then inspect installed source/types where docs lag. Classify impacted guidance as keep, correct, remove, or move. Check peer dependencies as a set; never use `--force`/`--legacy-peer-deps` to manufacture compatibility.
3. Update exact fixture versions and regenerate the lockfile. Keep legacy/experimental paths separate rather than adding alternatives to every example. Preserve the consuming project's chosen versions.
4. Update the affected Markdown examples and run `npm run check` and `npm run test:browser`. Test extra behavior if the changed claim is outside current coverage.
5. Record the completed review date and compatibility table only after reviewing results. Add newly observed limits here, not as boilerplate in every skill.

The validation workflow runs on pushes and pull requests after publication; it has read-only repository permissions and pinned action commits. There is no scheduled release-monitor job or additional notification setup. The release command is suitable for a future scheduled CI review; do not auto-rewrite prose or auto-merge dependency changes based only on a new version number.

## Context budget

Aim below 200 lines per entrypoint, without padding short skills or deleting important constraints to meet a number. The checker warns above that soft limit. Review token/byte growth too: very long lines can hide context growth.

Keep essential choices, pitfalls, one complete example, and specific source links in `SKILL.md`. Add an optional reference only for useful conditional detail, and link it where the decision arises. Do not require every installed skill to have access to a sibling skill or a repository-level file.

Every `ts`/`tsx` fence is extracted and type-checked as a standalone module. Include its imports and types; do not hide missing context with `any`, suppressions, or invented assets. Runtime assumptions (Canvas, Suspense, Physics, asset paths) belong next to the example. The first TSX fence in each entrypoint exports a default component for the gallery.

## What validation proves

- Structural checks: skill names/descriptions, local reference existence and package boundaries, and entrypoint size warnings.
- Type checks: 18 Markdown modules against the pinned stack, including the optional WebGPU and joint recipes. `skipLibCheck` skips dependency declaration internals, not the example modules.
- Browser checks: all 11 main examples mount/remount under Strict Mode without console errors; representative checks cover visible rendering, demand animation settling/idle, click selection, two cloned GLB graphs sharing geometry, a falling body's impulse, and pixel-level selected bloom versus an equally bright control object.
- Screenshots are review artifacts, not portable golden images. Chromium software rendering is not a target-device performance benchmark.

Limits: reference recipes are type-checked but not all are browser-exercised; no blanket certification of WebGPU, compressed/skinned assets, video/autoplay, real device performance, every effect combination, or React 18 compatibility. The synthetic GLB has ordinary geometry, not a skeleton. Test these paths when a change affects them.

Known upstream warnings on this exact stack: Fiber 9 creates Three.js Clock instances although r185 deprecates Clock, and Rapier's bundled WASM initializer emits a deprecated-parameters warning. Do not patch installed dependencies or replace Fiber's clock to hide them. Browser checks fail on errors; warnings remain visible for review.

## Source map

- [Fiber releases](https://github.com/pmndrs/react-three-fiber/releases) and [v9 migration](https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/docs/tutorials/v9-migration-guide.mdx).
- [Drei tagged documentation](https://github.com/pmndrs/drei/tree/v10.7.8/docs).
- [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide), [color management](https://threejs.org/manual/en/color-management.html), and installed `three/src` for r185 behavior.
- [React Rapier](https://github.com/pmndrs/react-three-rapier), installed package README/types, and [Rapier body behavior](https://rapier.rs/docs/user_guides/javascript/rigid_bodies).
- [React postprocessing source](https://github.com/pmndrs/react-postprocessing/tree/v3.1.1/src) and installed wrapper source for current prop/lifecycle behavior.
