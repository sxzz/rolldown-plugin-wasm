import type { TargetEnv } from './options.ts'

export const HELPERS_ID: string = '\0wasm-helpers.js'

const nodeFetchFile = `
const { readFile } = process.getBuiltinModule('fs/promises')
return readFile(fileUrl).then((buffer) => instantiate(buffer, imports))
`

const nodeDecode = `
const { Buffer } = process.getBuiltinModule('buffer')
buf = Buffer.from(src, 'base64')
`

const browserFetchFile = `
return instantiate(fetch(fileUrl), imports, true);
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

if (fileUrl && isNode) {
  ${nodeFetchFile}
} else if (fileUrl) {
  ${browserFetchFile}
}

if (isNode) {
  ${nodeDecode}
} else {
  ${browserDecode}
}
`

const nodeModule = `
let buf = null
if (fileUrl) {
  ${nodeFetchFile}
}

${nodeDecode}
`

const browserModule = `
let buf = null
if (fileUrl) {
  ${browserFetchFile}
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

function envModule(env: TargetEnv) {
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
export function loadWasmModule(sync, fileUrl, src, imports) {
  function instantiate(source, imports, stream) {
    const instantiate = stream ? WebAssembly.instantiateStreaming : WebAssembly.instantiate;
    return instantiate(source, imports).then(({ instance }) => instance)
  }

  ${envModule(env)}

  if (sync) {
    const mod = new WebAssembly.Module(buf)
    return new WebAssembly.Instance(mod, imports)
  } else {
    return instantiate(buf, imports)
  }
}
`

export type SimpleObject = SimpleObjectKeyValue[]
export interface SimpleObjectKeyValue {
  key: string
  value: string | SimpleObject
}

export function codegenSimpleObject(obj: SimpleObject): string {
  return `{ ${obj
    .map(({ key, value }) => {
      return `${key}: ${typeof value === 'string' ? value : codegenSimpleObject(value)}`
    })
    .join(',\n')} }`
}
