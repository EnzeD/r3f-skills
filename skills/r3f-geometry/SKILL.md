---
name: r3f-geometry
description: Build React Three Fiber geometry, custom buffers, instanced meshes, points, and lines. Use for shape construction and geometry draw-call optimization, rather than material appearance.
---

# React Three Fiber geometry

Inspect installed Three.js, Fiber, and Drei versions before copying constructor arguments or helper props. Examples target Fiber 9 / React 19 and Three.js r185.

## Choose the representation

- Use native JSX geometry for ordinary shapes. `args` match the Three.js constructor; changing them reconstructs geometry, so animate transforms rather than constructor inputs.
- Use `BufferGeometry` for custom topology and buffer-based `points` for large particle sets. Keep generated arrays stable and use deterministic generation when results must be reproducible.
- Use Drei `Instances` for convenient declarative instances with events. For large or frequently updated sets, read [native instancing](references/instancing.md) to avoid per-instance React overhead.
- Instancing shares geometry/material and reduces draw calls. Merely sharing a geometry among separate meshes does not batch their draws.
- Drei `Merged` creates instancing abstractions from **meshes**, not BufferGeometry objects; it does not concatenate arbitrary static geometry. For actual merging, inspect `mergeGeometries` from `three/addons/utils/BufferGeometryUtils.js` and ensure compatible attributes/indexing.

## Declarative instances

Mount below Canvas with lighting. Each Instance belongs to its nearest Instances provider.

```tsx
import { Instance, Instances } from '@react-three/drei'

export default function Example() {
  return (
    <Instances limit={3} range={3}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial />
      <Instance position={[-1.2, 0, 0]} color="coral" />
      <Instance position={[0, 0, 0]} color="skyblue" />
      <Instance position={[1.2, 0, 0]} color="gold" />
    </Instances>
  )
}
```

## Custom buffers and updates

- `position` and `normal` attributes usually have item size 3; UVs have item size 2. Construct JSX buffer attributes with `args={[typedArray, itemSize]}` and the correct `attach`, not just `array`/`count` props with no constructor arguments.
- Indices refer to vertices; winding determines the front face. Duplicate vertices at hard normals or UV seams. Indexed vertices share all attributes, not just positions.
- Lit geometry needs normals. Use `computeVertexNormals()` when appropriate; do not recompute every frame if a shader or analytic normals can express the deformation more cheaply.
- After CPU buffer writes, set `attribute.needsUpdate = true`. Choose dynamic usage before the first GPU upload when buffers will change often.
- Recompute bounding boxes/spheres after geometry changes that affect them. GPU vertex displacement does not update CPU bounds or raycasting automatically.
- UV selection is explicit on modern Three.js: `texture.channel` selects `uv`, `uv1`, `uv2`, or `uv3`. Do not unconditionally copy `uv` into `uv2` for AO.
- Avoid rebuilding buffers for pointer movement. If topology is fixed, change attribute contents or uniforms instead.

## Helpers and tradeoffs

- Drei `Line` supports useful line widths; native WebGL line width is limited by the platform. Check `worldUnits` when choosing screen-space versus world-space thickness.
- Use Drei `Text` for flat text and `Text3D` for extruded geometry. Current TextGeometry uses `depth`, not the historical `height`; verify the helper's installed types and font format.
- Use `Edges` for sharp-edge outlines, not as a replacement for screen-space selection effects.
- `Bounds` and `Center` change framing/transforms; decide whether they should update after asset loading, resizing, or interaction.
- Segment count should follow silhouette, deformation, and viewing distance. A “high quality” fixed count is not universally better.
- Declaratively created geometry can be owned by R3F. Shared or cached geometry needs a shared lifetime; do not dispose it from one instance while others remain mounted.

## Verify

Check bounds/culling after updates, raycast hit positions, resource cleanup, and draw calls. Test at the intended object count; three instances do not establish performance at ten thousand.

## Sources

- [BufferGeometry](https://threejs.org/docs/#BufferGeometry), [BufferAttribute](https://threejs.org/docs/#BufferAttribute), [InstancedMesh](https://threejs.org/docs/#InstancedMesh).
- [Drei Instances](https://drei.docs.pmnd.rs/performances/instances), [Merged](https://drei.docs.pmnd.rs/performances/merged), [Text3D](https://drei.docs.pmnd.rs/abstractions/text3d).
