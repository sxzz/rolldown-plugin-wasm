/* @ts-self-types="./wasm_example_pkg.d.ts" */
import * as wasm from "./wasm_example_pkg_bg.wasm";
import { __wbg_set_wasm } from "./wasm_example_pkg_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    add
} from "./wasm_example_pkg_bg.js";
