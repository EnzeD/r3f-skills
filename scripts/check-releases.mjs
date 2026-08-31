import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const audit = JSON.parse(await readFile(new URL('../validation/baseline.json', import.meta.url), 'utf8'))
let failures = 0
console.log(`Last reviewed: ${audit.reviewedOn}. This checks public npm's latest stable dist-tags; it does not update files.`)
const results = await Promise.all(Object.entries(audit.packages).map(async ([name, skills]) => {
  const pinned = manifest.devDependencies[name]
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const current = await response.json()
    return { name, pinned, latest: current.version, skills, peers: current.peerDependencies || {} }
  } catch (error) {
    failures++
    return { name, error: error.message }
  }
}))
for (const result of results) {
  if (result.error) { console.error(`${result.name}: unavailable (${result.error})`); continue }
  if (result.pinned === result.latest) console.log(`${result.name}: ${result.pinned} current`)
  else {
    console.log(`${result.name}: ${result.pinned} -> ${result.latest}; review ${result.skills.join(', ')}`)
    console.log(`  New peer requirements: ${JSON.stringify(result.peers)}`)
  }
}
if (failures) process.exitCode = 1
