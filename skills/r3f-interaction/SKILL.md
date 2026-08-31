---
name: r3f-interaction
description: Implement React Three Fiber pointer events, picking, dragging, keyboard input, and camera controls. Use for scene interaction and event propagation, rather than animation or physics simulation itself.
---

# React Three Fiber interaction

Check installed Fiber, Drei, and input-library versions first. Examples target Fiber 9 / React 19. Choose camera movement, object movement, and UI input owners before connecting handlers.

## Selectable object

Mount beneath Canvas. Keep accessible DOM controls outside Canvas for important actions; mesh pointer handlers alone do not provide keyboard access.

```tsx
import { useState } from 'react'
import { OrbitControls } from '@react-three/drei'

export default function Example() {
  const [selected, setSelected] = useState(false)
  return (
    <>
      <mesh
        name="selectable-box"
        onClick={(event) => {
          event.stopPropagation()
          setSelected((value) => !value)
        }}
      >
        <boxGeometry />
        <meshStandardMaterial color={selected ? 'gold' : 'coral'} />
      </mesh>
      <OrbitControls makeDefault />
    </>
  )
}
```

## Event semantics

- R3F raycasts objects with handlers and delivers hits by distance, then bubbles through ancestors. `event.object` is the hit object; `event.eventObject` is the object owning the handler.
- `stopPropagation()` blocks delivery to farther hits as well as ancestors. It changes event delivery; it does not avoid raycasts already performed. Calling it can immediately trigger pointerout on previously hovered objects behind the hit.
- `event.point` is world space. Clone values you retain and convert into the parent's local space before assigning local transforms. A plane intersection or depth reference is needed to map a 2D drag into 3D.
- Handle Canvas `onPointerMissed` for background deselection; distinguish clicks from drags using the event's movement information and the application's gesture policy.
- Pointer capture is additive to hit testing in R3F. Capture/release via `event.target.setPointerCapture(event.pointerId)` and the matching release method; also handle cancellation/lost capture.
- Camera movement beneath a stationary pointer may require `state.events.update()` to refresh hover results. Call it only when needed, not as a blanket extra raycast every frame.
- Use simpler hit proxies or layer filtering for expensive picking. Do not rely on visual transparency alone to prevent intersections.

## Controls and drag ownership

- Use OrbitControls for orbiting; use CameraControls when scripted transitions and richer camera behavior are needed. Check the installed Drei/underlying controls version before copying props or methods.
- Drei controls manage frame updates and demand invalidation. Avoid mounting multiple active controls on the same camera without explicit coordination.
- `makeDefault` exposes a controls instance to helpers that coordinate with it. TransformControls can suspend default controls while dragging; verify that custom controls are also disabled/restored correctly.
- For object dragging, choose Drei DragControls/PivotControls/TransformControls according to required constraints. Distinguish controlled matrices from automatic transforms; do not apply both to the same object.
- For custom drags, store initial transforms, capture the pointer, project onto a chosen plane, and restore camera controls on pointerup, cancellation, and unmount. Honor touch-action requirements on the actual event target.
- Shared DOM event sources need a coordinate prefix consistent with the event target and canvas rectangle. Test scrolling and overlays; blindly selecting `client` coordinates can introduce offsets.

## Keyboard and continuous input

- Drei KeyboardControls provides named actions. Read its getter inside `useFrame` for movement; subscribe only for discrete events and clean up subscriptions.
- Normalize diagonal movement if speed must remain constant; multiply visual movement by delta. For a physics body, send input to physics-step logic instead of moving its mesh directly.
- Clear held input on focus loss and respect text-field focus. Pointer lock/fullscreen/audio may require an explicit user gesture.
- Use refs for high-frequency pointer positions and React state for semantic events. Avoid adding lodash or a store solely to throttle one handler; clean up timers if throttling is warranted.
- ScrollControls creates a scroll context; `useScroll` belongs below it. Its normalized offset/delta are not pixel distances.

## Verify

Test overlapping meshes, nested groups, background deselection, dragging outside the canvas, touch, cancellation, focus loss, and keyboard alternatives. Verify camera controls recover after dragging.

## Sources

- [Fiber events](https://r3f.docs.pmnd.rs/api/events), [Drei controls](https://drei.docs.pmnd.rs/controls/introduction).
- [DragControls](https://drei.docs.pmnd.rs/gizmos/drag-controls), [KeyboardControls](https://drei.docs.pmnd.rs/controls/keyboard-controls), [ScrollControls](https://drei.docs.pmnd.rs/controls/scroll-controls).
