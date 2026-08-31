---
name: r3f-shaders
description: Implement custom GLSL or TSL materials in React Three Fiber, including uniforms and vertex deformation. Use for shader code and shader debugging, rather than ordinary PBR settings or composer effects.
---

# React Three Fiber shaders

## Select the shader path

Inspect installed Fiber, Drei, Three.js, and renderer versions first. The example uses Fiber 9 / React 19 and WebGL. Preserve an existing project's versions.

- Use built-in materials when their properties express the effect. For custom WebGL shading, use Drei `shaderMaterial` or a native `<shaderMaterial>`.
- WebGPU uses node materials and TSL; GLSL `ShaderMaterial` and `onBeforeCompile` are not portable to it. Read [WebGPU and TSL](references/webgpu.md) only when that renderer is relevant.
- A shader is not automatically lit, shadowed, fogged, instanced, or skinned. Choose the required features before replacing a built-in material.

## Animated WebGL material

Mount beneath Canvas. Keep the material class and `extend` call outside render; the local component avoids global JSX augmentation.

```tsx
import { useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { Color } from 'three'

const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new Color('coral') },
  `uniform float uTime;
   varying vec2 vUv;
   void main() {
     vUv = uv;
     vec3 p = position;
     p.z += sin(p.x * 4.0 + uTime) * 0.15;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
   }`,
  `uniform vec3 uColor;
   varying vec2 vUv;
   void main() {
     gl_FragColor = vec4(uColor * (0.4 + 0.6 * vUv.y), 1.0);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
   }`,
)
const Wave = extend(WaveMaterial)

export default function Example() {
  const material = useRef<InstanceType<typeof WaveMaterial>>(null)
  useFrame((_, delta) => {
    if (material.current) material.current.uTime += delta
  })
  return (
    <mesh>
      <planeGeometry args={[3, 3, 32, 32]} />
      <Wave ref={material} key={WaveMaterial.key} />
    </mesh>
  )
}
```

## Uniforms and compilation

- Drei `shaderMaterial` creates uniform accessors: assign `material.uTime`. Native ShaderMaterial uses `material.uniforms.uTime.value`.
- Keep uniform containers stable; mutate values without setting React state each frame. Do not set `material.needsUpdate` for a value-only uniform change.
- Shader source, defines, and feature changes can require recompilation. Use the class's `key` for hot reload; do not change React keys during animation.
- `extend(Class)` is available in Fiber 9. For a lowercase global element, augment `ThreeElements` with `ThreeElement<typeof Class>`; removed `Object3DNode` is not a replacement for material typing.
- GLSL strings are not checked by TypeScript. Render them and inspect shader compiler errors, including configurations with the actual renderer and effects.
- Shader source sits inside a JavaScript template literal, so a backtick or `${` anywhere in the GLSL, including in its comments, silently ends the string and breaks the module. Write shader comments without backticks and let the type-checker catch it rather than reading for it.

## Space, color, and geometry

- Keep normals, light directions, and view directions in the same coordinate space. `normalMatrix * normal` is view space; do not dot it with a world-space camera direction.
- CSS/hex colors passed through `Color` are converted to the linear working space. Numeric uniform vectors are already linear; avoid converting them twice.
- Mark color input textures as `SRGBColorSpace`; data textures use `NoColorSpace`. Texture sampling and output conversion must match the material/renderer pipeline.
- For a WebGL shader writing directly to the canvas, apply tone mapping and output color conversion as in the example. Do not manually gamma-correct and also apply the output chunk. Let a composer own final output when rendering through one.
- Vertex deformation needs sufficient geometry subdivisions. If lighting is required, update normals consistently. For shadows, match deformation in depth/distance materials; CPU raycasts and bounds do not automatically follow GPU deformation.
- Native custom instancing shaders must account for `instanceMatrix` and any per-instance attributes. Skinning and morph targets likewise require their corresponding shader logic.

## Patching built-in WebGL materials

Use `onBeforeCompile` only when retaining a built-in material's lighting is useful. Shader chunk names are version-sensitive: inspect the installed source, and render-test after a Three.js update.

Set the callback before first compilation. When a configuration changes generated GLSL, provide a matching `customProgramCacheKey` and trigger recompilation; keep animated values in uniforms. Do not assume `.clone()` or serialization preserves callbacks. Prefer node materials when the task already targets WebGPU.

## Sources

- [Drei shaderMaterial](https://drei.docs.pmnd.rs/shaders/shader-material), [Fiber type migration](https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/docs/tutorials/v9-migration-guide.mdx).
- [ShaderMaterial](https://threejs.org/docs/#ShaderMaterial), [color management](https://threejs.org/manual/en/color-management.html).
- [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) — check only changes through the installed release.
