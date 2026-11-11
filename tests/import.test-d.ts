/// <reference types="../types.d.ts" />

import { expectTypeOf } from 'vitest'
import init from './example.wasm?init'
import initSync from './example.wasm?init&sync'
import wasmModule from './example.wasm?source'

{
  const instance = init()
  expectTypeOf(instance).toEqualTypeOf<Promise<WebAssembly.Instance>>()
}

{
  const instance = initSync({})
  expectTypeOf(instance).toEqualTypeOf<WebAssembly.Instance>()
}

{
  expectTypeOf(wasmModule).toEqualTypeOf<WebAssembly.Module>()
}
