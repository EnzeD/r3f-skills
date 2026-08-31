import { BoxGeometry } from 'three'

// Tiny, generated local assets keep smoke checks independent of CDNs and licenses.
export function modelFixture() {
  const geometry = new BoxGeometry(1, 1, 1).toNonIndexed()
  const positions = Buffer.from(geometry.attributes.position.array.buffer)
  const normals = Buffer.from(geometry.attributes.normal.array.buffer)
  const binary = Buffer.concat([positions, normals])
  const model = {
    asset: { version: '2.0', generator: 'r3f-skills validation' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'FixtureBox' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 0.25, 0.1, 1], metallicFactor: 0, roughnessFactor: 0.8 } }],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length }, { buffer: 0, byteOffset: positions.length, byteLength: normals.length }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 12, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5126, count: normals.length / 12, type: 'VEC3' },
    ],
  }
  const json = Buffer.from(JSON.stringify(model))
  const padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)])
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + padded.length + 8 + binary.length, 8)
  header.writeUInt32LE(padded.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16)
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binary.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)
  geometry.dispose()
  return Buffer.concat([header, padded, binHeader, binary])
}

export function fixtureAssets() {
  const glb = modelFixture()
  return {
    name: 'local-validation-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === '/models/robot.glb') {
          response.setHeader('Content-Type', 'model/gltf-binary')
          response.end(glb)
        } else if (request.url === '/textures/checker.png') {
          response.setHeader('Content-Type', 'image/png')
          // A generated 2x2 coral/white RGBA checkerboard.
          response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAE0lEQVR4nGP4Xx/wHwQYwCSQAwB6Yw2Tg5dsvQAAAABJRU5ErkJggg==', 'base64'))
        } else if (request.url === '/favicon.ico') {
          response.statusCode = 204
          response.end()
        } else next()
      })
    },
  }
}
