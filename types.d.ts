// wasm?init
declare module '*.wasm?init' {
  const initWasm: (
    imports?: WebAssembly.Imports,
  ) => Promise<WebAssembly.Instance>
  export default initWasm
}

// wasm?init&sync
declare module '*.wasm?init&sync' {
  const initWasm: (imports?: WebAssembly.Imports) => WebAssembly.Instance
  export default initWasm
}
