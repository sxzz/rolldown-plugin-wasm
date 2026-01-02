// MIT license - https://github.com/Menci/vite-plugin-wasm/blob/main/LICENSE

export interface WasmInfo {
  imports: {
    from: string
    names: string[]
  }[]
  exports: string[]
}

export async function parseWasm(buffer: BufferSource): Promise<WasmInfo> {
  try {
    const wasmModule = await WebAssembly.compile(buffer)
    const imports = Object.entries(
      WebAssembly.Module.imports(wasmModule).reduce(
        (result, item) => ({
          ...result,
          [item.module]: [...(result[item.module] || []), item.name],
        }),
        {} as Record<string, string[]>,
      ),
    ).map(([from, names]) => ({ from, names }))

    const exports = WebAssembly.Module.exports(wasmModule).map(
      (item) => item.name,
    )

    return { imports, exports }
  } catch (error: any) {
    throw new Error(`Failed to parse WASM file: ${error.message}`, {
      cause: error,
    })
  }
}
