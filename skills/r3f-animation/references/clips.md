# Independent GLTF clip playback

Use when animating an authored asset. Mount below Suspense inside Canvas, provide the asset, and choose a clip name that actually exists. The cloned root owns its pose; geometry/materials remain shared.

```tsx
import { useEffect, useMemo } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

export default function AnimatedModel({ url = '/models/robot.glb', clip = 'Idle' }) {
  const { scene, animations } = useGLTF(url)
  const root = useMemo(() => clone(scene), [scene])
  const { actions } = useAnimations(animations, root)
  useEffect(() => {
    const action = actions[clip]
    if (!action) return
    action.reset().play()
    return () => { action.stop() }
  }, [actions, clip])
  return <primitive object={root} />
}
```

- Inspect available animation names; don't silently claim an absent clip is playing. The caller can choose the clip or present available choices.
- `useAnimations` advances its mixer. Do not also call `mixer.update(delta)` for that mixer.
- Separate mixers/actions per cloned root allow independent playback. Clips can be shared; reusing the same skeleton pose/root cannot produce independent motion.
- For crossfades, reset/play the incoming action, enable it, and fade the outgoing action while the mixer keeps ticking. An immediate `stop()` defeats the outgoing fade; delayed cleanup must be canceled on rapid transitions.
- For one-shot clips, configure LoopOnce/clamping deliberately. Cleanup must remain safe when React Strict Mode replays effects.
- On a demand loop, keep invalidating while actions actually advance; an AnimationMixer does not independently start a Canvas loop. Stop requesting frames for paused/finished actions.
- Do not dispose cached geometry/materials when removing a clone. If cloning introduces owned skeleton GPU resources, release those after their last use; resource ownership is distinct from stopping playback.

Sources: [Drei useAnimations](https://drei.docs.pmnd.rs/abstractions/use-animations), [AnimationAction](https://threejs.org/docs/#AnimationAction), [SkeletonUtils](https://threejs.org/docs/#SkeletonUtils).
