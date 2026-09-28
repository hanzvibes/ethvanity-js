# ethvanity-js

Local-first Ethereum vanity address generator with an interactive, worker-based terminal UI.

> Security status: this project is still under active hardening. Generated wallet material is sensitive. Do not use unreleased builds for funds you cannot afford to lose.

## Features

- Prefix and suffix vanity address search
- Multi-core search with Node.js `worker_threads`
- Responsive terminal while a search is running
- `status` and `stop` controls for active jobs
- Configurable worker count per search
- Local-only key generation
- Search-space estimates and aggregate attempts/second telemetry
- Encrypted Ethereum keystore JSON output for the interactive CLI
- Hidden keystore password input
- Unique secret filenames to prevent silent overwrite
- Secret output directory ignored by Git
- Legacy mnemonic vanity mode

## Requirements

- Node.js 18 or newer

## Install

```bash
git clone https://github.com/hanzvibes/ethvanity-js
cd ethvanity-js
npm install
```

## Interactive terminal

```bash
npm start
```

Commands:

```text
run CAFE
run BEEF --suffix
run CAFE --workers 8
status
stop
explain DEADBEEF
security
help
clear
quit
```

Patterns are hexadecimal only: `0-9` and `A-F`.

The CLI chooses a conservative default worker count based on available CPU parallelism, capped at 8. You can explicitly choose between 1 and 32 workers with `--workers`.

When a `run` command starts, the terminal asks for a keystore password twice. Password input is hidden and must contain at least 12 characters. The search then runs in worker threads, so the main terminal remains available for `status` and `stop`.

## Worker model

```text
Terminal / main thread
        │
        ├── status / stop
        │
        └── worker pool
             ├── worker 1
             ├── worker 2
             ├── ...
             └── worker N
                    │
                    └── winning private key
                          ↓
                    main process only
                          ↓
                 encrypted keystore
```

Workers receive only search configuration such as pattern and prefix/suffix mode. The keystore password is never sent to workers. When one worker finds a match, other workers are terminated and the winning private key returns to the local main process for encryption.

## Keystore output

Example path:

```text
wallets/cafe-prefix-2026-09-28T06-40-00-000Z-89abcdef.keystore.json
```

The interactive CLI does not write the raw private key to disk.

Keep the keystore file and password backed up separately. If the password is lost, the encrypted keystore cannot be recovered from the file alone.

Do not commit keystore files to Git or paste their decrypted contents into chat, issue trackers, logs, or other online services.

## Live controls

While a job is running:

```text
› status
  Searching CAFE
  1,284,000 attempts · 1,920,000 addr/s · 8 workers · 0.7s

› stop
  Search stopped.
```

Only one search job can run at a time in the interactive CLI.

## Other modes

Generate a random mnemonic wallet:

```bash
npm run random
```

Run the legacy mnemonic vanity search:

```bash
npm run mnemonic
```

These legacy modes are still being hardened and currently write sensitive material locally. The interactive CLI is the preferred path.

## Tests

```bash
npm test
```

The test suite covers:

- deterministic private-key-to-address derivation
- EIP-55 checksum formatting
- prefix and suffix matching
- malformed address rejection
- encrypted keystore round-trip
- raw private key absence from encrypted keystore JSON
- worker-count validation
- basic multi-worker vanity search

## Dependency surface

The main search path intentionally keeps the dependency surface small:

- `secp256k1` for public-key derivation
- `keccak` for Ethereum address hashing
- Node.js `crypto.randomBytes` for entropy
- `ethers` for encrypted Ethereum JSON keystore export

`eth-hd-wallet` remains only for the legacy mnemonic modes.

## Offline behavior

Vanity key generation, address derivation, worker coordination, and keystore encryption happen locally and do not require an Ethereum RPC connection. Dependencies still need to be installed before running the project.

## Credits

Original inspiration:
- ppabcd/vanity-cli
- bokub/vanity-eth

## License

MIT
