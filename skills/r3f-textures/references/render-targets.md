# Offscreen rendering

Use when displaying another scene or rendering intermediate data. This is a WebGL/Drei recipe; WebGPURenderer has different target/pipeline APIs.

Prefer `RenderTexture` for an isolated scene displayed on a material. It manages its portal and render-target lifecycle. Mount this component beneath Canvas.

```tsx
import { PerspectiveCamera, RenderTexture } from '@react-three/drei'

export default function SceneOnScreen() {
  return (
    <mesh>
      <planeGeometry args={[3, 3]} />
      <meshBasicMaterial toneMapped={false}>
        <RenderTexture attach="map" width={256} height={256}>
          <color attach="background" args={['navy']} />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <mesh rotation={[0.3, 0.5, 0]}>
            <boxGeometry />
            <meshBasicMaterial color="coral" />
          </mesh>
        </RenderTexture>
      </meshBasicMaterial>
    </mesh>
  )
}
```

For manual `useFBO` work:

- Render a separate Scene or exclude the surface sampling the target. Sampling the same texture currently attached for writing creates a GPU feedback loop; iterative simulations require ping-pong targets.
- Save the previous target with `gl.getRenderTarget()` and restore it in `finally`. Restore viewport/scissor/clear state if you changed them; do not blindly reset to `null` in nested pipelines.
- Schedule the offscreen pass before its consumer, without unintentionally taking over the final frame render. Coordinate with the composer.
- Size targets for their use rather than always using full screen/DPR. Resize deliberately; choose color/depth formats appropriate for the data and device.
- Preserve linear intermediate data and apply final output conversion once. A rendered color image and a numeric simulation texture have different semantics.
- `useFBO` owns its target lifecycle. A manually constructed target needs cleanup; dispose targets after their last consumer is gone.

Sources: [RenderTexture](https://drei.docs.pmnd.rs/portals/render-texture), [useFBO](https://drei.docs.pmnd.rs/misc/fbo-use-fbo), [WebGLRenderTarget](https://threejs.org/docs/#WebGLRenderTarget).
