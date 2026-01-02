# rolldown-plugin-wasm

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

Rolldown plugin for WASM.

This project is heavily referenced from [@rollup/plugin-wasm](https://github.com/rollup/plugins/tree/master/packages/wasm) and [vite-plugin-wasm](https://github.com/Menci/vite-plugin-wasm).

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

### Importing WASM Modules

```ts
import { add } from './add.wasm'

add(1, 2)
```

### Asynchronous Init

```ts
import init from './add.wasm?init'

const instance = await init(
  imports, // optional
)

instance.exports.add(1, 2)
```

### Synchronous Init

```ts
import initSync from './add.wasm?init&sync'

const instance = initSync(
  imports, // optional
)

instance.exports.add(1, 2)
```

### `wasm-bindgen` Support

#### Target `bundler` (default, recommended)

```ts
import { add } from 'some-pkg'

add(1, 2)
```

#### Target `web`

##### Node.js

```ts
import { readFile } from 'node:fs/promises'
import init, { add } from 'some-pkg'
import wasmUrl from 'some-pkg/add_bg.wasm?url'

await init({
  module_or_path: readFile(new URL(wasmUrl, import.meta.url)),
})

add(1, 2)
```

##### Browser

```ts
import init, { add } from 'some-pkg/add.js'
import wasmUrl from 'some-pkg/add_bg.wasm?url'

await init({
  module_or_path: wasmUrl,
})

add(1, 2)
```

> [!NOTE]
> Other targets such as `nodejs` and `no-modules` are not supported.

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

[MIT](https://github.com/Menci/vite-plugin-wasm/blob/main/LICENSE) Copyright (c) 2022 Menci

[MIT](https://github.com/rollup/plugins/blob/master/LICENSE) License Copyright (c) 2019 [RollupJS Plugin Contributors](https://github.com/rollup/plugins/graphs/contributors)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/rolldown-plugin-wasm.svg
[npm-version-href]: https://npmjs.com/package/rolldown-plugin-wasm
[npm-downloads-src]: https://img.shields.io/npm/dm/rolldown-plugin-wasm
[npm-downloads-href]: https://www.npmcharts.com/compare/rolldown-plugin-wasm?interval=30
[unit-test-src]: https://github.com/sxzz/rolldown-plugin-wasm/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/sxzz/rolldown-plugin-wasm/actions/workflows/unit-test.yml
