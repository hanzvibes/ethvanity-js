# ethvanity-js

![GitHub top language](https://img.shields.io/github/languages/top/hanzvibes/ethvanity-js?style=for-the-badge)
![GitHub license](https://img.shields.io/github/license/hanzvibes/ethvanity-js?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/hanzvibes/ethvanity-js?style=flat-square)

A local Node.js CLI for searching Ethereum vanity addresses. Choose a hexadecimal pattern for the beginning or end of an address, then let the local process generate candidate keys until it finds a match.

> **Security first:** this tool handles private keys and, in some scripts, recovery phrases. Use it only on a device you trust. Never share, upload, or commit generated secrets. This project has not been independently security-audited.

## Features

- **Interactive terminal CLI** for one prefix or suffix match.
- **Parallel search runner** using Node.js worker threads.
- **Live local monitor** for attempts, throughput, workers, and estimated probability.
- **Mnemonic-based legacy script** and a separate random-wallet script.
- **Local output files**; the monitor exposes the public address only, not private keys.
- **No external AI service is called by the CLI.** “AI agent” is a terminal presentation label, not a claim that an AI model performs the search.

## Requirements

- Node.js and npm.
- A trusted local machine. Search speed depends on CPU, workload, and pattern difficulty.

## Install

```bash
git clone https://github.com/hanzvibes/ethvanity-js.git
cd ethvanity-js
npm install
```

## Choose a command

### 1. Interactive CLI — recommended starting point

```bash
npm start
```

The terminal accepts these commands:

| Command | What it does |
| --- | --- |
| `help` | Show available commands |
| `run CAFE` | Search for an address starting with `CAFE` |
| `run CAFE --suffix` | Search for an address ending with `CAFE` |
| `explain CAFE` | Show a rough search-space estimate |
| `security` | Display local secret-handling reminders |
| `clear` | Clear the terminal |
| `quit` / `exit` | Exit the CLI |

Patterns must contain hexadecimal characters only: `0-9` and `A-F`. Interactive mode accepts patterns up to 12 characters. Matching is case-insensitive by default; the displayed Ethereum address uses checksum casing.

When a match is found, the CLI writes an `address_0x<pattern>.txt` file in the current working directory. **That file contains the private key.** Keep it secret.

### 2. Parallel search + live monitor

Run a parallel search with the default worker count (based on the machine's logical CPU count):

```bash
npm run parallel -- CAFE
```

Choose the number of workers explicitly:

```bash
npm run parallel -- CAFE --workers 4
```

Search for a suffix instead:

```bash
npm run parallel -- CAFE --workers 4 --suffix
```

Optional flags:

| Flag | Behavior |
| --- | --- |
| `--workers <n>` | Worker count, clamped to 1–128; defaults to logical CPU count |
| `--suffix` | Match the end of the address instead of the beginning |
| `--port <n>` | Monitor HTTP port; defaults to `4173` |
| `--progress-every <n>` | Worker progress reporting interval; minimum is 5,000 attempts |
| `--lan` | Bind the monitor to all network interfaces instead of localhost |

Open **http://127.0.0.1:4173** while the parallel process is running (or use the port you selected). The dashboard refreshes approximately once per second and reports aggregate attempts, throughput, worker status, uptime, and a probabilistic chance estimate.

**Network warning:** `--lan` makes the monitor reachable from other devices on the network. The monitor has no authentication. Use it only on a trusted network, and avoid exposing its port to the public internet. The dashboard does not display private keys.

Press `Ctrl+C` in the terminal to stop the search and workers.

### 3. Mnemonic script (legacy)

```bash
npm run mnemonic
# or
node mnemonic.js
```

This script currently uses a pattern and minimum length hard-coded in `mnemonic.js` (`00000000` and `3` by default). Edit those values in the file before running it. It continuously generates candidate mnemonics and appends matches to `mnemonic_0x<pattern>.txt` files.

This is a legacy script rather than an interactive command. Review the code carefully before relying on it for wallet recovery or valuable funds.

### 4. Random-wallet script (legacy)

```bash
npm run random
# or
node random.js
```

This script writes wallet-related output to `address_random.txt`, including secret material. **Do not use its printed mnemonic as a recovery phrase for the displayed wallet without independently verifying the code path first.** The current implementation generates the displayed mnemonic separately from the mnemonic used to create the wallet, so they may not correspond.

## How search difficulty works

An Ethereum address contains 40 hexadecimal characters after `0x`. For a fixed, case-insensitive pattern of length `n`, the rough probability of a random candidate matching a prefix (or suffix) is `1 / 16^n`; the expected number of candidates is approximately `16^n`.

| Pattern length | Expected candidate count (roughly) |
| ---: | ---: |
| 2 hex characters | 256 |
| 3 hex characters | 4,096 |
| 4 hex characters | 65,536 |
| 5 hex characters | 1,048,576 |
| 6 hex characters | 16,777,216 |
| 8 hex characters | 4,294,967,296 |
| 10 hex characters | 1,099,511,627,776 |
| 12 hex characters | 281,474,976,710,656 |

These are statistical estimates, not guarantees or a countdown to completion. A search can find a match earlier or take much longer. Adding one hexadecimal character multiplies the expected search effort by 16. More workers may improve throughput, but too many workers can reduce performance due to CPU contention.

## Output files and secrets

The repository's `.gitignore` excludes `address_*.txt`, `mnemonic_*.txt`, keystore JSON files, environment files, and `node_modules/`. This is a safety net, **not a guarantee** that secrets cannot be committed.

- Never paste private keys or mnemonics into issues, chats, screenshots, logs, or support requests.
- Never commit generated output files or send them to cloud storage.
- Use a dedicated, trusted machine and keep the operating system and dependencies updated.
- For valuable funds, consider using a well-reviewed wallet-generation workflow and independently auditing this project's code before use.
- The file permission mode requested by the scripts is owner-only (`0600`) where the operating system supports it; permissions do not protect against malware or a compromised account.

## Project map

| File | Purpose |
| --- | --- |
| `index.js` | Entry point for the interactive CLI |
| `cli.js` | Interactive command parsing, search output, and local secret-file writing |
| `vanity.js` | Random key generation, address derivation, matching, checksum formatting, and search loop |
| `parallel.js` | Worker-thread coordinator and local HTTP monitor startup |
| `search-worker.js` | Runs a vanity search in each worker and reports progress/results |
| `monitor.js` | Serves the monitor UI and local status endpoint |
| `mnemonic.js` | Legacy mnemonic-based continuous search |
| `random.js` | Legacy random-wallet output script |
| `app/page.tsx` | Next.js landing page with an animated, interactive visual preview |\n| `app/globals.css` | Tailwind CSS and motion styles |\n| `app/layout.tsx` | Root layout and page metadata |

The landing page's playground is a **visual demo only**. It does not run the real search engine, create wallets, or verify addresses.

## Development notes

Available npm scripts:

```bash
npm start                  # interactive CLI
npm run vanity             # same entry point as npm start
npm run parallel -- CAFE   # parallel search + monitor
npm run mnemonic           # legacy mnemonic script
npm run random             # legacy random-wallet script
```

There is currently no automated test script declared in `package.json`. Verify behavior on a disposable test environment before using the tool with valuable funds.

## Credits

- Original project inspiration: [ppabcd/vanity-cli](https://github.com/ppabcd/vanity-cli)
- Vanity-address implementation reference: [bokub/vanity-eth](https://github.com/bokub/vanity-eth)

## License

See [LICENSE](LICENSE).
