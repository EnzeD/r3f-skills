---
name: r3f-postprocessing
description: Configure React Three Fiber postprocessing, bloom, selection effects, ambient occlusion, and depth of field. Use for composer pipelines and screen-space effects, rather than mesh material shaders.
---

# React Three Fiber postprocessing

Check the actual renderer and package peer dependencies first. This example targets Fiber 9.7 / React 19 with `@react-three/postprocessing` 3.1 and `postprocessing` 6.39 on WebGL. Do not combine arbitrary newest package versions or silently upgrade a project.

## Choose the pipeline

- The React postprocessing composer here is for WebGL. Three.js WebGPURenderer uses node effects and `RenderPipeline` on r183+; verify that backend separately.
- Let one owner render the final scene. EffectComposer uses a positive frame priority; an additional manual `gl.render` can overwrite or duplicate its output.
- Ordinary Bloom can isolate bright surfaces via an HDR threshold. Use SelectiveBloom only when actual object selection is required; it adds work.

## Actual selected-object bloom

Mount beneath Canvas. Click the left box to toggle selection. Both boxes are bright, but only the selected object contributes to this bloom pass.

```tsx
import { useMemo, useRef, useState } from 'react'
import { EffectComposer, Select, Selection, SelectiveBloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { DirectionalLight } from 'three'

export default function Example() {
  const light = useRef<DirectionalLight>(null)
  const lights = useMemo(() => [light], [])
  const [selected, setSelected] = useState(true)
  return (
    <Selection>
      <directionalLight ref={light} position={[0, 3, 5]} intensity={2} />
      <Select enabled={selected}>
        <mesh name="bloom-selected" position={[-1.2, 0, 0]} onClick={() => setSelected((value) => !value)}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="black" emissive="white" emissiveIntensity={3} />
        </mesh>
      </Select>
      <mesh name="bloom-control" position={[1.2, 0, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="black" emissive="white" emissiveIntensity={3} />
      </mesh>
      <EffectComposer multisampling={0}>
        <SelectiveBloom lights={lights} luminanceThreshold={0} intensity={2} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Selection>
  )
}
```

## Color, selection, and refs

- Selection/Select provide selection to effects that support it, such as Outline and SelectiveBloom. Wrapping ordinary Bloom in Selection does not make Bloom respect selected objects.
- Supply SelectiveBloom's relevant lights and keep selection layers coordinated with other layer uses. Test an equally bright unselected object, not only a dark background.
- Bloom operates on brightness before final tone mapping. Use emissive/HDR values and a meaningful threshold; do not flatten the whole scene to force a glow.
- This composer disables renderer tone mapping; use a ToneMapping effect for the intended final appearance. Keep bloom/HDR effects before tone mapping, and avoid duplicate output conversion.
- `ref.current` becoming non-null does not trigger a React render. Do not gate the initial mounting of an effect on a ref assignment alone; use supported refs or callback-ref state where an object is needed reactively.

## Depth and effect-specific requirements

- SSAO in this wrapper needs `<EffectComposer enableNormalPass>`; enable extra buffers only for effects that require them. Check the installed effect's source/types if docs and behavior disagree.
- DepthOfField `target` is a world position (vector/tuple), not a mesh ref. `focusDistance={0}` is not a universal autofocus switch; use a supported target or Autofocus helper.
- Some effect props accept Three.js Vector2/Vector3 instances rather than tuples. Type-check against the installed wrapper; don't transfer JSX coercion assumptions to arbitrary React components.
- Alpha-blended surfaces, depth, selection, and multisampling interact. Test the actual transparent/transmissive scene rather than relying on opaque-box screenshots.

## Performance and custom effects

- Begin with few effects and modest DPR/resolution. Choose an anti-aliasing strategy deliberately; avoid blindly stacking MSAA, SMAA, and FXAA.
- Effect count is not identical to pass count: compatible effects can be merged. Convolution/depth effects and auxiliary buffers can still be expensive; measure GPU cost.
- Prefer supported wrapper components. For a custom postprocessing Effect, follow `mainImage`/`mainUv`, uniforms, input-buffer, and effect-attribute contracts; a UV-changing effect needs the appropriate convolution declaration.
- Give custom Effect instances explicit cleanup ownership. Do not use `dispose={null}` without an owner, or dispose a shared effect from one consumer.
- Check dynamic prop support after updates: construction-only settings may recreate an effect. Do not rebuild the composer each frame to animate a uniform.

## Verify

Render the full pipeline, toggle effects/selection, resize, and unmount/remount under Strict Mode. Confirm selected-only behavior and final color output; TypeScript cannot prove either.

## Sources

- [Selection](https://react-postprocessing.docs.pmnd.rs/selection), [SelectiveBloom](https://react-postprocessing.docs.pmnd.rs/effects/selective-bloom), [Bloom](https://react-postprocessing.docs.pmnd.rs/effects/bloom).
- [Released wrapper source](https://github.com/pmndrs/react-postprocessing/tree/v3.1.1/src) — composer, SSAO, refs, and target types.
- [Postprocessing](https://github.com/pmndrs/postprocessing), [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).
