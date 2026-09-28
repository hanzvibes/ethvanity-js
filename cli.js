const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { resolveWorkerCount, defaultWorkerCount, startVanityWorkerPool } = require('./worker-pool.js');

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
const divider = () => console.log(paint(C.faint, '─────────────────────────────────────────────────────────────'));

let activeJob = null;
let lastJob = null;
let shuttingDown = false;

const banner = () => {
    console.clear();
    console.log(`${paint(C.bold, 'ethvanity')}  ${paint(C.accent, 'local agent')}  ${paint(C.gray, 'worker pool')}`);
    console.log(paint(C.gray, 'Ethereum vanity address generator · simple local output'));
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
    if (!/^[0-9a-fA-F]+$/.test(pattern)) {
        throw new Error('Pattern must use hexadecimal characters only: 0-9 and A-F.');
    }
    if (pattern.length > 12) {
        throw new Error('Interactive mode currently limits patterns to 12 characters.');
    }
    return pattern;
};

const parseRunArgs = (args) => {
    let pattern = null;
    let isSuffix = false;
    let workers;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--suffix') {
            isSuffix = true;
        } else if (arg === '--workers') {
            if (i + 1 >= args.length) throw new Error('--workers requires a number.');
            workers = args[++i];
        } else if (arg.startsWith('--workers=')) {
            workers = arg.slice('--workers='.length);
        } else if (arg.startsWith('--')) {
            throw new Error(`Unknown option: ${arg}`);
        } else if (!pattern) {
            pattern = arg;
        } else {
            throw new Error(`Unexpected argument: ${arg}`);
        }
    }

    return {
        pattern: parsePattern(pattern),
        isSuffix,
        workers: resolveWorkerCount(workers)
    };
};

const saveWallet = (result, pattern) => {
    const filename = `0x${pattern.toUpperCase()}.txt`;
    const filepath = path.resolve(process.cwd(), filename);
    const body = [
        `Address : ${result.address}`,
        `Private Key : ${result.privKey}`,
        ''
    ].join('\n');

    fs.appendFileSync(filepath, `${body}\n`, { mode: 0o600 });
    try {
        fs.chmodSync(filepath, 0o600);
    } catch (_) {}

    return filepath;
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: 50,
    prompt: `${paint(C.accent, '›')} `
});

const notify = (printer) => {
    if (shuttingDown) return;
    if (process.stdout.isTTY) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }
    printer();
    rl.prompt(true);
};

const printHelp = () => {
    console.log(paint(C.bold, 'Commands'));
    console.log(`  ${paint(C.accent, 'run CAFE')}                    Find one prefix match`);
    console.log(`  ${paint(C.accent, 'run CAFE --suffix')}           Find one suffix match`);
    console.log(`  ${paint(C.accent, 'run CAFE --workers 8')}        Choose worker count`);
    console.log(`  ${paint(C.accent, 'status')}                      Show live search telemetry`);
    console.log(`  ${paint(C.accent, 'stop')}                        Stop the active search`);
    console.log(`  ${paint(C.accent, 'explain CAFE')}                Explain search difficulty`);
    console.log(`  ${paint(C.accent, 'security')}                    Show secret-handling notes`);
    console.log(`  ${paint(C.accent, 'clear')}                       Clear terminal`);
    console.log(`  ${paint(C.accent, 'quit')}                        Exit`);
    console.log();
    console.log(paint(C.gray, `Default workers on this machine: ${defaultWorkerCount()}`));
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
    console.log(`${paint(C.accent, '›')} Security notes`);
    console.log();
    console.log(`  ${paint(C.green, '✓')} Entropy is generated locally with node:crypto.randomBytes`);
    console.log(`  ${paint(C.green, '✓')} Worker threads run locally and do not use RPC or an AI API`);
    console.log(`  ${paint(C.green, '✓')} Generated 0x*.txt files are ignored by Git`);
    console.log(`  ${paint(C.yellow, '!')} The output file contains the raw private key in plaintext`);
    console.log(`  ${paint(C.yellow, '!')} Keep the file private`);
    console.log();
};

const printStatus = () => {
    if (!activeJob) {
        if (!lastJob) {
            console.log(`${paint(C.gray, 'No active search.')}\n`);
            return;
        }
        console.log(`${paint(C.accent, '›')} Last search`);
        console.log(`  ${paint(C.gray, `pattern=${lastJob.pattern} · ${lastJob.workers} workers · ${lastJob.state}`)}`);
        if (lastJob.attempts !== undefined) {
            console.log(`  ${fmt.format(lastJob.attempts)} attempts · ${fmt.format(lastJob.rate || 0)} addr/s`);
        }
        console.log();
        return;
    }

    const status = activeJob.pool.status();
    console.log(`${paint(C.accent, '›')} Status`);
    console.log(`  ${paint(C.yellow, '◐')} Searching ${paint(C.bold, activeJob.pattern)}`);
    console.log(`  ${paint(C.gray, `${fmt.format(status.attempts)} attempts · ${fmt.format(status.rate)} addr/s · ${status.workers} workers · ${(status.elapsedMs / 1000).toFixed(1)}s`)}`);
    console.log();
};

const completeSearch = (jobRef, result) => {
    if (activeJob !== jobRef) return;
    const filepath = saveWallet(result, jobRef.pattern);

    lastJob = {
        pattern: jobRef.pattern,
        workers: jobRef.workers,
        state: 'completed',
        attempts: result.attempts,
        rate: result.rate
    };
    activeJob = null;

    notify(() => {
        console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Match found')} ${paint(C.gray, `after ${fmt.format(result.attempts)} aggregate attempts`)}`);
        console.log();
        console.log(`  Address     : ${paint(C.bold, result.address)}`);
        console.log(`  Private Key : ${paint(C.yellow, result.privKey)}`);
        console.log(`  Saved       : ${paint(C.accent, path.basename(filepath))}`);
        console.log();
        console.log(`  ${paint(C.gray, `${fmt.format(result.rate)} addr/s · ${result.workers} workers · ${(result.elapsedMs / 1000).toFixed(2)}s`)}`);
        console.log();
    });
};

const startSearch = (args) => {
    if (activeJob) throw new Error('A search is already active. Use status or stop first.');

    const { pattern, isSuffix, workers } = parseRunArgs(args);
    const normalized = pattern.toUpperCase();
    const { space, level } = estimate(pattern);
    const progressEvery = pattern.length <= 4 ? 5000 : 50000;

    console.log(`${paint(C.accent, '›')} Find an Ethereum address ${isSuffix ? 'ending' : 'starting'} with ${paint(C.bold, normalized)}`);
    console.log();
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Analyze')}  ${paint(C.gray, `pattern=${normalized} · ${isSuffix ? 'suffix' : 'prefix'} · case-insensitive`)}`);
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Estimate')} ${paint(C.gray, `16^${pattern.length} = ${fmt.format(space)} search space · ${level}`)}`);
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Workers')}  ${paint(C.gray, `${workers} local worker threads`)}`);
    console.log();

    const pool = startVanityWorkerPool({ pattern, isSuffix, workers, progressEvery });
    const jobRef = { pattern: normalized, isSuffix, workers, pool };
    activeJob = jobRef;

    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Search started')} ${paint(C.gray, `${workers} workers · output → 0x${normalized}.txt`)}`);
    console.log();

    pool.result
        .then((result) => completeSearch(jobRef, result))
        .catch((error) => {
            if (activeJob === jobRef) activeJob = null;
            lastJob = {
                pattern: normalized,
                workers,
                state: error.code === 'SEARCH_STOPPED' ? 'stopped' : 'failed'
            };

            if (error.code === 'SEARCH_STOPPED') {
                if (!shuttingDown) notify(() => console.log(`${paint(C.yellow, '●')} Search stopped.\n`));
            } else {
                notify(() => console.log(`${paint(C.red, 'Search error')} ${error.message}\n`));
            }
        });
};

const stopSearch = () => {
    if (!activeJob) {
        console.log(`${paint(C.gray, 'No active search.')}\n`);
        return;
    }
    activeJob.pool.stop();
};

const handleCommand = (line) => {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    const command = tokens.shift().toLowerCase();

    try {
        if (command === 'run') startSearch(tokens);
        else if (command === 'status') printStatus();
        else if (command === 'stop') stopSearch();
        else if (command === 'explain') explain(tokens[0]);
        else if (command === 'security') security();
        else if (command === 'help') printHelp();
        else if (command === 'clear') banner();
        else if (command === 'quit' || command === 'exit') {
            if (activeJob) activeJob.pool.stop();
            return true;
        } else {
            console.log(`${paint(C.red, 'Unknown command:')} ${command}. Type ${paint(C.bold, 'help')}.\n`);
        }
    } catch (error) {
        console.log `${paint(C.red, 'Error')} ${error.message}\n`);
    }

    return false;
};

banner();
rl.prompt();
rl.on('line', (line) => {
    const shouldExit = handleCommand(line);
    if (shouldExit) {
        shuttingDown = true;
        rl.close();
        return;
    }
    rl.prompt();
});
rl.on('close', () => {
    shuttingDown = true;
    console.log(`\n${paint(C.gray, 'Session closed. Keep your private keys private.')}`);
    process.exit(0);
});
