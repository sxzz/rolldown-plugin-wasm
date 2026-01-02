/// <reference lib="dom" />

import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createContext, SourceTextModule } from 'node:vm'
import { rolldownBuild, testFixtures } from '@sxzz/test-utils'
import { describe, expect, test } from 'vitest'
import { wasm } from '../src'

const wasmPath = path.resolve(import.meta.dirname, 'fixtures/add.wasm')
const atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

describe('e2e', () => {
  describe.each(['node', 'browser'] as const)(
    'platform: %s',
    async (platform) => {
      await testFixtures(
        '*.js',
        async (args, id) => {
          await e2e(id, platform, 0)
        },
        {
          cwd: path.resolve(import.meta.dirname, 'fixtures'),
          promise: true,
          snapshot: false,
        },
      )

      test('maxFileSize = 0', async () => {
        await e2e(
          path.resolve(import.meta.dirname, 'fixtures/init.js'),
          platform,
          0,
        )
      })
    },
  )
})

async function e2e(
  entry: string,
  platform: 'node' | 'browser',
  maxFileSize?: number,
) {
  const { chunks } = await rolldownBuild(entry, [wasm({ maxFileSize })], {
    platform,
    treeshake: {
      moduleSideEffects: false,
    },
  })

  const code = chunks[0].code
  const mod = new SourceTextModule(code, {
    context: createContext({
      atob: platform === 'browser' ? atob : undefined,
      fetch:
        platform === 'browser' && maxFileSize === 0
          ? async () => {
              const buf = await readFile(wasmPath)
              return new Response(buf, {
                headers: { 'Content-Type': 'application/wasm' },
              })
            }
          : undefined,
      process:
        platform === 'node'
          ? {
              getBuiltinModule: (name: string) => {
                if (name === 'buffer') return { Buffer }
                if (name === 'path') return path
                else if (name === 'fs/promises') {
                  return { readFile: () => readFile(wasmPath) }
                }

                throw new Error(`Unsupported module: ${name}`)
              },
            }
          : undefined,
    }),
    initializeImportMeta: (meta) => {
      meta.dirname = process.cwd()
    },
  })
  await mod.link((spec) => {
    throw new Error(`No imports expected: ${spec}`)
  })
  await mod.evaluate()
  const exported = (mod.namespace as any).default

  const init = entry.includes('init')
  const sync = entry.includes('sync')

  if (init) {
    const ret = exported()
    if (sync) {
      expect(ret).a('WebAssembly.Instance')
    } else {
      await expect(ret).resolves.a('WebAssembly.Instance')
    }

    const instance: WebAssembly.Instance = await ret
    expect((instance.exports as any).add(1, 2)).toBe(3)
  } else {
    expect(Object.keys(exported)).toEqual(['add', 'memory'])
    expect(exported.add(1, 2)).toBe(3)
  }
}
