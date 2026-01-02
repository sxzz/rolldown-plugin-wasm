import type { TargetEnv } from './options'

export const HELPERS_ID: string = '\0wasm-helpers.js'
export const HELPERS_ID_RE: RegExp = /\0wasm-helpers\.js$/

const nodeFilePath = `
const { readFile } = process.getBuiltinModule('fs/promises')
const path = process.getBuiltinModule('path')

return readFile(path.resolve(import.meta.dirname, filepath)).then(
  (buffer) => instantiateOrCompile(buffer, imports)
)
`

const nodeDecode = `
const { Buffer } = process.getBuiltinModule('buffer')
buf = Buffer.from(src, 'base64')
`

const browserFilePath = `
return instantiateOrCompile(fetch(filepath), imports, true);
`

const browserDecode = `
const raw = globalThis.atob(src)
const len = raw.length
buf = new Uint8Array(new ArrayBuffer(len))
for (let i = 0; i < len; i++) {
  buf[i] = raw.charCodeAt(i)
}
`

const autoModule = `
let buf = null
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

if (filepath && isNode) {
  ${nodeFilePath}
} else if (filepath) {
  ${browserFilePath}
}

if (isNode) {
  ${nodeDecode}
} else {
  ${browserDecode}
}
`

const nodeModule = `
let buf = null
if (filepath) {
  ${nodeFilePath}
}

${nodeDecode}
`

const browserModule = `
let buf = null
if (filepath) {
  ${browserFilePath}
}

${browserDecode}
`

const autoInlineModule = `
let buf = null
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null
if (isNode) {
  ${nodeDecode}
} else {
  ${browserDecode}
}
`

const envModule = (env: TargetEnv) => {
  switch (env) {
    case 'auto':
      return autoModule
    case 'auto-inline':
      return autoInlineModule
    case 'browser':
      return browserModule
    case 'node':
      return nodeModule
    default:
      return null
  }
}

export const getHelpersModule = (env: TargetEnv) => `
export function loadWasmModule(sync, filepath, src, imports) {
  function instantiateOrCompile(source, imports, stream) {
    const instantiate = stream ? WebAssembly.instantiateStreaming : WebAssembly.instantiate;
    const compile = stream ? WebAssembly.compileStreaming : WebAssembly.compile;

    if (imports) {
      return instantiate(source, imports).then(({ instance }) => instance)
    } else {
      return compile(source)
    }
  }

  ${envModule(env)}

  if (sync) {
    const mod = new WebAssembly.Module(buf)
    return imports ? new WebAssembly.Instance(mod, imports) : mod
  } else {
    return instantiateOrCompile(buf, imports)
  }
}
`
