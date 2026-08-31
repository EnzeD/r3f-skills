// Rubric: r3f-postprocessing
const has = (s, re) => re.test(s)

// Comments are not evidence: a doc block naming <SelectiveBloom> must not satisfy
// "uses SelectiveBloom", and a comment containing '>' must not truncate a prop scan.
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')

// Props can be many lines below the tag and may contain '>' (generics). Scan a window
// after the tag rather than trying to bound the element with a character class.
const propNear = (code, tag, prop, window = 900) => {
  const re = new RegExp(`<${tag}\\b`, 'g')
  let m
  while ((m = re.exec(code)) !== null) {
    const seg = code.slice(m.index, m.index + window)
    const end = seg.search(/\/>|<\//)
    if (new RegExp(`\\b${prop}=`).test(end === -1 ? seg : seg.slice(0, end))) return true
  }
  return false
}

// Each assertion: objectively checkable, named so it reads clearly in the viewer.
export const ASSERTIONS = {
  0: [
    ['Uses SelectiveBloom rather than plain Bloom',
      ({ code }) => has(strip(code), /<SelectiveBloom\b/) ],
    ['Wraps the hovered mesh in <Select> driven by hover state',
      ({ code }) => has(strip(code), /<Select\b/) && has(strip(code), /onPointerOver|onPointerEnter/) ],
    ['Passes the lights prop to SelectiveBloom',
      ({ code }) => propNear(strip(code), 'SelectiveBloom', 'lights') ],
    ['Explains that plain Bloom ignores Selection (luminance-only)',
      ({ answer }) => has(answer, /Bloom/i) && has(answer, /threshold|luminance|does ?n.?t (respect|know|care)|ignores/i) ],
    ['Keeps an equally bright unselected object to prove selectivity',
      ({ code }) => (strip(code).match(/emissive/gi) ?? []).length >= 2 ],
  ],
  1: [
    ['Adds a ToneMapping effect inside the composer',
      ({ code }) => has(strip(code), /<ToneMapping\b/) ],
    ['Identifies that EffectComposer takes over renderer tone mapping',
      ({ answer }) => has(answer, /tone ?mapping/i) && has(answer, /composer|EffectComposer/i) &&
                      has(answer, /disabl|takes over|overrid|sets .*NoToneMapping|turns off/i) ],
    ['Restores ACES filmic to match the pre-composer look',
      ({ code, answer }) => has(strip(code), /ACES_FILMIC|ACESFilmic/) || has(answer, /ACES/i) ],
    ['Does not blame materials or lights for the shift',
      ({ answer }) => !has(answer, /(retune|adjust|change) your (materials|lights)/i) ],
  ],
  2: [
    ['Enables the normal pass required by SSAO',
      ({ code }) => has(strip(code), /enableNormalPass/) ],
    ['DepthOfField target is not a React ref object',
      ({ code }) => { const c = strip(code)
        return !/<DepthOfField\b[\s\S]{0,900}?\btarget=\{\s*[A-Za-z_$][\w$]*Ref\s*\}/.test(c) } ],
    ['Feeds DOF a world position (getWorldPosition / Vector3 / tuple) or Autofocus',
      ({ code }) => has(strip(code), /getWorldPosition|<Autofocus\b/) ||
                    propNear(strip(code), 'DepthOfField', 'target') && has(strip(code), /Vector3|target=\{\[/) ],
    ['Updates focus per frame as the character moves',
      ({ code }) => has(strip(code), /useFrame/) || has(strip(code), /<Autofocus\b/) ],
    ['States that target is a world position, not an object reference',
      ({ answer }) => has(answer, /world[- ]?(space )?position/i) ],
  ],
}

