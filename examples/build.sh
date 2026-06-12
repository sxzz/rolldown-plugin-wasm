#!/bin/bash

cargo build --package example-raw --target wasm32-unknown-unknown --release &&
  cp target/wasm32-unknown-unknown/release/example_raw.wasm tests/fixtures/example.wasm &&
  pnpm wasm-pack build examples/wasm-bindgen --target bundler --release --out-dir ../pkg &&
  rm examples/pkg/.gitignore
