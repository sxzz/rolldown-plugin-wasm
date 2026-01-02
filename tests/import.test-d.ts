/// <reference types="../types" />

import { expectTypeOf } from 'vitest'
import init from './hello-world.wasm'
import initSync from './hello-world.wasm?sync'

{
  const module = init()
  expectTypeOf(module).toEqualTypeOf<Promise<WebAssembly.Module>>()

  const instance = init({})
  expectTypeOf(instance).toEqualTypeOf<Promise<WebAssembly.Instance>>()
}

{
  const module = initSync()
  expectTypeOf(module).toEqualTypeOf<WebAssembly.Module>()

  const instance = initSync({})
  expectTypeOf(instance).toEqualTypeOf<WebAssembly.Instance>()
}
