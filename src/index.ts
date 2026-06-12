import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { exactRegex, id, include, or } from 'rolldown/filter'
import {
  codegenSimpleObject,
  getHelpersModule,
  HELPERS_ID,
  type SimpleObject,
} from './helper.ts'
import { parseWasm, type WasmInfo } from './wasm-parser.ts'
import type { Options } from './options.ts'
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
    targetEnv,
    fileName = '[hash][extname]',
  } = options

  const copies: Record<
    string,
    {
      filename: string
      ref: string
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
        include(
          or(id(exactRegex(HELPERS_ID)), id(/\.wasm$/, { cleanUrl: true })),
        ),
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
        include(
          or(id(exactRegex(HELPERS_ID)), id(/\.wasm$/, { cleanUrl: true })),
        ),
      ],

      async handler(id) {
        if (id === HELPERS_ID) {
          return getHelpersModule(targetEnv || 'auto')
        }

        const [file, , params] = parseId(id)
        const buffer = await readFile(file)

        const isInit = params.has('init')
        const isSync = params.has('sync')
        const isUrl = params.has('url')
        if (isSync && isUrl) {
          this.error('`sync` and `url` parameters cannot be used together.')
        }

        this.addWatchFile(file)
        if (!isInit) {
          this.getModuleInfo(id)!.meta.wasmInfo = await parseWasm(buffer)
        }

        function shouldInline() {
          if (isUrl) return false
          if (isSync) return true
          if (targetEnv === 'auto-inline') return true
          if (maxFileSize === 0) return false
          return buffer.length <= maxFileSize
        }

        if (!shouldInline() && !copies[file]) {
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

          const ref = this.emitFile({
            type: 'asset',
            source: buffer,
            name: 'Rolldown WASM Asset',
            fileName: outputFileName,
          })

          copies[file] = {
            filename: outputFileName,
            ref,
            buffer,
          }
        }

        return buffer.toString('binary')
      },
    },

    transform: {
      filter: [include(id(/\.wasm$/, { cleanUrl: true }))],
      handler(code, id) {
        const [file, , params] = parseId(id)

        const filepathPlaceholder = copies[file]
          ? `new URL(${JSON.stringify(`$ROLLDOWN_WASM_${copies[file].ref}_PLACEHOLDER$`)}, import.meta.url)`
          : null
        let src: string | null

        const isSync = params.has('sync')
        const isUrl = params.has('url')
        if (isUrl) {
          if (!filepathPlaceholder) {
            this.error(
              '`url` parameter can only be used with non-inlined files.',
            )
          }
          return `export default ${filepathPlaceholder}.href`
        }

        if (filepathPlaceholder === null) {
          src = `'${Buffer.from(code, 'binary').toString('base64')}'`
        } else {
          if (isSync) {
            this.error('non-inlined files can not be `sync`.')
          }
          src = null
        }

        const isInit = params.has('init')
        let codegen = `import { loadWasmModule } from ${JSON.stringify(HELPERS_ID)}
${isInit ? 'export default ' : ''}function __wasm_init(imports) {
  return loadWasmModule(${isSync}, ${filepathPlaceholder}, ${src}, imports)
}\n`

        const mod = this.getModuleInfo(id)!

        if (!isInit) {
          const { imports, exports } = mod.meta.wasmInfo as WasmInfo

          codegen += `${imports
            .map(
              ([from], i) =>
                `import * as _wasmImport_${i} from ${JSON.stringify(from)}`,
            )
            .join('\n')}\n`

          const importObject: SimpleObject = imports.map(([from, names], i) => {
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
          codegen += `const instance = await __wasm_init(${codegenSimpleObject(importObject)})\n`
          codegen += exports
            .map((name) => {
              return `export ${name === 'default' ? 'default' : `const ${name} =`} instance.exports.${name}`
            })
            .join('\n')
        }

        return {
          map: { mappings: '' },
          code: codegen,
        }
      },
    },

    generateBundle(opt, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'asset') continue

        chunk.code = chunk.code.replaceAll(
          /\$ROLLDOWN_WASM_([\w$]+)_PLACEHOLDER\$/g,
          (_, ref) => {
            const file = Object.keys(copies).find(
              (file) => copies[file].ref === ref,
            )
            if (!file) {
              this.error(
                `Could not find emitted WASM asset for reference ${ref}`,
              )
            }

            const relative = path.posix.relative(
              path.dirname(chunk.fileName),
              copies[file].filename,
            )
            return relative
          },
        )
      }
    },
  }
}
