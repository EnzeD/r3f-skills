---
name: r3f-video-production
description: Cinematic video production with R3F - declarative scene definitions, glass materials, camera choreography, particle effects, frame-accurate PNG export. Use when creating product showcase videos, motion design, animated presentations, or cinematic 3D content with React Three Fiber.
---

# R3F Cinematic Video Production

A code-driven system for producing professional motion design videos using React Three Fiber. LLMs generate declarative `SceneDefinition` objects — the engine handles rendering, animation, and frame-accurate PNG export.

## Architecture Overview

```
SceneDefinition (pure typed data — LLM generates this)
    ↓
SceneEngine (orchestrator)
    ├── ScriptedCamera (keyframe interpolation)
    ├── Hero Objects
    │   ├── CinematicPhone (metal/glass phone mockup)
    │   └── CardLayout → GlassCard (floating glass UI cards)
    ├── Screen Content (React components with time prop)
    ├── OverlayManager → TextOverlay3D (Billboard text)
    ├── ParticleDissolve (dissolution transitions)
    ├── SceneBackground (gradient/HDRI)
    └── CinematicEffects (bloom, DoF, vignette, noise)
        ↓
    FrameRecorder → PNG ZIP export
```

## Scene Definition API

The complete LLM-facing API. All pure typed data — no functions, no JSX.

### Core Types

```typescript
interface SceneDefinition {
  meta: SceneMeta;
  heroType?: "phone" | "cards";    // "phone" = default, "cards" = floating glass cards
  cards?: CardDefinition[];         // required when heroType is "cards"
  defaults?: SceneDefaults;
  shots: Shot[];
}

interface SceneMeta {
  title: string;
  fps: 24 | 30 | 60;
  width: number;   // output resolution
  height: number;
}

interface Shot {
  id: string;
  duration: number;                 // seconds
  camera: { keyframes: CameraKeyframe[] };
  // Phone hero
  screens?: ScreenChange[];
  phoneAnimation?: PhoneKeyframe[];
  phone?: PhoneConfig;
  // Card hero (keyed by card id)
  cardScreens?: Record<string, ScreenChange[]>;
  cardAnimations?: Record<string, CardKeyframe[]>;
  // Shared
  textOverlays?: TextOverlay[];
  postProcessing?: PostProcessingConfig;
  background?: BackgroundConfig;
  particleTransition?: ParticleTransition;
}
```

### Camera Keyframes

```typescript
interface CameraKeyframe {
  time: number;         // seconds into shot
  position: Vec3;
  lookAt: Vec3;
  fov?: number;         // default 45
  roll?: number;        // rotation around view axis (radians)
  easing?: EasingType;  // "linear"|"easeIn"|"easeOut"|"easeInOut"|"cubic"|"quart"|"spring"
}
```

### Glass Cards

```typescript
interface CardDefinition {
  id: string;
  screenId: string;          // initial screen component
  width?: number;            // default 2.0
  height?: number;           // default 1.4
  cornerRadius?: number;     // default 0.12
  thickness?: number;        // glass depth, default 0.06
  material?: CardMaterial;
}

interface CardMaterial {
  color?: string;            // tint, default "#e8f4fd"
  transmission?: number;     // 0-1, default 0.92
  ior?: number;              // index of refraction, default 1.5
  roughness?: number;        // default 0.08
  envMapIntensity?: number;  // default 2.5
  clearcoat?: number;        // default 1
  clearcoatRoughness?: number; // default 0.05
}
```

### Particle Transitions

```typescript
interface ParticleTransition {
  type: "dissolve" | "assemble" | "explode";
  triggerTime: number;       // seconds into shot
  duration: number;          // 1.5-3s typical
  particleCount?: number;    // default 8000
  spreadRadius?: number;     // default 3
  direction?: Vec3;          // bias, default random
  particleSize?: number;     // default 0.015
  particleColor?: string;    // default matches object tint
  gravity?: number;          // default -0.5
  turbulence?: number;       // 0-1, default 0.4
}
```

### Screen Components

Screen components receive a `time` prop and drive their own internal animations:

```tsx
function DashboardScreen({ time }: { time: number }) {
  // Counter ticks up over 2 seconds starting at t=1
  const kcal = Math.round(lerp(0, 200, clamp((time - 1.0) / 2.0, 0, 1)));

  // Chart draws in
  const chartProgress = clamp((time - 0.5) / 3.0, 0, 1);

  // Icon sparkle at t=2.5
  const sparkle = time > 2.5 && time < 3.5;

  return <div>...</div>;
}
```

Screen components can declare **hero moments** — timestamps of interesting micro-interactions:

```typescript
// In screen registry
"analytics-card": {
  component: AnalyticsCardScreen,
  heroMoments: [
    { time: 0.5, label: "Chart starts drawing", focusPosition: { x: 0.5, y: 0.5 } },
    { time: 2.5, label: "Home icon highlights", focusPosition: { x: 0.2, y: 0.9 } },
  ],
}
```

## Motion Design Rules

### Camera Move Vocabulary

| Move | fov | Distance | Emotion |
|------|-----|----------|---------|
| Establishing | 40-50 | 4-6 | Context |
| Push-in | 35→30 | 4→2.5 | Building importance |
| Pull-back | 30→45 | 2.5→5 | Revealing |
| Orbit | 35-40 | 3-4 | Exploration |
| Tilt-follow | 35-40 | 3-4 | Dramatic |
| Macro close-up | 25-30 | 0.5-1.5 | Intimacy, quality |

### Viewport Safe Areas (fov=40, camera z≈5, 16:9)

| Object z | Safe y | Safe x |
|----------|--------|--------|
| z = 0 | ±1.45 | ±2.59 |
| z = 0.5 | ±1.31 | ±2.33 |
| z = 1.0 | ±1.16 | ±2.07 |

**NEVER place text at z > 2.** Keep text at z = 0 to 0.5.

### Timing Rules

- Text display: minimum 2s for short text, 3-4s for sentences
- Animation enter/exit: 0.5-0.8s for headlines, 0.4-0.6s for subtitles
- Shot duration: minimum 2s (transition), typical 3-8s
- Stagger multi-element entries by 0.3-0.5s
- Always use `easeInOut` for camera moves (never `linear`)
- Phone/card movements: minimum 1.5s for position changes

### The 10 Principles Applied

1. **Timing & Spacing** — Heavy elements (phone) move slower than light elements (text)
2. **Eases** — `easeInOut` default. `easeOut` for arrivals. Never `linear` for visible motion
3. **Mass & Weight** — Phone rotation ≤ ±0.15 radians. Slow, deliberate moves
4. **Anticipation** — Counter-movement (0.02-0.05 units) before main action
5. **Arcs** — Curved paths via intermediate keyframes with y-offset
6. **Follow-through** — Overshoot → settle via extra keyframe 0.3s after arrival
7. **Stagger** — Elements enter/exit at different times, never simultaneously
8. **Exaggeration** — Subtle by default. Bold only for the payoff moment
9. **Secondary Animation** — Layer 2-3 simultaneous subtle animations for richness
10. **Appeal** — Max 3 colors. Consistent typography. Clean backgrounds. Subtle post-processing

## Video Templates

### Template A: Glass Card Explorer

Camera-driven storytelling with floating glass UI cards. No floating text (content speaks for itself). Light aesthetic.

```
Camera pattern: establishing → tilt → macro → detail → pull-back → dissolve
Background:    Light gradient (white → sky blue)
Lighting:      Bright ambient + directional + environment map
Hero moments:  Camera zooms into animated UI elements
Transition:    Particle dissolution → logo reveal
Duration:      12-20s
```

### Template B: Phone Product Showcase

Phone mockup with screen transitions and minimal text overlays. Dark or light aesthetic.

```
Camera pattern: establishing → feature close-ups → pull-back CTA
Background:    Dark gradient or HDRI
Lighting:      Studio soft + directional
Text:          Minimal (max 2 overlays per shot)
Transition:    Camera-driven cuts + screen slide/fade
Duration:      15-45s
```

## Example: Glass Card Scene

```typescript
const scene: SceneDefinition = {
  meta: { title: "App Showcase", fps: 30, width: 1920, height: 1080 },
  heroType: "cards",
  cards: [
    {
      id: "profile",
      screenId: "profile-card",
      width: 1.3, height: 1.7,
      material: { transmission: 0.93, roughness: 0.06 },
    },
    {
      id: "dashboard",
      screenId: "analytics-card",
      width: 1.8, height: 1.4,
      material: { transmission: 0.91, roughness: 0.07 },
    },
  ],
  defaults: {
    background: {
      type: "gradient",
      gradient: {
        stops: [
          { color: "#dce5f5", position: 0 },
          { color: "#f5f7fb", position: 0.6 },
          { color: "#eaecf2", position: 1 },
        ],
        angle: 170,
      },
    },
  },
  shots: [
    {
      id: "establishing",
      duration: 3,
      camera: {
        keyframes: [
          { time: 0, position: { x: 0.5, y: 0.2, z: 5.5 }, lookAt: { x: 0, y: 0, z: 0 }, fov: 42 },
          { time: 3, position: { x: 0, y: 0.1, z: 5.0 }, lookAt: { x: 0, y: 0, z: 0 }, fov: 40, easing: "easeInOut" },
        ],
      },
      cardAnimations: {
        profile: [
          { time: 0, position: { x: -1.2, y: 0, z: 0 }, rotation: { x: 0, y: 0.08, z: 0 } },
          { time: 3, position: { x: -1.2, y: 0, z: 0 }, rotation: { x: 0, y: 0.06, z: 0 }, easing: "easeInOut" },
        ],
        dashboard: [
          { time: 0, position: { x: 1.0, y: 0.1, z: 0 }, rotation: { x: 0, y: -0.06, z: 0 } },
          { time: 3, position: { x: 1.0, y: 0.1, z: 0 }, rotation: { x: 0, y: -0.04, z: 0 }, easing: "easeInOut" },
        ],
      },
      cardScreens: {
        profile: [{ time: 0, screenId: "profile-card", transition: "cut" }],
        dashboard: [{ time: 0, screenId: "analytics-card", transition: "cut" }],
      },
    },
    // ... more shots (tilt, macro, detail, dissolve)
  ],
};
```

## Frame Export

The system renders frame-accurate PNG sequences:

```
1. Click "Record" → frame-stepping loop starts
2. Each frame: set time → rasterize screen → render → toBlob("image/png")
3. Download as ZIP (frame_000001.png to frame_000450.png)
4. Convert: ffmpeg -framerate 30 -i frame_%06d.png -c:v libx264 -pix_fmt yuv420p output.mp4
```

## Key Packages

- `@react-three/fiber` — Core renderer
- `@react-three/drei` — RoundedBox, Html, Text, Billboard, Environment
- `@react-three/postprocessing` — Bloom, DoF, Vignette, ChromaticAberration, Noise
- `html-to-image` — Screen component rasterization for capture mode
- `fflate` — ZIP compression for frame export
- `three` — MeshPhysicalMaterial (glass), Points (particles)
