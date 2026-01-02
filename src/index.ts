import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { toArray } from '@antfu/utils'
import { getHelpersModule, HELPERS_ID, HELPERS_ID_RE } from './helper'
import type { Options } from './options'
import type { Plugin } from 'rolldown'

const postfixRE = /[#?].*$/s
function cleanUrl(url: string): string {
  return url.replace(postfixRE, '')
}

const RE_SYNC = /\?sync$/

export function wasm(options: Options = {}): Plugin {
  let {
    include = [/\.wasm(\?sync)?$/],
    exclude,
    maxFileSize = 14 * 1024,
    publicPath = '',
    targetEnv,
    fileName = '[hash][extname]',
  } = options

  const copies: Record<
    string,
    {
      filename: string
      publicFilepath: string
      buffer: Buffer
    }
  > = Object.create(null)

  return {
    name: 'wasm',

    buildStart(options) {
      if (targetEnv == null) {
        switch (options.platform) {
          case 'browser':
            targetEnv = 'browser'
            break
          case 'node':
            targetEnv = 'node'
            break
          default:
            targetEnv = 'auto'
        }
      }
    },

    resolveId: {
      filter: { id: [HELPERS_ID_RE, RE_SYNC] },
      async handler(id, ...args) {
        if (RE_SYNC.test(id)) {
          const resolved = await this.resolve(cleanUrl(id), ...args)
          if (resolved) {
            resolved.meta.wasmSync = true
          }
          return resolved
        }
        return id
      },
    },

    load: {
      filter: {
        id: {
          include: [...toArray(include), HELPERS_ID],
          exclude,
        },
      },
      async handler(id) {
        if (id === HELPERS_ID) {
          return getHelpersModule(targetEnv || 'auto')
        }

        this.addWatchFile(id)

        const buffer = await readFile(id)
        if (targetEnv === 'auto-inline') {
          return buffer.toString('binary')
        }

        if ((maxFileSize && buffer.length > maxFileSize) || maxFileSize === 0) {
          const hash = createHash('sha1')
            .update(buffer)
            .digest('hex')
            .slice(0, 16)
          const ext = path.extname(id)
          const name = path.basename(id, ext)

          const outputFileName = fileName
            .replaceAll('[hash]', hash)
            .replaceAll('[extname]', ext)
            .replaceAll('[name]', name)

          const publicFilepath = `${publicPath}${outputFileName}`

          // only copy if the file is not marked `sync`, `sync` files are always inlined
          const isSync = !!this.getModuleInfo(id)?.meta?.wasmSync
          if (!isSync) {
            copies[id] = {
              filename: outputFileName,
              publicFilepath,
              buffer,
            }
          }
        }

        return buffer.toString('binary')
      },
    },

    transform: {
      filter: { id: { include, exclude } },
      handler(code, id) {
        const isSync = !!this.getModuleInfo(id)?.meta?.wasmSync
        const publicFilepath = copies[id]
          ? `'${copies[id].publicFilepath}'`
          : null
        let src: string | null

        if (publicFilepath === null) {
          src = `'${Buffer.from(code, 'binary').toString('base64')}'`
        } else {
          if (isSync) {
            this.error('non-inlined files can not be `sync`.')
          }
          src = null
        }

        return {
          map: {
            mappings: '',
          },
          code: `import { loadWasmModule } from ${JSON.stringify(HELPERS_ID)};
export default function(imports){return loadWasmModule(${isSync}, ${publicFilepath}, ${src}, imports)}`,
        }
      },
    },

    generateBundle() {
      for (const copy of Object.values(copies)) {
        this.emitFile({
          type: 'asset',
          source: copy.buffer,
          name: 'Rolldown WASM Asset',
          fileName: copy.filename,
        })
      }
    },
  }
}
