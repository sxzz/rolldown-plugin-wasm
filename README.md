# rolldown-plugin-wasm

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

Rolldown plugin for WASM. This plugin is forked from [@rollup/plugin-wasm](https://github.com/rollup/plugins/tree/master/packages/wasm).

## Install

```bash
npm i rolldown-plugin-wasm
```

## Usage

```ts
// rolldown.config.ts
import { defineConfig } from 'rolldown'
import { wasm } from 'rolldown-plugin-wasm'

export default defineConfig({
  plugins: [
    wasm({
      // ...options
    }),
  ],
})
```

### Asynchronous (default)

```ts
import init from './hello-world.wasm'

const module = await init()
//    ^? WebAssembly.Module

const instance = await init(imports)
//    ^? WebAssembly.Instance
```

### Synchronous

```ts
import initSync from './hello-world.wasm?sync'

const module = initSync()
//    ^? WebAssembly.Module

const instance = initSync(imports)
//    ^? WebAssembly.Instance
```

### TypeScript Support

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "types": ["rolldown-plugin-wasm/types"],
  },
}
```

## Options

```ts
/**
 * - `"auto"` will determine the environment at runtime and invoke the correct methods accordingly
 * - `"auto-inline"` always inlines the WASM and will decode it according to the environment
 * - `"browser"` omits emitting code that requires node.js builtin modules
 * - `"node"` omits emitting code that requires `fetch`, but requires Node.js 20.16.0 or higher
 */
export type TargetEnv = 'auto' | 'auto-inline' | 'browser' | 'node'

export interface Options {
  /**
   * A glob pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   *
   * @default /\.wasm(\?sync)?$/
   */
  include?: Arrayable<string | RegExp>
  /**
   * A glob pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default no files are ignored.
   */
  exclude?: Arrayable<string | RegExp>
  /**
   * The maximum file size for inline files. If a file exceeds this limit, it will be copied to the destination folder and loaded from a separate file at runtime.
   * If `maxFileSize` is set to `0` all files will be copied.
   * Files specified in `sync` to load synchronously are always inlined, regardless of size.
   *
   * @default 14 * 1024
   */
  maxFileSize?: number
  /**
   * String used to rename the emitted Wasm files.
   * @default '[hash][extname]'
   */
  fileName?: string
  /**
   * A string which will be added in front of filenames when they are not inlined but are copied.
   */
  publicPath?: string
  /**
   * Configures what code is emitted to instantiate the Wasm (both inline and separate)
   */
  targetEnv?: TargetEnv
}
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2026-PRESENT [Kevin Deng](https://github.com/sxzz)

[MIT](https://github.com/rollup/plugins/blob/master/LICENSE) License Copyright (c) 2019 [RollupJS Plugin Contributors](https://github.com/rollup/plugins/graphs/contributors)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/rolldown-plugin-wasm.svg
[npm-version-href]: https://npmjs.com/package/rolldown-plugin-wasm
[npm-downloads-src]: https://img.shields.io/npm/dm/rolldown-plugin-wasm
[npm-downloads-href]: https://www.npmcharts.com/compare/rolldown-plugin-wasm?interval=30
[unit-test-src]: https://github.com/sxzz/rolldown-plugin-wasm/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/sxzz/rolldown-plugin-wasm/actions/workflows/unit-test.yml
