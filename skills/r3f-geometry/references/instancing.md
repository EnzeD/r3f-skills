# Native instancing

Use for large sets where per-instance components or updates are too expensive. Mount below Canvas with lighting. This small example shows buffer initialization; profile at the real instance count.

```tsx
import { useLayoutEffect, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'

export default function NativeInstances() {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const transform = new Object3D()
    for (let i = 0; i < 100; i++) {
      transform.position.set((i % 10) - 4.5, Math.floor(i / 10) - 4.5, 0)
      transform.updateMatrix()
      mesh.current.setMatrixAt(i, transform.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingBox()
    mesh.current.computeBoundingSphere()
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 100]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="coral" />
    </instancedMesh>
  )
}
```

- `args` sets capacity; `mesh.count` controls how many initialized instances draw. Growing beyond allocated capacity requires recreation.
- Set `instanceMatrix.needsUpdate` after matrix writes and `instanceColor.needsUpdate` after color writes. Recompute bounds when transforms change their extent.
- Use a stable scratch Object3D/Matrix4 for repeated frame updates. Set DynamicDrawUsage before the first upload for frequently changing buffers.
- Picking returns `instanceId`; map it to application data. Negative instance scales are unsupported; avoid using them for mirroring.
- Instancing reduces rendering overhead, not CPU simulation or raycasting cost. Custom vertex shaders still need to apply `instanceMatrix`.

Source: [InstancedMesh](https://threejs.org/docs/#InstancedMesh), [Drei Instances tradeoffs](https://drei.docs.pmnd.rs/performances/instances).
