# ethvanity-js

Local-first Ethereum vanity address generator with an interactive terminal UI.

> Security status: this project is still under active hardening. Generated private keys and mnemonics are sensitive. Do not use unreleased builds for funds you cannot afford to lose.

## Features

- Prefix and suffix vanity address search
- Local-only key generation
- Interactive terminal commands
- Search-space estimates and live attempts/second telemetry
- Mnemonic vanity mode
- Unique secret filenames to prevent silent overwrite
- Secret output directory ignored by Git

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
explain DEADBEEF
security
help
clear
quit
```

Patterns are hexadecimal only: `0-9` and `A-F`.

## Other modes

Generate a random mnemonic wallet:

```bash
npm run random
```

Run the legacy mnemonic vanity search:

```bash
npm run mnemonic
```

## Secret files

Generated wallet material is stored under `wallets/` using unique filenames and owner-only file permissions when supported by the operating system.

The current format still contains raw private keys and, in mnemonic mode, the seed phrase. Treat every generated file as a high-value secret. Never upload it, paste it into an AI/chat service, or commit it to Git.

Encrypted Ethereum keystore export is planned as the next security milestone.

## Tests

```bash
npm test
```

The core test suite covers deterministic private-key-to-address derivation, EIP-55 checksum formatting, prefix matching, suffix matching, and malformed address rejection.

## Offline behavior

Vanity key generation and address derivation happen locally and do not require an Ethereum RPC connection. Dependencies still need to be installed before running the project.

## Credits

Original inspiration:
- ppabcd/vanity-cli
- bokub/vanity-eth

## License

MIT
