# React Three Fiber Skills for Claude Code & Codex

A collection of specialized skill files that enhance **Claude Code** and **OpenAI Codex** abilities to work with **React Three Fiber (R3F)** - the React renderer for Three.js.

## Why These Skills?

LLM training data may contain outdated or incomplete R3F patterns. These skills provide:

- Accurate, up-to-date API references for R3F, Drei, and the ecosystem
- Idiomatic React patterns for 3D development
- Working code examples using hooks, JSX, and declarative patterns
- Performance best practices specific to React reconciliation

## Available Skills

| Skill | Description |
|-------|-------------|
| `r3f-fundamentals` | Canvas setup, hooks (useFrame, useThree), JSX elements, events |
| `r3f-geometry` | Built-in geometries, custom BufferGeometry, instancing with Drei |
| `r3f-materials` | Material components, PBR, shader materials in R3F |
| `r3f-lighting` | Light components, shadows, Environment from Drei |
| `r3f-textures` | useTexture, useEnvironment, texture configuration |
| `r3f-loaders` | useGLTF, useLoader, Suspense patterns, asset preloading |
| `r3f-animation` | useFrame animations, useAnimations hook, spring physics |
| `r3f-shaders` | shaderMaterial, custom materials, uniforms in R3F |
| `r3f-postprocessing` | @react-three/postprocessing, EffectComposer, effects |
| `r3f-interaction` | Pointer events, controls, raycasting, KeyboardControls |
| `r3f-physics` | RigidBody, colliders, forces, joints, sensors with Rapier |

## How It Works

Skills are automatically activated based on context. When you ask for R3F help, relevant skills load to provide accurate guidance. Both Claude Code and Codex use the same SKILL.md format with YAML frontmatter.

**Example triggers:**
- "Create a rotating cube in R3F" → `r3f-fundamentals`, `r3f-animation`
- "Add bloom effect" → `r3f-postprocessing`
- "Load a GLTF model" → `r3f-loaders`
- "Make an object clickable" → `r3f-interaction`
- "Add physics to falling cubes" → `r3f-physics`

## Installation

### Quick Install

```bash
npx add-skill EnzeD/r3f-skills
```

This installs skills for your detected agent (Claude Code, Codex, OpenCode, or Cursor).

### Manual Install

Copy the `skills/` directory to your agent's skills location:

| Agent | Project | Global |
|-------|---------|--------|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.codex/skills/` | `~/.codex/skills/` |

## Key Packages Covered

- `@react-three/fiber` - Core R3F renderer
- `@react-three/drei` - Essential helpers and abstractions
- `@react-three/postprocessing` - Post-processing effects
- `@react-three/rapier` - Physics engine integration
- `three` - Underlying Three.js library

## Version Compatibility

These skills are verified against:
- React Three Fiber 8.x
- Drei 9.x
- Three.js r160+
- React 18+

## License

MIT - Use freely in your projects.

## Contributing

Contributions welcome! Please ensure examples follow R3F idioms and best practices.
