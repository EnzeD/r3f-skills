---
name: r3f-materials
description: Choose and configure React Three Fiber surface materials, PBR, transparency, and transmission. Use for mesh appearance and material cost; use shader guidance for custom GLSL or TSL code.
---

# React Three Fiber materials

Inspect the installed renderer, Three.js, Fiber, and Drei versions first. Examples use Fiber 9 / React 19 with WebGL. Do not assume Drei shader-based materials work unchanged with WebGPU.

## Choose the least complex material that fits

| Need | Starting point | Constraint |
| --- | --- | --- |
| Unlit artwork or UI surface | `meshBasicMaterial` | Still participates in output color/tone-mapping policy |
| Ordinary PBR surface | `meshStandardMaterial` | Metals especially need an environment or suitable lights |
| Clearcoat, transmission, sheen | `meshPhysicalMaterial` | Enable only needed features; more shader work |
| Stylized lighting | `meshToonMaterial` | Needs lights; gradient maps need appropriate filtering |
| Normal debugging | `meshNormalMaterial` | Useful for geometry/normal inspection |
| Custom shading | ShaderMaterial or node material | Match WebGL/GLSL versus WebGPU/TSL |

## PBR surface with environment lighting

Mount below Canvas. This small procedural environment avoids a remote preset dependency.

```tsx
import { Environment, Lightformer } from '@react-three/drei'

export default function Example() {
  return (
    <>
      <Environment resolution={64} frames={1}>
        <Lightformer position={[0, 3, 2]} scale={[5, 5, 1]} intensity={3} />
      </Environment>
      <mesh>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="goldenrod" metalness={1} roughness={0.3} />
      </mesh>
    </>
  )
}
```

## PBR and color decisions

- Use metalness near 0 for dielectrics and near 1 for bare metals; intermediate values usually describe mixtures or texture filtering. Roughness controls microsurface response, not opacity.
- Color/albedo and emissive textures use sRGB; roughness, metalness, normal, AO, and masks use `NoColorSpace`. Preserve correctly loaded glTF texture metadata.
- Maps multiply scalar settings: a metalness map with `metalness={0}` has no effect; an emissive map needs a nonblack emissive color.
- A normal map alters shading; a displacement map alters vertices and needs enough geometry subdivisions. Normal maps do not alter the silhouette.
- An emissive surface does not illuminate nearby geometry or automatically produce a halo. Add appropriate lighting and a bloom pipeline when those effects are required.
- PBR appearance changed across recent Three.js releases. Validate with controlled lighting/exposure; do not blindly compensate for an upgrade with extra lights or color conversion.

## Transparency and glass

- `opacity < 1` needs `transparent` for ordinary alpha blending. For cutout foliage or decals, consider `alphaTest` to avoid sorting artifacts; choose soft transparency only when required.
- `depthWrite={false}` can help some transparent layers but is not a universal fix. Test overlap order, backfaces, and intersection with opaque objects.
- Use physical transmission for glass, generally with opacity 1 and a meaningful `thickness`/IOR. Transmission is not equivalent to ordinary transparency.
- Drei `MeshTransmissionMaterial` and `MeshReflectorMaterial` add scene renders. Start with low resolution/samples, and measure before enabling backside passes or one independent buffer per object.
- A shared transmission sampler is cheaper in some scenes but cannot reproduce all visibility between transparent/transmissive objects. Read the helper's documentation before choosing it.
- Do not enable `DoubleSide` everywhere: it changes rendering cost and may hide incorrect winding or normals.

## Lifetime and updates

- Share materials when objects should share appearance. Clone before changing one instance's color, maps, or uniforms; a cached glTF material may be used elsewhere.
- R3F owns declarative material children. Externally allocated/shared materials need explicit lifecycle ownership. Disposing a material does not dispose its textures.
- Animate ordinary material properties through typed refs. Value changes such as roughness or color do not require `needsUpdate`; shader feature changes such as adding/removing a map can require recompilation.
- Material arrays require matching geometry groups. An array alone does not assign arbitrary materials to faces.

## Verify

Render under the intended lighting and output pipeline, then test transparent overlaps, shadows, and repeated mount/unmount. Compare GPU cost before adding transmission or reflection passes.

## Sources

- [MeshStandardMaterial](https://threejs.org/docs/#MeshStandardMaterial), [MeshPhysicalMaterial](https://threejs.org/docs/#MeshPhysicalMaterial), [Material](https://threejs.org/docs/#Material).
- [Drei transmission material](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material), [reflector material](https://drei.docs.pmnd.rs/shaders/mesh-reflector-material).
- [Color management](https://threejs.org/manual/en/color-management.html), [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).
