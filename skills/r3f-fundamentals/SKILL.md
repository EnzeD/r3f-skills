---
name: r3f-fundamentals
description: Set up React Three Fiber scenes, Canvas, typed JSX, hooks, and resource ownership. Use for scene architecture and render-loop setup, rather than detailed materials or effects.
---

# React Three Fiber fundamentals

## Choose the right baseline

- Inspect the project's manifest and lockfile before selecting APIs. These examples target Fiber 9 / React 19; Fiber 8 pairs with React 18. Do not upgrade a project just to match a recipe.
- Check installed Three.js and Drei versions too. Use released documentation matching those versions; if unavailable, state the uncertainty instead of inventing props.
- Keep the existing renderer unless the task calls for changing it. For WebGPU, read [renderer selection](references/renderers.md); Fiber 10 alpha APIs are not Fiber 9 APIs.

## Minimal scene

This example owns its Canvas. Its parent must have a nonzero height.

```tsx
import { useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import type { Mesh } from 'three'

function RotatingBox(props: ThreeElements['mesh']) {
  const mesh = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5
  })
  return (
    <mesh {...props} ref={mesh}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="coral" />
    </mesh>
  )
}

export default function Example() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <RotatingBox />
    </Canvas>
  )
}
```

## Scene and type boundaries

- Call `useThree`, `useFrame`, and loader hooks in components beneath Canvas, never in the component creating that Canvas or inside an event callback.
- Canvas children are Three.js objects. Place DOM UI outside it or use Drei `Html`. A Suspense fallback inside Canvas must obey the same rule.
- Use `ThreeElements['mesh']` for mesh props and `useRef<Mesh>(null)` for refs. Fiber 9 uses `ThreeElement<typeof Class>` for custom elements; do not use removed `Object3DNode` or global `JSX.IntrinsicElements` augmentation.
- `extend(Class)` creates a locally typed component in Fiber 9. Use `extend({ Class })` plus module augmentation of `@react-three/fiber` when a shared lowercase JSX element is actually needed.
- `args` are constructor arguments: changing them reconstructs the object. Update ordinary props or refs for animation; retain expensive shapes, arrays, and materials when their inputs have not changed.
- Geometry/material children attach automatically. Use explicit `attach` for other properties, e.g. `attach="attributes-position"` for a buffer attribute.
- Three.js uses radians and local transforms. Convert world-space input into the object's parent space before assigning it to `position`.

## Render-loop decisions

- Use React state for discrete UI changes; mutate owned refs for per-frame motion. Reuse scratch vectors and use `delta` in seconds. Do not create a second animation loop for the same scene.
- `useThree(state => state.camera)` subscribes to camera replacement, not mutations of `camera.position`. Read transient values inside `useFrame`; update the projection matrix after imperative camera projection changes.
- Default `frameloop="always"` fits continuous animation. Use `"demand"` for scenes that can rest: imperative changes need `invalidate()`, and animations must keep invalidating until settled. Drei controls handle their own invalidation.
- Negative frame priorities order updates without taking over rendering. A positive priority disables automatic rendering: its owner must render, and must coordinate with any composer. Callbacks run in ascending priority order.
- Do not reset transforms in JSX and animate the same values from another owner. Visibility changes do not automatically stop callbacks or release GPU resources.

## Renderer and ownership pitfalls

- Default WebGL Canvas uses sRGB output and ACES filmic tone mapping. `flat` selects `NoToneMapping`; `linear` changes output color space. Neither is a generic fix for washed-out assets.
- On Three.js r182+, use `shadows="percentage"` for PCF shadows. Bare `shadows` in Fiber 9 selects deprecated `PCFSoftShadowMap` on this baseline.
- Start with defaults; add `preserveDrawingBuffer`, larger DPR, or extra render passes only for an actual requirement and measure their cost.
- R3F disposes declaratively owned objects when unmounted. `<primitive object={...}>` does not dispose the supplied object. Cached loader assets and shared resources need an explicit owner; do not dispose them while another consumer uses them.
- `dispose={null}` opts a subtree out of automatic disposal; it is not a general performance switch. Manually allocated resources outside R3F's ownership need cleanup.
- Effects, subscriptions, and imperative registrations must survive Strict Mode setup/cleanup. Profile before adding memoization; ordinary React renders do not inherently restart `useFrame` animation.

## Verify

Type-check, render in a browser, check the console, resize, and unmount/remount. For demand rendering, verify both waking and returning to idle.

## Sources

- [Fiber 9 migration](https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/docs/tutorials/v9-migration-guide.mdx) — version-sensitive types and renderer setup.
- [Canvas](https://r3f.docs.pmnd.rs/api/canvas), [objects and disposal](https://r3f.docs.pmnd.rs/api/objects), [hooks](https://r3f.docs.pmnd.rs/api/hooks).
- [Performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls), [on-demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
