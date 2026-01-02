/// <reference lib="dom" />

import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createContext, SourceTextModule } from 'node:vm'
import { rolldownBuild } from '@sxzz/test-utils'
import { describe, expect, test } from 'vitest'
import { wasm } from '../src'

const wasmPath = path.resolve(import.meta.dirname, 'fixtures/hello-world.wasm')
const atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

describe('e2e', () => {
  describe.each(['node', 'browser'] as const)('platform: %s', (platform) => {
    test.each([true, false] as const)('sync = %s', async (sync) => {
      await e2e(platform, sync)
    })

    test('maxFileSize = 0', async () => {
      await e2e(platform, false, 0)
    })
  })
})

async function e2e(
  platform: 'node' | 'browser',
  sync: boolean,
  maxFileSize?: number,
) {
  const { chunks } = await rolldownBuild(
    path.resolve(
      import.meta.dirname,
      sync ? 'fixtures/sync.js' : 'fixtures/basic.js',
    ),
    [wasm({ maxFileSize })],
    { platform },
  )

  const mod = new SourceTextModule(chunks[0].code, {
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
  await mod.link(() => {
    throw new Error('No imports expected')
  })
  await mod.evaluate()

  {
    // module
    const ret = (mod.namespace as any).default()
    expect(ret).a(sync ? 'WebAssembly.Module' : 'Promise')

    const wasmModule: WebAssembly.Module = await ret
    const instance = await WebAssembly.instantiate(wasmModule)
    expect((instance.exports as any).add(1, 2)).toBe(3)
  }

  {
    // instance
    const ret = (mod.namespace as any).default({})
    expect(ret).a(sync ? 'WebAssembly.Instance' : 'Promise')

    const instance = await ret
    expect(instance).a('WebAssembly.Instance')
    expect((instance.exports as any).add(1, 2)).toBe(3)
  }
}
