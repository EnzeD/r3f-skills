# TSL materials on WebGPU

Use with an already initialized WebGPURenderer. This example targets Fiber 9.7 / Three.js r185, not Fiber 10 alpha.

```tsx
import { useMemo } from 'react'
import { extend } from '@react-three/fiber'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { color, mix, sin, time, uv } from 'three/tsl'

const BasicNode = extend(MeshBasicNodeMaterial)

export default function NodeGradient() {
  const colorNode = useMemo(() => {
    const factor = sin(uv().y.mul(6).add(time)).mul(0.5).add(0.5)
    return mix(color('navy'), color('coral'), factor)
  }, [])
  return (
    <mesh>
      <planeGeometry args={[3, 3]} />
      <BasicNode colorNode={colorNode} />
    </mesh>
  )
}
```

- Build stable node graphs outside per-frame work. Update uniform node values rather than recreating the graph each frame.
- Node materials handle their own output pipeline; do not paste GLSL output chunks into TSL.
- Use `positionGeometry` for pre-transformed vertices and understand `positionLocal` semantics before combining deformation with skinning in r185.
- Use the installed Three.js `RenderPipeline` and node passes for postprocessing. Older tutorials using `PostProcessing`, renamed helpers, or Fiber alpha hooks need version checks.
- Type-checking does not prove GPU compatibility. Render on the requested backend; verify WebGPU separately from its WebGL2 fallback.

Sources: [TSL guide](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language), [MeshBasicNodeMaterial](https://threejs.org/docs/#MeshBasicNodeMaterial), [migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).
