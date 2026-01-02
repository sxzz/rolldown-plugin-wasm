import path from 'node:path'
import { rolldownBuild, testFixtures } from '@sxzz/test-utils'
import { describe, expect } from 'vitest'
import { wasm } from '../src'

const { dirname } = import.meta

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
      })
      return snapshot
    },
    {
      cwd: path.resolve(dirname, 'fixtures'),
      promise: true,
    },
  )
})
