import assert from 'node:assert/strict'
import { mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const url = server.resolvedUrls.local[0]
let browser
const output = fileURLToPath(new URL('../output/playwright/', import.meta.url))
await mkdir(output, { recursive: true })

try {
  browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
  const problems = []
  page.on('pageerror', error => problems.push(error.message))
  page.on('console', message => { if (message.type() === 'error') problems.push(message.text()) })
  const skills = (await readdir(new URL('../skills/', import.meta.url))).filter(name => name.startsWith('r3f-'))

  // A screenshot alone can pass for an empty canvas; inspect actual rendered pixels.
  async function pixels() {
    return page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      const copy = document.createElement('canvas')
      copy.width = canvas.width; copy.height = canvas.height
      const context = copy.getContext('2d')
      context.drawImage(canvas, 0, 0)
      const data = context.getImageData(0, 0, copy.width, copy.height).data
      let bright = 0
      for (let i = 0; i < data.length; i += 4) if (Math.max(data[i], data[i + 1], data[i + 2]) > 60) bright++
      return bright
    })
  }

  async function objectPosition(name) {
    return page.evaluate(name => {
      const { scene, camera, gl } = window.validation.state
      const object = scene.getObjectByName(name)
      const point = object.position.clone()
      object.getWorldPosition(point)
      const world = point.toArray()
      point.project(camera)
      const rect = gl.domElement.getBoundingClientRect()
      return { world, x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 }
    }, name)
  }

  for (const skill of skills) {
    problems.length = 0
    await page.goto(`${url}?skill=${skill}`)
    await page.locator('canvas').waitFor()
    if (skill !== 'r3f-fundamentals') {
      await page.waitForFunction(() => (window.validation?.frames || 0) > 2)
      await page.waitForFunction(() => {
        let meshes = 0
        window.validation.state.scene.traverse(object => { if (object.isMesh || object.isInstancedMesh) meshes++ })
        return meshes > 0
      })
      await page.waitForFunction(() => window.validation.state.gl.info.render.calls > 0)
      // Wait for deferred effects/loaders to commit, then require visible geometry.
      await page.waitForTimeout(250)
      assert.ok(await pixels() > 200, `${skill}: no visible geometry`)
    } else await page.waitForTimeout(350)

    if (skill === 'r3f-animation') {
      await page.waitForFunction(() => window.validation.state.scene.getObjectByName('moving-box').position.x === -1)
      const start = await objectPosition('moving-box')
      await page.mouse.click(start.x, start.y)
      await page.waitForFunction(() => window.validation.state.scene.getObjectByName('moving-box').position.x === 1)
      const frames = await page.evaluate(() => window.validation.frames)
      await page.waitForTimeout(200)
      assert.ok((await page.evaluate(() => window.validation.frames)) - frames <= 2, 'demand animation did not return to idle')
    }
    if (skill === 'r3f-interaction') {
      const position = await objectPosition('selectable-box')
      const color = () => page.evaluate(() => window.validation.state.scene.getObjectByName('selectable-box').material.color.getHex())
      const before = await color()
      await page.mouse.click(position.x, position.y)
      await page.waitForFunction(before => window.validation.state.scene.getObjectByName('selectable-box').material.color.getHex() !== before, before)
    }
    if (skill === 'r3f-loaders') {
      const clones = await page.evaluate(() => {
        const meshes = []
        window.validation.state.scene.traverse(object => { if (object.isMesh) meshes.push(object) })
        return { count: meshes.length, distinct: meshes[0] !== meshes[1], sharedGeometry: meshes[0].geometry === meshes[1].geometry }
      })
      assert.equal(clones.count, 2)
      assert.ok(clones.distinct && clones.sharedGeometry, 'loader clones lost intended ownership')
    }
    if (skill === 'r3f-physics') {
      await page.waitForFunction(() => {
        const object = window.validation.state.scene.getObjectByName('physics-box')
        return object && Math.abs(object.parent.position.y - 0.5) < 0.05
      })
      // First contact may still have downward velocity; let the small rebound settle.
      await page.waitForTimeout(750)
      const position = await objectPosition('physics-box')
      await page.mouse.click(position.x, position.y)
      await page.waitForFunction(() => window.validation.state.scene.getObjectByName('physics-box').parent.position.y > 0.7)
    }
    if (skill === 'r3f-postprocessing') {
      const selected = await objectPosition('bloom-selected')
      const control = await objectPosition('bloom-control')
      async function halo(position) {
        return page.evaluate(({ x, y }) => {
          const canvas = document.querySelector('canvas')
          const rect = canvas.getBoundingClientRect()
          const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height
          const context = copy.getContext('2d'); context.drawImage(canvas, 0, 0)
          // Sample the ring just outside the 0.7-unit box, not its bright center.
          const data = context.getImageData(Math.round(x - rect.left + 28), Math.round(y - rect.top - 8), 12, 16).data
          let total = 0
          for (let i = 0; i < data.length; i += 4) total += data[i] + data[i + 1] + data[i + 2]
          return total / (data.length / 4 * 3)
        }, position)
      }
      const selectedBefore = await halo(selected)
      const controlBefore = await halo(control)
      assert.ok(selectedBefore > controlBefore + 5, `selection did not isolate bloom: ${selectedBefore} vs ${controlBefore}`)
      await page.screenshot({ path: `${output}bloom-selected.png` })
      await page.mouse.click(selected.x, selected.y)
      await page.waitForTimeout(250)
      assert.ok(await halo(selected) < selectedBefore - 5, 'deselecting did not remove bloom')
    }

    await page.screenshot({ path: `${output}${skill}.png` })
    await page.getByRole('button', { name: 'Unmount', exact: true }).click()
    await page.waitForTimeout(100)
    await page.getByRole('button', { name: 'Mount', exact: true }).click()
    await page.waitForTimeout(350)
    if (skill !== 'r3f-fundamentals') assert.ok(await pixels() > 200, `${skill}: failed after remount`)
    assert.deepEqual(problems, [], `${skill}: browser errors`)
    console.log(`PASS ${skill}: render and Strict Mode remount; applicable behavior checks passed`)
  }
} finally {
  await browser?.close()
  await server.close()
}
