/// <reference types="../types" />

import { expectTypeOf } from 'vitest'
import init from './add.wasm?init'
import initSync from './add.wasm?init&sync'

{
  const instance = init()
  expectTypeOf(instance).toEqualTypeOf<Promise<WebAssembly.Instance>>()
}

{
  const instance = initSync({})
  expectTypeOf(instance).toEqualTypeOf<WebAssembly.Instance>()
}
