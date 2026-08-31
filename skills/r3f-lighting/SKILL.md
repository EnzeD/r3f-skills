---
name: r3f-lighting
description: Light React Three Fiber scenes with direct lights, environment maps, and shadows. Use for light placement, image-based lighting, shadow artifacts, and lighting performance.
---

# React Three Fiber lighting

Check installed Three.js, Fiber, and Drei versions and the renderer first. This example targets Fiber 9 / React 19, Three.js r185, and WebGL.

## Start with a deliberate lighting setup

- Use environment lighting for PBR reflections/fill and direct lights for direction and real-time shadowing. More ambient light will not restore missing metallic reflections.
- A scene background and `scene.environment` serve different purposes. Drei `Environment` assigns lighting; `background` additionally makes it visible behind the scene.
- Prefer an owned HDR/EXR asset in production. Drei presets are useful for prototyping but depend on external hosting. Check loader support before choosing newer formats.
- `Sky` is visible sky geometry, not automatically a matching sun light or environment. Align the sky, direct light, and environment when visual consistency matters.

## Shadowed scene

Mount inside `<Canvas shadows="percentage">`. On Three.js r182+, PCFShadowMap is soft; Fiber 9's bare `shadows` selects the deprecated PCFSoftShadowMap.

```tsx
export default function Example() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-normalBias={0.02}
      />
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="coral" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="silver" />
      </mesh>
    </>
  )
}
```

Bias and frustum values above are for this small scene; retune them for actual dimensions.

## Shadows and light targets

- Shadow mapping needs renderer shadows enabled, a shadow-casting light, casting meshes, and receiving materials/meshes. Ambient and hemisphere lights do not cast shadows.
- Tighten the shadow camera to the useful region before increasing map resolution. Inspect its frustum with a CameraHelper; bias should address acne without detaching shadows from objects.
- Point-light shadows render six directions. Limit shadow-casting lights and large maps; cost depends on affected geometry and passes, not just light count.
- Moving a directional/spot light's target requires a target Object3D whose world matrix updates. Add a custom target to the scene graph; changing only a detached target's position can leave its world transform stale.
- With WebGL, RectAreaLight affects Standard/Physical materials and does not cast built-in shadows. Initialize `RectAreaLightUniformsLib` when using the native light path that requires it.
- Object/camera layers are not general per-light material masks in WebGLRenderer. Do not promise that matching a light layer to a mesh makes selective illumination work.

## Environment and helper cost

- Drei `Lightformer` is emissive geometry captured into an Environment; it is not an ordinary real-time light and does not cast direct-light shadows.
- Set `frames={1}` for genuinely static environment captures or ContactShadows. Animated objects/lighting need recapture; a frozen capture will remain stale.
- ContactShadows renders an offscreen depth/blur approximation. It is not free and does not replace all directional shadows.
- AccumulativeShadows converges across samples; changing the scene can require reset/reaccumulation. BakeShadows freezes updates rather than producing a portable baked lightmap.
- SoftShadows patches WebGL shader code. Verify it against the installed Three.js shadow implementation before adding it, especially after a renderer upgrade.
- Keep tone mapping/exposure consistent while tuning lights. Current physically based light intensities should not be mixed blindly with old legacy-light tutorials.

## Verify

Check shadow contact, acne, clipping, loaded-model cast/receive flags, and moving objects. Compare static versus animated capture behavior and measure total render passes on the target device.

## Sources

- [Drei Environment](https://drei.docs.pmnd.rs/staging/environment), [ContactShadows](https://drei.docs.pmnd.rs/staging/contact-shadows).
- [Three.js shadows](https://threejs.org/manual/en/shadows.html), [RectAreaLight](https://threejs.org/docs/#RectAreaLight), [DirectionalLight](https://threejs.org/docs/#DirectionalLight).
- [Migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) — PCF changes in r182 and environment rotation changes in r184.
