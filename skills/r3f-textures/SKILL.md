---
name: r3f-textures
description: Configure textures in React Three Fiber, including color spaces, UV channels, sampling, video, and render targets. Use for texture appearance or memory issues; use loader guidance for model-loading workflows.
---

# React Three Fiber textures

Inspect installed Three.js, Fiber, Drei, and renderer versions first. Examples target Fiber 9 / React 19 and Three.js r185 with WebGL. Preserve correctly configured assets rather than resetting every texture.

## Color versus data

| Texture content | Color-space annotation |
| --- | --- |
| PNG/JPEG base color or emissive color | `SRGBColorSpace` |
| Roughness, metalness, normal, AO, alpha/masks | `NoColorSpace` |
| Linear HDR/EXR lighting data | Preserve loader-provided linear metadata |

`NoColorSpace` is not another name for `LinearSRGBColorSpace`: scalar/vector data has no color space. Do not blanket-convert every map to sRGB.

## Load a color map

Mount under Suspense inside Canvas. The file path is an application asset, not a file provided by this skill.

```tsx
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'

export default function Example() {
  const map = useTexture('/textures/checker.png', (texture) => {
    // This URL is consistently used as a color texture by all consumers.
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  })
  return (
    <mesh>
      <planeGeometry args={[3, 3]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}
```

Fiber handles common built-in color map props, and glTF loaders set texture metadata. Explicit annotation is especially important for custom shader uniforms or manually created textures.

## Cache and ownership

- `useTexture`/`useLoader` cache by loader and URL inputs. The same source can return the same Texture object. Repeat, offset, wrapping, filters, and colorSpace changes can affect every consumer.
- Clone the Texture object before per-instance configuration. Reuse the underlying image where possible; separately dispose only the clone you own. Do not dispose the cached source from an individual consumer.
- Do not clear a loader cache during render. Cache eviction and GPU disposal are separate operations and require knowing that no active consumer still needs the resource.
- Avoid replacing the uniform/texture object every frame; update offsets or owned values directly. On a demand loop, invalidate after imperative changes.

## UVs and sampling

- `texture.channel = 0` selects `uv`, 1 selects `uv1`, then `uv2` and `uv3`. Choose the actual geometry attribute; AO/light maps no longer universally require copying `uv` into `uv2`.
- Repeat outside [0, 1] requires RepeatWrapping or MirroredRepeatWrapping. Offset/repeat/rotation are texture transforms; atlas animations generally do not need React state per frame.
- Wrapping, color-space, and upload configuration changes may need `texture.needsUpdate`. Offset/repeat changes use the texture matrix and do not normally require re-uploading image data.
- For pixel art, use nearest filtering deliberately. For minified surfaces, mipmaps reduce shimmer; cap anisotropy to the renderer's supported maximum and the scene's needs.
- Power-of-two dimensions are not a universal WebGL2 requirement. Size textures for screen coverage, memory, compression-format constraints, and quality rather than an obsolete blanket rule.
- Download size is not GPU memory size. Consider KTX2/Basis where supported; configure renderer capability detection and host decoder/transcoder assets deliberately.
- For a replacement glTF color map, match the model's UV/orientation conventions; a manually loaded texture commonly needs `flipY=false`. Do not flip already configured glTF maps again.

## Specialized textures

- Prefer `useVideoTexture` when its lifecycle fits. Check autoplay/muting, CORS, user gestures, and source cleanup; changing video resolution may require a new texture. Do not promise autoplay succeeds on every browser.
- Canvas/DataTexture content changes need `needsUpdate`; data textures should keep data color-space semantics. Creating a texture in a frame loop leaks work/resources unless deliberately managed.
- For render targets, read [offscreen rendering](references/render-targets.md). Never sample from a texture while rendering into that same target.
- Keep environment maps on a lighting path (`Environment`/`useEnvironment`) rather than assigning a regular 2D image without a suitable mapping/PMREM workflow.

## Verify

Test a known color swatch, data maps under changing lights, texture orientation, repeated mounts, and two consumers with different UV transforms. Inspect GPU texture counts; they are counts, not byte-accurate memory measurements.

## Sources

- [Color management](https://threejs.org/manual/en/color-management.html), [Texture](https://threejs.org/docs/#Texture).
- [Drei useTexture](https://drei.docs.pmnd.rs/loaders/texture-use-texture), [useVideoTexture](https://drei.docs.pmnd.rs/loaders/video-texture-use-video-texture).
- [Fiber 9 texture changes](https://github.com/pmndrs/react-three-fiber/blob/v9.7.0/docs/tutorials/v9-migration-guide.mdx).
