declare module '*.wasm' {
  export default function (
    imports: WebAssembly.Imports,
  ): Promise<WebAssembly.Instance>

  export default function wasm(imports?: undefined): Promise<WebAssembly.Module>
}
declare module '*.wasm?sync' {
  export default function wasm(
    imports: WebAssembly.Imports,
  ): WebAssembly.Instance
  export default function wasm(imports?: undefined): WebAssembly.Module
}
