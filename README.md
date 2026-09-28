# ethvanity-js

Local-first Ethereum vanity address generator with an interactive terminal UI.

> Security status: this project is still under active hardening. Generated wallet material is sensitive. Do not use unreleased builds for funds you cannot afford to lose.

## Features

- Prefix and suffix vanity address search
- Local-only key generation
- Interactive terminal commands
- Search-space estimates and live attempts/second telemetry
- Encrypted Ethereum keystore JSON output for the interactive CLI
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

When a `run` command starts, the terminal asks for a keystore password twice. Password input is hidden. The password must contain at least 12 characters.

After a match is found, the private key is encrypted using ethers' Ethereum JSON keystore support and written under `wallets/`.

## Keystore output

Example path:

```text
wallets/cafe-prefix-2026-09-28T06-40-00-000Z-89abcdef.keystore.json
```

The interactive CLI does not write the raw private key to disk.

Keep the keystore file and password backed up separately. If the password is lost, the encrypted keystore cannot be recovered from the file alone.

Do not commit keystore files to Git or paste their decrypted contents into chat, issue trackers, logs, or other online services.

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

## Offline behavior

Vanity key generation, address derivation, and keystore encryption happen locally and do not require an Ethereum RPC connection. Dependencies still need to be installed before running the project.

## Credits

Original inspiration:
- ppabcd/vanity-cli
- bokub/vanity-eth

## License

MIT
