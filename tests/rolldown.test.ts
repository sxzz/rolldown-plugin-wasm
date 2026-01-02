import path from 'node:path'
import { rolldownBuild, testFixtures } from '@sxzz/test-utils'
import { describe } from 'vitest'
import { wasm } from '../src'

const { dirname } = import.meta

describe('rolldown', async () => {
  await testFixtures(
    '*.js',
    async (args, id) => {
      const { snapshot } = await rolldownBuild(
        id,
        [
          wasm({
            maxFileSize: 0,
            wasmBindgen: id.includes('wasm-bindgen'),
          }),
        ],
        { platform: args.platform },
      )
      return snapshot
    },
    {
      cwd: path.resolve(dirname, 'fixtures'),
      promise: true,
      params: [['platform', ['node', 'browser', 'neutral']]],
    },
  )
})
