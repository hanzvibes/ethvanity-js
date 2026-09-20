const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { findVanityWallet } = require('./vanity.js');

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    gray: '\x1b[38;5;244m',
    faint: '\x1b[38;5;240m',
    accent: '\x1b[38;5;180m',
    blue: '\x1b[38;5;110m',
    green: '\x1b[38;5;150m',
    yellow: '\x1b[38;5;179m',
    red: '\x1b[38;5;167m'
};

const paint = (color, value) => `${color}${value}${C.reset}`;
const fmt = new Intl.NumberFormat('en-US');

const divider = () => console.log(paint(C.faint, '────────────────────────────────────────────────────────────'));

const banner = () => {
    console.clear();
    console.log(`${paint(C.bold, 'ethvanity')}  ${paint(C.accent, 'AI agent')}  ${paint(C.gray, 'local secrets')}`);
    console.log(paint(C.gray, 'Ethereum vanity wallet terminal · secrets never leave this process'));
    divider();
    console.log(`${paint(C.accent, '›')} Type ${paint(C.bold, 'run CAFE')} to search, ${paint(C.bold, 'help')} for commands.`);
    console.log();
};

const estimate = (pattern) => {
    const space = Math.pow(16, pattern.length);
    let level = 'light';
    if (pattern.length >= 7) level = 'heavy';
    else if (pattern.length >= 5) level = 'moderate';
    return { space, level };
};

const parsePattern = (value) => {
    const pattern = String(value || '').trim();
    if (!pattern) throw new Error('Missing pattern. Example: run CAFE');
    if (!/^[0-9a-fA-F]+$/.test(pattern)) throw new Error('Pattern must use hexadecimal characters only: 0-9 and A-F.');
    if (pattern.length > 12) throw new Error('Interactive mode currently limits patterns to 12 characters.');
    return pattern;
};

const writeSecretFile = (result, pattern) => {
    const safePattern = pattern.toLowerCase();
    const filename = `address_0x${safePattern}.txt`;
    const filepath = path.resolve(process.cwd(), filename);
    const body = `Address : ${result.address}\nPrivate Key : ${result.privKey}\n`;
    fs.writeFileSync(filepath, body, { mode: 0o600 });
    return filepath;
};

const printHelp = () => {
    console.log(paint(C.bold, 'Commands'));
    console.log(`  ${paint(C.accent, 'run CAFE')}             Find one prefix match`);
    console.log(`  ${paint(C.accent, 'run CAFE --suffix')}    Find one suffix match`);
    console.log(`  ${paint(C.accent, 'explain CAFE')}         Explain search difficulty`);
    console.log(`  ${paint(C.accent, 'security')}             Show local secret-handling checks`);
    console.log(`  ${paint(C.accent, 'clear')}                Clear terminal`);
    console.log(`  ${paint(C.accent, 'quit')}                 Exit`);
    console.log();
};

const explain = (raw) => {
    const pattern = parsePattern(raw);
    const { space, level } = estimate(pattern);
    console.log(`${paint(C.accent, '›')} Explain difficulty for ${paint(C.bold, pattern.toUpperCase())}`);
    console.log();
    console.log(`  ${paint(C.blue, 'Analyze')}  ${paint(C.gray, `${pattern.length} hex characters`)}`);
    console.log(`  ${paint(C.blue, 'Estimate')} ${paint(C.gray, `16^${pattern.length} = ${fmt.format(space)} expected search space`)}`);
    console.log();
    console.log(`  This is a ${paint(C.accent, level)} target. Every extra hex character multiplies the search space by 16.`);
    console.log();
};

const security = () => {
    console.log(`${paint(C.accent, '›')} Run security check`);
    console.log();
    console.log(`  ${paint(C.green, '✓')} Entropy generated locally with randombytes`);
    console.log(`  ${paint(C.green, '✓')} Private key never sent to an AI/API by this CLI`);
    console.log(`  ${paint(C.green, '✓')} Output file is created with owner-only mode when supported`);
    console.log(`  ${paint(C.yellow, '!')} Output still contains a raw private key. Treat it as a secret.`);
    console.log(`  ${paint(C.yellow, '!')} Never commit address_*.txt or mnemonic_*.txt to Git.`);
    console.log();
};

const runSearch = (args) => {
    const isSuffix = args.includes('--suffix');
    const rawPattern = args.find((arg) => !arg.startsWith('--'));
    const pattern = parsePattern(rawPattern);
    const normalized = pattern.toUpperCase();
    const { space, level } = estimate(pattern);

    console.log(`${paint(C.accent, '›')} Find an Ethereum address ${isSuffix ? 'ending' : 'starting'} with ${paint(C.bold, normalized)}`);
    console.log();
    console.log('  I’ll inspect the target and launch the local vanity engine.');
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Analyze')}  ${paint(C.gray, `pattern=${normalized} · ${isSuffix ? 'suffix' : 'prefix'} · case-insensitive`)}`);
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Estimate')} ${paint(C.gray, `16^${pattern.length} = ${fmt.format(space)} search space · ${level}`)}`);
    console.log();
    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Ready')} ${paint(C.gray, 'single local engine · raw secret file mode')}`);
    console.log();

    let lastRate = 0;
    const progressEvery = pattern.length <= 4 ? 5000 : 50000;

    process.stdout.write(`  ${paint(C.yellow, '◐')} ${paint(C.yellow, 'Running')} ${paint(C.gray, 'generating keys...')}`);

    const result = findVanityWallet(pattern, {
        isSuffix,
        progressEvery,
        onProgress: ({ attempts, rate }) => {
            lastRate = rate;
            process.stdout.write(`\r\x1b[2K  ${paint(C.yellow, '◐')} ${paint(C.yellow, 'Running')} ${paint(C.gray, `${fmt.format(attempts)} attempts · ${fmt.format(rate)} addr/s`)}`);
        }
    });

    process.stdout.write('\r\x1b[2K');
    const filepath = writeSecretFile(result, normalized);
    const seconds = result.elapsedMs / 1000;

    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Match found')} ${paint(C.gray, `after ${fmt.format(result.attempts)} attempts`)}`);
    console.log();
    console.log(`  ${paint(C.gray, 'PUBLIC ADDRESS')}`);
    console.log(`  ${paint(C.bold, result.address)}`);
    console.log();
    console.log(`  ${paint(C.gray, 'SEARCH STATS')}`);
    console.log(`  ${fmt.format(result.attempts)} attempts · ${fmt.format(result.rate || lastRate)} addr/s · ${seconds.toFixed(2)}s`);
    console.log();
    console.log(`  ${paint(C.gray, 'SECRET OUTPUT')}`);
    console.log(`  Saved locally → ${paint(C.accent, path.basename(filepath))}`);
    console.log(`  ${paint(C.yellow, 'Private key is inside that file. Do not commit or share it.')}`);
    console.log();
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: 50,
    prompt: `${paint(C.accent, '›')} `
});

const handleCommand = (line) => {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return;

    const command = tokens.shift().toLowerCase();

    try {
        if (command === 'run') runSearch(tokens);
        else if (command === 'explain') explain(tokens[0]);
        else if (command === 'security') security();
        else if (command === 'help') printHelp();
        else if (command === 'clear') banner();
        else if (command === 'quit' || command === 'exit') rl.close();
        else console.log(`${paint(C.red, 'Unknown command:')} ${command}. Type ${paint(C.bold, 'help')}.\n`);
    } catch (error) {
        console.log(`${paint(C.red, 'Error')} ${error.message}\n`);
    }
};

banner();
rl.prompt();
rl.on('line', (line) => {
    handleCommand(line);
    rl.prompt();
});
rl.on('close', () => {
    console.log(`\n${paint(C.gray, 'Session closed. Keep your keys private.')}`);
    process.exit(0);
});
