import { defineConfig } from 'vite'
import { fixtureAssets } from './validation/assets.mjs'

export default defineConfig({ plugins: [fixtureAssets()] })
