// Rubric: r3f-shaders
// Predictions recorded before results were seen:
//   eval-0 baseline expected to emit removed Object3DNode / global JSX augmentation
//   eval-1 baseline expected to omit <colorspace_fragment> or hand-roll pow(c, 1/2.2)
//   eval-2 baseline expected to omit customDepthMaterial and mishandle CPU-side raycasting
const has = (s, re) => re.test(s)

// Comments are not evidence.
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')

export const ASSERTIONS = {
  0: [
    ['Avoids removed Object3DNode typing',
      ({ code }) => !has(strip(code), /Object3DNode/) ],
    ['Avoids removed global JSX.IntrinsicElements augmentation',
      ({ code }) => !has(strip(code), /namespace\s+JSX|JSX\.IntrinsicElements/) ],
    ['Uses a Fiber 9 typing path (extend component or ThreeElement/ThreeElements)',
      ({ code }) => has(strip(code), /\bextend\s*\(/) || has(strip(code), /ThreeElement\b|ThreeElements\b/) ],
    ['Animates the time uniform by mutation inside useFrame',
      ({ code }) => has(strip(code), /useFrame/) && !has(strip(code), /useFrame\([\s\S]{0,400}?set[A-Z]\w*\(/) ],
    ['Declares uniforms with a color and a time value',
      ({ code }) => has(strip(code), /uTime|time/i) && has(strip(code), /uColor|color/i) ],
  ],
  1: [
    ['Applies the output color-space conversion chunk',
      ({ code }) => has(strip(code), /colorspace_fragment|encodings_fragment|outputColorSpace/) ],
    ['Applies the tone mapping chunk',
      ({ code }) => has(strip(code), /tonemapping_fragment/) ],
    ['Explanation names output color space or tone mapping as the cause',
      ({ answer }) => has(answer, /colou?r ?space|sRGB|linear|tone ?map/i) ],
    ['Does not double-correct with a hand-rolled gamma pow alongside the chunk',
      ({ code }) => !(has(strip(code), /colorspace_fragment/) && has(strip(code), /pow\s*\([^)]*1\.0\s*\/\s*2\.2|pow\s*\([^)]*0\.4545/)) ],
    ['Does not blame the hex value or suggest picking a different colour',
      ({ answer }) => !has(answer, /(pick|choose|use) a different (hex|colou?r)/i) ],
  ],
  2: [
    ['Supplies a customDepthMaterial (or depth onBeforeCompile) so shadows follow the displacement',
      ({ code }) => has(strip(code), /customDepthMaterial|customDistanceMaterial|MeshDepthMaterial/) ],
    ['Depth path reuses the same displacement as the render vertex shader',
      ({ code, answer }) => has(strip(code), /customDepthMaterial|customDistanceMaterial/) &&
                            (has(strip(code), /displace|noise|hill/i) || has(answer, /same (vertex )?(shader|displacement)/i)) ],
    ['Explains that raycasting uses CPU-side geometry the GPU displacement never touches',
      ({ answer }) => has(answer, /raycast/i) && has(answer, /cpu|gpu|geometry attribute|position attribute|does ?n.?t know|unaware|never sees/i) ],
    ['Offers a CPU-side approach for correct picking',
      ({ code, answer }) => has(strip(code), /raycast|computeBoundingSphere|setAttribute|needsUpdate/) ||
                            has(answer, /same noise (function )?(on|in) (the )?(cpu|js)|displace the (geometry|attribute) on the cpu|custom raycast/i) ],
    ['Mentions stale bounds / culling after displacement',
      ({ code, answer }) => has(strip(code), /computeBoundingSphere|computeBoundingBox|frustumCulled/) ||
                            has(answer, /bounding (sphere|box)|frustum cull/i) ],
  ],
}
