---
name: r3f-animation
description: Animate React Three Fiber objects with useFrame, damping, and GLTF clips. Use for procedural motion, animation transitions, or demand-loop animation; use physics guidance for collision-driven movement.
---

# React Three Fiber animation

Check installed Fiber, Drei, and React versions first. These examples target Fiber 9 / React 19. Keep the project's animation library when it already meets the task.

## Choose an owner

- Use `useFrame` and refs for continuous transforms/uniforms; React state describes discrete goals such as selected, open, or active.
- Use Drei `useAnimations` for authored GLTF clips. Read [clip playback](references/clips.md) for independent animated instances and cleanup.
- Use the project's spring/tween library for coordinated transitions; check its React peer dependencies before adding it. Do not introduce a state manager merely to animate a mesh.
- Let Rapier own simulated body transforms. Animate kinematic targets through physics APIs rather than fighting the simulation with mesh positions.

## Damping that can return to idle

Mount below Canvas; this also works with `frameloop="demand"`. Click the box to change its target.

```tsx
import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, type Mesh } from 'three'

export default function Example() {
  const mesh = useRef<Mesh>(null)
  const [active, setActive] = useState(false)
  const invalidate = useThree((state) => state.invalidate)
  const target = active ? 1 : -1
  useEffect(() => { invalidate() }, [target, invalidate])

  useFrame((_, delta) => {
    if (!mesh.current) return
    // Cap a visual transition's resume jump, not a physics simulation step.
    const x = MathUtils.damp(mesh.current.position.x, target, 6, Math.min(delta, 0.1))
    const moving = Math.abs(x - target) > 0.001
    mesh.current.position.x = moving ? x : target
    if (moving) invalidate()
  })

  return (
    <mesh ref={mesh} name="moving-box" onClick={() => setActive((value) => !value)}>
      <boxGeometry />
      <meshStandardMaterial color={active ? 'orange' : 'coral'} />
    </mesh>
  )
}
```

## Timing and performance

- `delta` is seconds. Integrate velocity as `position += velocity * delta`; use `MathUtils.damp` or lerp with `1 - exp(-lambda * delta)` for exponential smoothing. A fixed lerp fraction depends on refresh rate; `delta * speed` can overshoot.
- Reuse vectors/quaternions; avoid allocating them in every frame. Use quaternion interpolation for orientation instead of independently lerping Euler angles across wrap boundaries.
- Use one timeline/clock owner. Fiber 9 still supplies `state.clock`; do not replace Fiber internals because Three.js deprecated new standalone `Clock` instances. For independent Three.js timing, consult `Timer` in the installed release.
- On demand, external animation systems need invalidation while active. Invalidate before starting a synchronous animation and arrange the start on the next frame if the first frame would otherwise jump.
- Read fast external state directly in the frame callback when supported (e.g. a store's `getState()`); subscribe React only to UI-relevant changes. Clean up external subscriptions.
- Do not claim a normal React re-render stops animation. Profile actual work and subscription frequency before memoizing components.
- Hiding an object does not stop its frame callback or mixer. Pause expensive animation explicitly when appropriate; respect reduced-motion preferences for decorative motion.
- Repeated oscillations and shader motion can derive phase from elapsed time; simulations needing reproducibility require a fixed-step design, not arbitrary delta clamping.

## Verify

Compare motion at different frame rates, background/resume behavior, and repeated target changes. On demand, confirm the object wakes, reaches its goal, and stops requesting frames. For clips, test two instances playing different actions.

## Sources

- [Fiber hooks](https://r3f.docs.pmnd.rs/api/hooks), [performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls), [demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- [MathUtils.damp](https://threejs.org/docs/#MathUtils.damp), [Drei useAnimations](https://drei.docs.pmnd.rs/abstractions/use-animations).
