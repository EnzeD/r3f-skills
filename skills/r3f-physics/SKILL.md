---
name: r3f-physics
description: Add Rapier rigid bodies, colliders, forces, sensors, and joints to React Three Fiber. Use for collision-driven movement and simulation; use animation guidance for purely visual motion.
---

# React Three Fiber physics

Check installed Fiber, React, and Rapier versions. Rapier 2 targets Fiber 9 / React 19; older projects need their compatible package line. Keep rendering and simulation ownership separate.

## Falling and clickable body

Mount beneath Canvas with lighting. Physics loads WASM asynchronously; include Suspense. Cuboid collider arguments are half-extents, unlike BoxGeometry's full dimensions.

```tsx
import { Suspense, useRef } from 'react'
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'

function FallingBox() {
  const body = useRef<RapierRigidBody>(null)
  return (
    <RigidBody ref={body} position={[0, 2, 0]} colliders="cuboid" restitution={0.2}>
      <mesh name="physics-box" onClick={() => body.current?.applyImpulse({ x: 0, y: 3, z: 0 }, true)}>
        <boxGeometry />
        <meshStandardMaterial color="coral" />
      </mesh>
    </RigidBody>
  )
}

export default function Example() {
  return (
    <Suspense fallback={null}>
      <Physics timeStep={1 / 60}>
        <FallingBox />
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[4, 0.25, 4]} position={[0, -0.25, 0]} />
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[8, 0.5, 8]} />
            <meshStandardMaterial color="slategray" />
          </mesh>
        </RigidBody>
      </Physics>
    </Suspense>
  )
}
```

## Bodies and colliders

- Dynamic bodies respond to forces. Fixed bodies represent static surfaces. Position-kinematic bodies use `setNextKinematicTranslation/Rotation`; velocity-kinematic bodies use linear/angular velocity setters.
- Set initial transforms on RigidBody. Do not animate a simulated mesh's position in `useFrame`; the physics world remains authoritative and interpolation can overwrite it.
- Prefer simple colliders or compound convex shapes. Use trimesh mainly for static concave environments; a hull closes holes and cannot preserve arbitrary concavity.
- Set `colliders={false}` when supplying complete manual colliders, otherwise automatic colliders may be added as well. Collider sizes/transforms must match world scale; use debug rendering to inspect them.
- Choose collider density/mass consistently and avoid accidental duplicate mass from overlapping auto/manual colliders.
- For many repeated bodies, InstancedRigidBodies reduces rendering overhead, not the cost of simulating each body. Keep instance keys/transforms stable.

## Forces and simulation time

- An impulse is a one-time momentum change. A force persists until reset; repeated `addForce` calls accumulate. Do not add the same continuous force every render frame without an explicit force-management strategy.
- Use `useBeforePhysicsStep` for input/forces that must align with simulation ticks. If a controller owns all user forces on a body, it can reset and reapply them per tick; coordinate with other force sources before resetting.
- Kinematic targets should advance on physics steps. Teleporting with `setTranslation` is different from kinematic movement and can bypass expected collision response.
- Prefer a fixed timestep for stable behavior. `timeStep="vary"` trades predictability for variable stepping; multiplying values by render delta does not make the physics deterministic.
- For demand rendering, use `Physics updateLoop="independent"` so active bodies can request renders. A sleeping world should not force unnecessary rendering.
- Let bodies sleep; explicitly wake them when applying actions that need it. Enable CCD for fast/small bodies when tunneling warrants its cost.

## Events, sensors, and joints

- Sensors report intersection enter/exit without contact response. Use sensor intersection events rather than expecting ordinary collision events.
- Collision groups require compatible membership/filter masks on both colliders. Use `interactionGroups` instead of hand-building masks unless the format is needed.
- Collision payloads may lack a rigidBodyObject for standalone colliders. Inspect the other collider/body safely; do not assume every hit is a named mesh.
- Follow the installed Rapier callback restrictions. In contact-filter hooks, cache body state before the step rather than querying it during Rust's borrowed simulation state.
- Joints connect body refs using local anchors and axes, not world coordinates. Check the hook's exact tuple shape for fixed, revolute, spherical, spring, or rope constraints.
- Read [controlled motion and joints](references/controllers.md) for a step-aligned kinematic platform and correctly aligned hinge.
- A collision-aware character controller is separate from moving a mesh or setting a dynamic body's position. Use the installed Rapier character-controller API and test stairs/slopes/grounding.
- Restoring a world snapshot requires matching body creation/handle relationships; it is not a generic way to swap arbitrary scenes beneath existing React refs.

## Verify

Check resting contact, collider alignment, impulses, sleeping/waking, and different render frame rates. Test sensor enter/exit, fast-body tunneling, and Strict Mode remounts for the paths used.

## Sources

- [React Three Rapier](https://github.com/pmndrs/react-three-rapier), [API reference](https://pmndrs.github.io/react-three-rapier/).
- [Rapier rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies), [colliders](https://rapier.rs/docs/user_guides/javascript/colliders), [character controller](https://rapier.rs/docs/user_guides/javascript/character_controller).
