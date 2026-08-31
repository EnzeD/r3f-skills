---
name: r3f-loaders
description: Load and reuse 3D assets in React Three Fiber with useGLTF, useLoader, Suspense, and preloading. Use for model loading, decoder setup, caching, cloning, or loading/error UI.
---

# React Three Fiber loaders

Inspect installed Fiber, Drei, Three.js, and React versions first. Examples use Fiber 9 / React 19. Verify actual asset paths, node names, formats, and compression; do not invent a model's structure.

## Load and reuse a model

Mount below Canvas. Supply `/models/robot.glb` in the application. These clones have separate object transforms but intentionally share cached geometry/materials.

```tsx
import { Suspense } from 'react'
import { Clone, useGLTF } from '@react-three/drei'

function Models() {
  const { scene } = useGLTF('/models/robot.glb')
  return (
    <group dispose={null}>
      <Clone object={scene} position={[-1.2, 0, 0]} />
      <Clone object={scene} position={[1.2, 0, 0]} />
    </group>
  )
}

export default function Example() {
  return (
    <Suspense fallback={null}>
      <Models />
    </Suspense>
  )
}
```

## Loading decisions

- Prefer `useGLTF` for glTF/GLB; use `useLoader` with the matching Three.js loader for other formats. Fiber 9 also accepts an externally owned loader instance when configuration isolation is needed.
- Loader hooks suspend. Put boundaries around assets that should reveal together; separate boundaries for independent loading. Preload likely-needed assets ahead of interaction, not the entire catalog.
- Preloading starts a request; it does not guarantee instantaneous display or GPU shader compilation. Asset decoding and first rendering can still cost time.
- Conditional loading means conditionally mounting a child component that calls the hook. Do not pass `null` as a pretend URL or call a hook conditionally.
- Three.js addons use paths such as `three/addons/loaders/GLTFLoader.js`. Check installed exports for renamed loaders; modern Three.js uses `HDRLoader` where older examples used `RGBELoader`.
- Use gltfjsx with types when exposing named nodes/materials is useful, and inspect the generated result. For wrappers, use `ThreeElements['group']`, not the removed global JSX type namespace.

## Cache, clones, and lifetime

- Treat cached loader results as shared. Mounting one Object3D under two parents moves it between them; clone the graph for repeated placement.
- Drei Clone supports ordinary graph duplication and skeleton-aware cloning. For independent animation mixers, a stable `SkeletonUtils.clone` root makes ownership explicit.
- A graph clone normally shares geometry, textures, and materials. Clone the specific material/texture before per-instance edits; deep-cloning everything wastes memory.
- Prevent an individual consumer from disposing shared cached resources (`dispose={null}` on the shared subtree). An application cache owner may release them only after all consumers are gone.
- Primitives are not automatically disposed by R3F. Neither `useGLTF.clear(url)` nor `useLoader.clear(...)` is a complete GPU cleanup operation.
- Do not clear caches during render, and do not mutate a cached scene's transforms/materials as a local setup shortcut.

## Decoders and failure paths

- `useGLTF` integrates Draco/Meshopt support, but decoder URLs and loader configuration must match the asset and hosting policy. For KTX2 textures, configure a KTX2Loader with renderer capability detection before loading.
- Use the same loader/decoder settings for preload and actual load. Configure before requests start; later changes do not retroactively reparse an already cached result.
- Avoid creating a new decoder worker pool in every render or load callback. Give custom loader/decoder instances a deliberate owner and cleanup.
- Suspense handles pending work, not rejected requests. Use an error boundary with an explicit retry/remount strategy; cache eviction for retry belongs in a user action or controlled recovery path.
- Inside Canvas, use a Three.js fallback or Drei Html. Drei Loader is a DOM overlay and belongs outside Canvas.
- `useProgress` reflects the loading manager's activity, not necessarily one asset's byte-accurate completion. Avoid treating an unavailable Content-Length as a trustworthy denominator.
- Test network errors, CORS, decoder/transcoder hosting, and actual compressed assets. An uncompressed GLB smoke test does not validate every decoder path.

## Sources

- [Fiber useLoader](https://r3f.docs.pmnd.rs/api/hooks#useloader), [Drei useGLTF](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf), [Clone](https://drei.docs.pmnd.rs/abstractions/clone).
- [GLTFLoader](https://threejs.org/docs/#GLTFLoader), [KTX2Loader](https://threejs.org/docs/#KTX2Loader), [SkeletonUtils](https://threejs.org/docs/#SkeletonUtils).
