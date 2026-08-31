# Step-aligned control and joints

These components belong inside Physics (and Canvas). They target Rapier 2.2; check installed callback and joint signatures before adapting them.

## Kinematic platform

Advance the target on simulation ticks, not render frames. Position-kinematic targets allow Rapier to derive the velocity that affects contacting bodies.

```tsx
import { useRef } from 'react'
import { RigidBody, useBeforePhysicsStep, type RapierRigidBody } from '@react-three/rapier'

export default function MovingPlatform() {
  const body = useRef<RapierRigidBody>(null)
  const elapsed = useRef(0)
  useBeforePhysicsStep((world) => {
    elapsed.current += world.timestep
    body.current?.setNextKinematicTranslation({ x: Math.sin(elapsed.current), y: 0, z: 0 })
  })
  return (
    <RigidBody ref={body} type="kinematicPosition">
      <mesh>
        <boxGeometry args={[3, 0.3, 3]} />
        <meshStandardMaterial color="coral" />
      </mesh>
    </RigidBody>
  )
}
```

## Hinge with matching anchors

The two local anchors below meet at the same initial world position. Mismatched anchors produce an initial solver correction that can look like instability.

```tsx
import { useRef } from 'react'
import { RigidBody, useRevoluteJoint, type RapierRigidBody } from '@react-three/rapier'

export default function Hinge() {
  // Rapier 2.2's joint types require non-null refs; the hook waits for attachment.
  const frame = useRef<RapierRigidBody>(null!)
  const door = useRef<RapierRigidBody>(null!)
  useRevoluteJoint(frame, door, [[0, 0, 0], [-0.5, 0, 0], [0, 1, 0]])
  return (
    <>
      <RigidBody ref={frame} type="fixed" colliders={false} />
      <RigidBody ref={door} position={[0.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[1, 2, 0.1]} />
          <meshStandardMaterial color="coral" />
        </mesh>
      </RigidBody>
    </>
  )
}
```

For a force controller, remember `addForce` accumulates persistent user forces. Reset/reapply once per physics tick only if that controller owns all such forces; otherwise aggregate contributions under a common owner. An input impulse normally happens once per action, not every frame while a key remains held.

Joint motor parameters have physical units and solver implications. Do not copy spring stiffness or damping from a different mass/scale without testing. Avoid teleporting joint-connected bodies during normal movement.

Sources: [useBeforePhysicsStep](https://pmndrs.github.io/react-three-rapier/functions/useBeforePhysicsStep.html), [Rapier rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies), [React Rapier joints](https://github.com/pmndrs/react-three-rapier#joints).
