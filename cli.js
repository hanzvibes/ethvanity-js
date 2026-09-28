const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const { findVanityWallet } = require('./vanity.js');
const { encryptPrivateKeyToKeystore } = require('./keystore.js');

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
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
const divider = () => console.log(paint(C.faint, '───────────────────────────────────────────────────────────'));

const banner = () => {
    console.clear();
    console.log(`${paint(C.bold, 'ethvanity')}  ${paint(C.accent, 'local agent')}  ${paint(C.gray, 'encrypted secrets')}`);
    console.log(paint(C.gray, 'Ethereum vanity wallet terminal · private keys stay local'));
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

const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');

const writeKeystoreFile = (json, address, pattern, isSuffix) => {
    const outputDir = path.resolve(process.cwd(), 'wallets');
    fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

    const safePattern = pattern.toLowerCase();
    const side = isSuffix ? 'suffix' : 'prefix';
    const addressTail = address.slice(-8).toLowerCase();
    const filename = `${safePattern}-${side}-${timestampSlug()}-${addressTail}.keystore.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, `${json}\n`, { mode: 0o600, flag: 'wx' });
    return filepath;
};

const mutedOutput = new Writable({
    write(chunk, encoding, callback) {
        if (!mutedOutput.muted) {
            process.stdout.write(chunk, encoding);
        }
        callback();
    }
});
mutedOutput.muted = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: mutedOutput,
    historySize: 50,
    terminal: Boolean(process.stdin.isTTY && process.stdout.isTTY)
});

const ask = (question) => new Promise((resolve) => {
    mutedOutput.muted = false;
    rl.question(question, resolve);
});

const askHidden = (question) => new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        reject(new Error('Secure password entry requires an interactive TTY.'));
        return;
    }

    process.stdout.write(question);
    mutedOutput.muted = true;

    rl.question('', (answer) => {
        mutedOutput.muted = false;
        process.stdout.write('\n');

        if (Array.isArray(rl.history)) {
            const historyIndex = rl.history.indexOf(answer);
            if (historyIndex !== -1) rl.history.splice(historyIndex, 1);
        }

        resolve(answer);
    });
});

const askKeystorePassword = async () => {
    const first = await askHidden('  Keystore password: ');
    if (first.length < 12) {
        throw new Error('Keystore password must be at least 12 characters.');
    }

    const second = await askHidden('  Confirm password : ');
    if (first !== second) {
        throw new Error('Password confirmation does not match.');
    }

    return first;
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
    console.log(`  ${paint(C.green, '✓')} CLI writes encrypted Ethereum keystore JSON by default`);
    console.log(`  ${paint(C.green, '✓')} Keystore password input is hidden and removed from readline history`);
    console.log(`  ${paint(C.green, '✓')} Secret filenames are unique and never silently overwritten`);
    console.log(`  ${paint(C.green, '✓')} wallets/ is ignored by Git`);
    console.log(`  ${paint(C.yellow, '!')} Losing the keystore password means the encrypted wallet cannot be recovered from the file.`);
    console.log();
};

const runSearch = async (args) => {
    const isSuffix = args.includes('--suffix');
    const rawPattern = args.find((arg) => !arg.startsWith('--'));
    const pattern = parsePattern(rawPattern);
    const normalized = pattern.toUpperCase();
    const { space, level } = estimate(pattern);

    console.log(`${paint(C.accent, '›')} Find an Ethereum address ${isSuffix ? 'ending' : 'starting'} with ${paint(C.bold, normalized)}`);
    console.log();
    console.log('  I’ll inspect the target, protect the result with a password, then launch the local vanity engine.');
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Analyze')}  ${paint(C.gray, `pattern=${normalized} · ${isSuffix ? 'suffix' : 'prefix'} · case-insensitive`)}`);
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Estimate')} ${paint(C.gray, `16^${pattern.length} = ${fmt.format(space)} search space · ${level}`)}`);
    console.log();

    const password = await askKeystorePassword();
    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Ready')} ${paint(C.gray, 'single local engine · encrypted keystore mode')}`);
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
    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Match found')} ${paint(C.gray, `after ${fmt.format(result.attempts)} attempts`)}`);
    console.log();

    process.stdout.write(`  ${paint(C.yellow, '◐')} ${paint(C.yellow, 'Encrypting')} ${paint(C.gray, 'keystore 0%')}`);
    const json = await encryptPrivateKeyToKeystore(result.privKey, password, (progress) => {
        const percent = Math.floor(progress * 100);
        process.stdout.write(`\r\x1b[2K  ${paint(C.yellow, '◐')} ${paint(C.yellow, 'Encrypting')} ${paint(C.gray, `keystore ${percent}%`)}`);
    });
    process.stdout.write('\r\x1b[2K');

    const filepath = writeKeystoreFile(json, result.address, normalized, isSuffix);
    const seconds = result.elapsedMs / 1000;

    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Keystore encrypted')} ${paint(C.gray, 'Ethereum JSON keystore')}`);
    console.log();
    console.log(`  ${paint(C.gray, 'PUBLIC ADDRESS')}`);
    console.log(`  ${paint(C.bold, result.address)}`);
    console.log();
    console.log(`  ${paint(C.gray, 'SEARCH STATS')}`);
    console.log(`  ${fmt.format(result.attempts)} attempts · ${fmt.format(result.rate || lastRate)} addr/s · ${seconds.toFixed(2)}s`);
    console.log();
    console.log(`  ${paint(C.gray, 'SECRET OUTPUT')}`);
    console.log(`  Saved locally → ${paint(C.accent, path.relative(process.cwd(), filepath))}`);
    console.log(`  ${paint(C.green, 'Private key is encrypted inside the keystore JSON.')}`);
    console.log(`  ${paint(C.yellow, 'Back up the keystore and password separately. Never commit the keystore to Git.')}`);
    console.log();
};

const handleCommand = async (line) => {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;

    const command = tokens.shift().toLowerCase();

    try {
        if (command === 'run') await runSearch(tokens);
        else if (command === 'explain') explain(tokens[0]);
        else if (command === 'security') security();
        else if (command === 'help') printHelp();
        else if (command === 'clear') banner();
        else if (command === 'quit' || command === 'exit') return true;
        else console.log(`${paint(C.red, 'Unknown command:')} ${command}. Type ${paint(C.bold, 'help')}.\n`);
    } catch (error) {
        mutedOutput.muted = false;
        console.log(`${paint(C.red, 'Error')} ${error.message}\n`);
    }

    return false;
};

const main = async () => {
    banner();

    let shouldExit = false;
    while (!shouldExit) {
        const line = await ask(`${paint(C.accent, '›')} `);
        shouldExit = await handleCommand(line);
    }

    rl.close();
    console.log(`\n${paint(C.gray, 'Session closed. Keep your keystore password private.')}`);
};

main().catch((error) => {
    mutedOutput.muted = false;
    console.error(`${paint(C.red, 'Fatal')} ${error.message}`);
    rl.close();
    process.exitCode = 1;
});
