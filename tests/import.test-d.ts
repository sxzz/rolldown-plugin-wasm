/// <reference types="../types.d.ts" />

import { expectTypeOf, test } from 'vitest'
import init from './example.wasm?init'
import initSync from './example.wasm?init&sync'
import wasmModule from './example.wasm?source'

test('?init', () => {
  const instance = init()
  expectTypeOf(instance).toEqualTypeOf<Promise<WebAssembly.Instance>>()
})

test('?init&sync', () => {
  const instance = initSync({})
  expectTypeOf(instance).toEqualTypeOf<WebAssembly.Instance>()
})

test('?source', () => {
  expectTypeOf(wasmModule).toEqualTypeOf<WebAssembly.Module>()
})
