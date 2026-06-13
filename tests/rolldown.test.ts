import path from 'node:path'
import { rolldownBuild, testFixtures } from '@sxzz/test-utils'
import { describe, expect } from 'vitest'
import { wasm } from '../src/index.ts'
import type { TreeshakingOptions } from 'rolldown'

const { dirname } = import.meta
const treeshake: TreeshakingOptions = {
  moduleSideEffects: false,
}

describe('rolldown', async () => {
  await testFixtures(
    'init.js',
    async (args, id) => {
      const { snapshot } = await rolldownBuild(
        id,
        [
          wasm({
            maxFileSize: 0,
            fileName: 'assets/[hash][extname]',
          }),
        ],
        {
          platform: args.platform,
          treeshake,
        },
      )
      await expect(snapshot).toMatchFileSnapshot(
        path.resolve(dirname, '__snapshots__/init/', `${args.platform}.snap`),
      )
      return snapshot
    },
    {
      cwd: path.resolve(dirname, 'fixtures'),
      promise: true,
      params: [['platform', ['node', 'browser', 'neutral']]],
      snapshot: false,
    },
  )

  await testFixtures(
    ['*.js', '!init.js'],
    async (args, id) => {
      const { snapshot } = await rolldownBuild(id, [wasm({ maxFileSize: 0 })], {
        platform: 'browser',
        external: ['\0wasm-helpers.js'],
        treeshake,
      })
      return snapshot
    },
    {
      cwd: path.resolve(dirname, 'fixtures'),
      promise: true,
    },
  )
})
