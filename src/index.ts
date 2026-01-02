import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { id, include, or } from 'rolldown/filter'
import { getHelpersModule, HELPERS_ID, HELPERS_ID_RE } from './helper'
import { parseWasm, type WasmInfo } from './wasm-parser'
import type { Options } from './options'
import type { Plugin } from 'rolldown'

function parseId(
  url: string,
): [file: string, query: string | undefined, params: URLSearchParams] {
  const [file, query] = url.split('?')
  const params = new URLSearchParams(query)
  return [file, query, params]
}

export function wasm(options: Options = {}): Plugin {
  let {
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
      filter: [
        include(or(id(HELPERS_ID_RE), id(/\.wasm$/, { cleanUrl: true }))),
      ],

      async handler(id, ...args) {
        if (id === HELPERS_ID) {
          return id
        }

        const [file, query] = parseId(id)
        if (!query) return

        const resolved = await this.resolve(file, ...args)
        if (resolved) {
          resolved.id += `?${query}`
        }

        return resolved
      },
    },

    load: {
      filter: [
        include(or(id(HELPERS_ID_RE), id(/\.wasm$/, { cleanUrl: true }))),
      ],

      async handler(id) {
        if (id === HELPERS_ID) {
          return getHelpersModule(targetEnv || 'auto')
        }

        const [file, , params] = parseId(id)
        const buffer = await readFile(file)
        const isInit = params.has('init')

        this.addWatchFile(file)
        if (!isInit) {
          this.getModuleInfo(id)!.meta.wasmInfo = await parseWasm(buffer)
        }

        if (targetEnv === 'auto-inline') {
          return buffer.toString('binary')
        }

        if ((maxFileSize && buffer.length > maxFileSize) || maxFileSize === 0) {
          const hash = createHash('sha1')
            .update(buffer)
            .digest('hex')
            .slice(0, 16)
          const ext = path.extname(file)
          const name = path.basename(file, ext)

          const outputFileName = fileName
            .replaceAll('[hash]', hash)
            .replaceAll('[extname]', ext)
            .replaceAll('[name]', name)

          const publicFilepath = `${publicPath}${outputFileName}`

          // only copy if the file is not marked `sync`, `sync` files are always inlined
          const query = new URLSearchParams(id.split('?')[1])
          if (!query.has('sync')) {
            copies[file] = {
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
      filter: [include(id(/\.wasm$/, { cleanUrl: true }))],
      handler(code, id) {
        const [file, , params] = parseId(id)
        const isSync = params.has('sync')
        const isInit = params.has('init')

        const publicFilepath = copies[file]
          ? `'${copies[file].publicFilepath}'`
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

        let codegen = `import { loadWasmModule } from ${JSON.stringify(HELPERS_ID)}
        ${isInit ? 'export default ' : ''}function __wasm_init(imports) {
          return loadWasmModule(${isSync}, ${publicFilepath}, ${src}, imports)
        }\n`

        const mod = this.getModuleInfo(id)!

        if (!isInit) {
          const wasmInfo = mod.meta.wasmInfo as WasmInfo
          codegen += wasmInfo.imports.map(({ from }, i) => {
            return `import * as _wasmImport_${i} from ${JSON.stringify(from)};`
          })

          const importObject = wasmInfo.imports.map(({ from, names }, i) => {
            return {
              key: JSON.stringify(from),
              value: names.map((name) => {
                return {
                  key: JSON.stringify(name),
                  value: `_wasmImport_${i}[${JSON.stringify(name)}]`,
                }
              }),
            }
          })
          codegen += `const instance = /* @__PURE__ */ await __wasm_init(${codegenSimpleObject(importObject)});`

          codegen += wasmInfo.exports
            .map((name) => {
              return `export ${name === 'default' ? 'default' : `const ${name} =`} /* @__PURE__ */ instance.exports.${name}`
            })
            .join('\n')
        }

        return {
          map: { mappings: '' },
          code: codegen,
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

type SimpleObject = SimpleObjectKeyValue[]

interface SimpleObjectKeyValue {
  key: string
  value: string | SimpleObject
}

function codegenSimpleObject(obj: SimpleObject): string {
  return `{ ${codegenSimpleObjectKeyValue(obj)} }`
}

function codegenSimpleObjectKeyValue(obj: SimpleObject): string {
  return obj
    .map(({ key, value }) => {
      return `${key}: ${typeof value === 'string' ? value : codegenSimpleObject(value)}`
    })
    .join(',\n')
}
