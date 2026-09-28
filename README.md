# ethvanity-js

Simple local-first Ethereum vanity address generator for the terminal.

## Usage

```bash
npm install
npm start
```

Then:

```text
run CAFE
```

The app searches locally with worker threads. When a match is found it prints the address and private key and saves both to:

```text
0xCAFE.txt
```

Running the same pattern again appends a new wallet to the same file instead of deleting the previous result.

## Commands

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

## Example

```text
› run CAFE

  └ Analyze  pattern=CAFE · prefix · case-insensitive
  └ Estimate 16^4 = 65,536 search space · light
  └ Workers  8 local worker threads

  ● Search started 8 workers · output → 0xCAFE.txt

  ● Match found

  Address     : 0xCAFE...
  Private Key : ...
  Saved       : 0xCAFE.txt
```

## Multicore

The main CLI uses Node.js `worker_threads`. The default worker count is based on available CPU parallelism and capped at 8.

Choose a worker count manually:

```text
run CAFE --workers 4
```

While searching:

```text
status
stop
```

## Private key files

`0x*.txt` files contain raw private keys in plaintext and are ignored by Git.

Keep these files private.

## Tests

```bash
npm test
```

## Offline

Key generation and vanity search happen locally. No Ethereum RPC or AI API is required.

## Legacy modes

```bash
npm run random
npm run mnemonic
```

## Credits

Original inspiration:
- ppabcd/vanity-cli
- bokub/vanity-eth

## License

MIT
