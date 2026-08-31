// Generic eval grader for the r3f skills.
//   node evals/grade.mjs --rubric shaders --iteration evals/workspace/shaders-iteration-1
// Two kinds of check:
//   - typecheck: the real tsc, against this repo's pinned Fiber / three / drei versions
//   - rubric:    per-skill predicates over Solution.tsx and ANSWER.md
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const root = process.cwd()
const rubricName = arg('rubric', 'postprocessing')
const iteration = arg('iteration', 'evals/workspace/iteration-1')
const stage = path.join(root, '.generated-eval')
const configs = ['with_skill', 'without_skill']

const { ASSERTIONS } = await import(`./rubrics/${rubricName}.mjs`)

await rm(stage, { recursive: true, force: true })
await mkdir(stage, { recursive: true })

const units = []
for (const dir of (await readdir(path.join(root, iteration), { withFileTypes: true }))
                    .filter(d => d.isDirectory() && d.name.startsWith('eval-'))) {
  const id = Number(dir.name.split('-')[1])
  for (const cfg of configs) {
    const out = path.join(root, iteration, dir.name, cfg, 'outputs')
    const sol = path.join(out, 'Solution.tsx')
    const ans = path.join(out, 'ANSWER.md')
    // Grade only complete runs; a half-written run scores spurious FAILs on prose checks.
    if (!existsSync(sol) || !existsSync(ans)) { units.push({ id, cfg, missing: true }); continue }
    const stamp = `${dir.name}__${cfg}`
    await writeFile(path.join(stage, `${stamp}.tsx`), await readFile(sol, 'utf8'))
    units.push({
      id, cfg, stamp, dir: path.join(root, iteration, dir.name, cfg),
      code: await readFile(sol, 'utf8'),
      answer: await readFile(ans, 'utf8'),
    })
  }
}

await writeFile(path.join(stage, 'tsconfig.json'), JSON.stringify({
  extends: '../tsconfig.json',
  compilerOptions: { noEmit: true },
  include: ['./*.tsx'],
}, null, 2))

let tscOut = ''
try {
  execFileSync('npx', ['tsc', '--noEmit', '-p', path.join(stage, 'tsconfig.json')],
               { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
} catch (e) { tscOut = `${e.stdout ?? ''}${e.stderr ?? ''}` }
const errorsFor = (stamp) => tscOut.split('\n').filter(l => l.includes(`${stamp}.tsx`) && /error TS/.test(l))

const report = []
for (const u of units) {
  if (u.missing) { report.push({ eval_id: u.id, config: u.cfg, missing: true, expectations: [] }); continue }
  const tsErrors = errorsFor(u.stamp)
  const expectations = [{
    text: 'Type-checks against the pinned stack (Fiber 9.7 / three r185)',
    passed: tsErrors.length === 0,
    evidence: tsErrors.length ? tsErrors.slice(0, 4).join('\n') : 'tsc reported no errors',
  }]
  for (const [text, fn] of ASSERTIONS[u.id]) {
    let passed = false
    try { passed = !!fn(u) } catch { passed = false }
    expectations.push({ text, passed, evidence: passed ? 'matched in output' : 'not found in Solution.tsx / ANSWER.md' })
  }
  const grading = {
    eval_id: u.id, config: u.cfg,
    passed: expectations.filter(e => e.passed).length,
    total: expectations.length,
    expectations,
  }
  await writeFile(path.join(u.dir, 'grading.json'), JSON.stringify(grading, null, 2))
  report.push(grading)
}
await writeFile(path.join(root, iteration, 'grading-summary.json'), JSON.stringify(report, null, 2))

for (const r of report) {
  if (r.missing) { console.log(`eval-${r.eval_id} ${r.config.padEnd(14)} INCOMPLETE`); continue }
  console.log(`eval-${r.eval_id} ${r.config.padEnd(14)} ${r.passed}/${r.total}`)
  for (const e of r.expectations) console.log(`   ${e.passed ? 'PASS' : 'FAIL'}  ${e.text}`)
}
