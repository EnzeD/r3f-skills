import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const root = fileURLToPath(new URL('../', import.meta.url))
const generated = path.join(root, '.generated')
let errors = 0
let examples = 0
let totalLines = 0
const entries = []
const fail = (file, message) => { console.error(`${file}: ${message}`); errors++ }

// Only this generated directory is replaced; skill files are read-only inputs.
await rm(generated, { recursive: true, force: true })
await mkdir(generated, { recursive: true })

async function checkMarkdown(file, skillDir) {
  const text = await readFile(file, 'utf8')
  const relative = path.relative(root, file)
  if (path.basename(file) === 'SKILL.md') {
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    try {
      if (!frontmatter) throw new Error('missing YAML frontmatter')
      const metadata = parse(frontmatter[1])
      if (metadata?.name !== path.basename(skillDir)) throw new Error('name must match the skill directory')
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) || metadata.name.length > 64) throw new Error('invalid skill name')
      if (typeof metadata.description !== 'string' || !metadata.description.trim()) throw new Error('missing description')
    } catch (error) { fail(relative, error.message) }
    const lines = text.trimEnd().split('\n').length
    totalLines += lines
    if (lines > 200) console.warn(`${relative}: ${lines} lines exceeds the soft 200-line budget; review the added context`)
  }
  for (const match of text.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1]
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const local = path.resolve(path.dirname(file), decodeURIComponent(target.split('#')[0]))
    if (!local.startsWith(skillDir + path.sep)) fail(relative, `reference leaves independently installable skill: ${target}`)
    try { await stat(local) } catch { fail(relative, `missing local reference: ${target}`) }
  }
  // Each TS/TSX fence is a standalone module. No invisible imports or unchecked snippets.
  const fences = text.matchAll(/^```(tsx?|jsx?|[^\n]*)\n([\s\S]*?)^```\s*$/gm)
  let index = 0
  for (const [, language, code] of fences) {
    if (language === 'js' || language === 'jsx') fail(relative, 'use a checked TypeScript example instead of an unchecked JS fence')
    if (!['ts', 'tsx'].includes(language)) continue
    const name = `${path.basename(skillDir)}-${path.basename(file, '.md')}-${index++}`
    await writeFile(path.join(generated, `${name}.${language}`), code)
    examples++
    if (language === 'tsx' && path.basename(file) === 'SKILL.md' && index === 1) {
      entries.push({ name: path.basename(skillDir), module: `./${name}.tsx`, ownsCanvas: path.basename(skillDir) === 'r3f-fundamentals' })
    }
  }
}

async function walk(directory, skillDir) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) await walk(file, skillDir)
    else if (entry.name.endsWith('.md')) await checkMarkdown(file, skillDir)
  }
}
const skills = (await readdir(path.join(root, 'skills'), { withFileTypes: true })).filter(entry => entry.isDirectory())
for (const skill of skills) {
  const directory = path.join(root, 'skills', skill.name)
  try { await stat(path.join(directory, 'SKILL.md')) } catch { fail(skill.name, 'missing SKILL.md') }
  await walk(directory, directory)
}
await writeFile(path.join(generated, 'examples.ts'), entries.map((entry, i) => `import Example${i} from '${entry.module}'`).join('\n') +
  '\nexport const examples = {\n' + entries.map((entry, i) => `  '${entry.name}': { Component: Example${i}, ownsCanvas: ${entry.ownsCanvas} },`).join('\n') + '\n}\n')
console.log(`${skills.length} skills, ${totalLines} entrypoint lines, ${examples} extracted TypeScript examples; ${errors} structural errors.`)
if (errors) process.exitCode = 1
