# Renderer selection

Use this only when choosing or changing the renderer. Inspect the installed Fiber and Three.js versions first; this setup targets Fiber 9.7 and Three.js r185.

- WebGL remains the default for existing GLSL materials, Drei helpers, and `@react-three/postprocessing`. A renderer migration requires checking every effect and material, not just changing Canvas.
- Fiber 9 accepts an asynchronous `gl` factory. Import WebGPU classes from `three/webgpu` and node functions from `three/tsl`. Initialize the renderer before returning it.
- Do not add Fiber 10 alpha hooks or `@react-three/fiber/webgpu` imports to a Fiber 9 project. Check stable release notes before adopting experimental examples.

```tsx
import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'

export default function WebGPUExample() {
  return (
    <Canvas gl={async (props) => {
      if (!(props.canvas instanceof HTMLCanvasElement)) {
        throw new Error('This example requires a browser canvas')
      }
      const renderer = new WebGPURenderer({ canvas: props.canvas, antialias: true })
      await renderer.init()
      return renderer
    }}>
      <mesh>
        <boxGeometry />
        <meshBasicMaterial color="coral" />
      </mesh>
    </Canvas>
  )
}
```

Built-in materials have a compatibility path; custom GLSL and shader-patching helpers do not automatically gain one. WebGPURenderer can fall back to WebGL2 where supported, but this does not make GLSL ShaderMaterial compatible with its node pipeline. Test initialization failure and actual target browsers/hardware.

Three.js r183 renamed its node `PostProcessing` class to `RenderPipeline`. Use the matching node pipeline and versioned examples for WebGPU postprocessing; do not install the WebGL composer as a substitute.

Sources: [Fiber Canvas](https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/docs/API/canvas.mdx), [Three.js migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide), [Fiber releases](https://github.com/pmndrs/react-three-fiber/releases).
