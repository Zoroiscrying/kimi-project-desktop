# Agent Notes for Kimi Project Desktop

## Development Environment

This is a Tauri v2 + React + TypeScript desktop application.

### Windows GNU Toolchain Quirks

The Windows environment uses the GNU Rust toolchain (`x86_64-pc-windows-gnu`). Building Tauri v2 with this toolchain requires a working MinGW `windres` resource compiler. The system `PATH` may contain a broken `windres.exe` (for example, from a Chocolatey Processing package) that fails with:

```
windres.exe: Can't detect target endianness and architecture.
```

To build successfully, prepend the Strawberry Perl MinGW `windres` directory to `PATH`:

```bash
export PATH="/c/Strawberry/c/bin:$PATH"
export PATH="/c/Users/zoroiscrying/.cargo/bin:$PATH"
cargo build --features tauri
```

### Crate Type

Because the MinGW linker fails with "export ordinal too large" when building Tauri v2 as `cdylib`/`staticlib`, `src-tauri/Cargo.toml` uses `crate-type = ["rlib"]`. This is sufficient for the desktop target since `main.rs` links the library directly. Mobile bundling is not supported in this configuration.

### Tauri Feature Gate

Because `cargo test` binaries on Windows GNU fail to start when linking the Tauri runtime (`STATUS_ENTRYPOINT_NOT_FOUND`), Tauri (`tauri` and `tauri-build`) is an optional Cargo feature disabled by default.

- Run tests: `cargo test`
- Build/run the desktop app: `cargo build --features tauri` / `cargo run --features tauri`
- Use Tauri CLI: `npm run tauri:dev` / `npm run tauri:build` (already pass `--features tauri`)

All Tauri-specific code in the Rust crate is gated with `#[cfg(feature = "tauri")]`.

### Useful Commands

```bash
# Install dependencies
npm install

# Run Rust tests
cd src-tauri && cargo test

# Run dev server (requires correct PATH for windres)
npm run tauri:dev

# Run frontend tests
npm test -- --run

# Build production bundle
npm run tauri:build
```
