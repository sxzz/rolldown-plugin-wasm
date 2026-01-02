import type { Arrayable } from '@antfu/utils'

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
  /**
   * Enable wasm-bindgen support
   */
  wasmBindgen?: boolean
}
