const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const { resolveWorkerCount, defaultWorkerCount, startVanityWorkerPool } = require('./worker-pool.js');
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
let activeJob = null;
let lastJob = null;
let commandPromptActive = false;
let shuttingDown = false;

const banner = () => {
    console.clear();
    console.log(`${paint(C.bold, 'ethvanity')}  ${paint(C.accent, 'local agent')}  ${paint(C.gray, 'worker pool · encrypted secrets')}`);
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
        if (!mutedOutput.muted) process.stdout.write(chunk, encoding);
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
    commandPromptActive = true;
    rl.question(question, (answer) => {
        commandPromptActive = false;
        resolve(answer);
    });
});

const askHidden = (question) => new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        reject(new Error('Secure password entry requires an interactive TTY.'));
        return;
    }

    commandPromptActive = false;
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

const notify = (printer) => {
    if (shuttingDown) return;
    if (commandPromptActive) process.stdout.write('\n');
    printer();
    if (commandPromptActive && typeof rl._refreshLine === 'function') rl._refreshLine();
};

const askKeystorePassword = async () => {
    const first = await askHidden('  Keystore password: ');
    if (first.length < 12) throw new Error('Keystore password must be at least 12 characters.');

    const second = await askHidden('  Confirm password : ');
    if (first !== second) throw new Error('Password confirmation does not match.');
    return first;
};

const printHelp = () => {
    console.log(paint(C.bold, 'Commands'));
    console.log(`  ${paint(C.accent, 'run CAFE')}                    Find one prefix match`);
    console.log(`  ${paint(C.accent, 'run CAFE --suffix')}           Find one suffix match`);
    console.log(`  ${paint(C.accent, 'run CAFE --workers 8')}        Choose worker count`);
    console.log(`  ${paint(C.accent, 'status')}                      Show live search telemetry`);
    console.log(`  ${paint(C.accent, 'stop')}                        Stop the active search`);
    console.log(`  ${paint(C.accent, 'explain CAFE')}                Explain search difficulty`);
    console.log(`  ${paint(C.accent, 'security')}                    Show local secret-handling checks`);
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
    console.log(`${paint(C.accent, '›')} Run security check`);
    console.log();
    console.log(`  ${paint(C.green, '✓')} Entropy generated locally with node:crypto.randomBytes`);
    console.log(`  ${paint(C.green, '✓')} Worker threads receive only search configuration, never a keystore password`);
    console.log(`  ${paint(C.green, '✓')} Winning private key returns only to the local main process for encryption`);
    console.log(`  ${paint(C.green, '✓')} CLI writes encrypted Ethereum keystore JSON by default`);
    console.log(`  ${paint(C.green, '✓')} Keystore password input is hidden and removed from readline history`);
    console.log(`  ${paint(C.green, '✓')} Secret filenames are unique and wallets/ is ignored by Git`);
    console.log(`  ${paint(C.yellow, '!')} Losing the keystore password means the encrypted wallet cannot be recovered from the file.`);
    console.log();
};

const printStatus = () => {
    if (!activeJob) {
        if (!lastJob) {
            console.log(`${paint(C.gray, 'No active search.')}\n`);
            return;
        }
        console.log(`${paint(C.accent, '›')} Last search`);
        console.log(`  ${paint(C.gray, `pattern=${lastJob.pattern} · ${lastJob.isSuffix ? 'suffix' : 'prefix'} · ${lastJob.workers} workers · ${lastJob.state}`)}`);
        if (lastJob.attempts !== undefined) {
            console.log(`  ${fmt.format(lastJob.attempts)} attempts · ${fmt.format(lastJob.rate || 0)} addr/s`);
        }
        console.log();
        return;
    }

    if (activeJob.phase === 'encrypting') {
        console.log(`${paint(C.accent, '›')} Status`);
        console.log(`  ${paint(C.yellow, '◐')} Encrypting matched wallet as Ethereum keystore JSON`);
        console.log(`  ${paint(C.gray, `pattern=${activeJob.pattern} · ${activeJob.workers} workers used`)}`);
        console.log();
        return;
    }

    const status = activeJob.pool.status();
    console.log(`${paint(C.accent, '›')} Status`);
    console.log(`  ${paint(C.yellow, '◐')} Searching ${paint(C.bold, activeJob.pattern)}`);
    console.log(`  ${paint(C.gray, `${fmt.format(status.attempts)} attempts · ${fmt.format(status.rate)} addr/s · ${status.workers} workers · ${(status.elapsedMs / 1000).toFixed(1)}s`)}`);
    console.log();
};

const completeSearch = async (jobRef, result, password) => {
    if (activeJob !== jobRef) return;
    activeJob.phase = 'encrypting';
    activeJob.resultStats = result;

    notify(() => {
        console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Match found')} ${paint(C.gray, `after ${fmt.format(result.attempts)} aggregate attempts`)}`);
        console.log(`  ${paint(C.yellow, '◐')} ${paint(C.yellow, 'Encrypting')} ${paint(C.gray, 'keystore 0%')}`);
    });

    let privateKey = result.privKey;
    let secretPassword = password;

    try {
        let lastPercent = -1;
        const json = await encryptPrivateKeyToKeystore(privateKey, secretPassword, (progress) => {
            const percent = Math.floor(progress * 100);
            if (percent === lastPercent || percent % 10 !== 0) return;
            lastPercent = percent;
            notify(() => console.log(`  ${paint(C.yellow, '◐')} ${paint(C.yellow, 'Encrypting')} ${paint(C.gray, `keystore ${percent}%`)}`));
        });

        const filepath = writeKeystoreFile(json, result.address, jobRef.pattern, jobRef.isSuffix);
        lastJob = {
            pattern: jobRef.pattern,
            isSuffix: jobRef.isSuffix,
            workers: jobRef.workers,
            state: 'completed',
            attempts: result.attempts,
            rate: result.rate
        };

        notify(() => {
            console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Keystore encrypted')} ${paint(C.gray, 'Ethereum JSON keystore')}`);
            console.log();
            console.log(`  ${paint(C.gray, 'PUBLIC ADDRESS')}`);
            console.log(`  ${paint(C.bold, result.address)}`);
            console.log();
            console.log(`  ${paint(C.gray, 'SEARCH STATS')}`);
            console.log(`  ${fmt.format(result.attempts)} aggregate attempts · ${fmt.format(result.rate)} addr/s · ${result.workers} workers · ${(result.elapsedMs / 1000).toFixed(2)}s`);
            console.log();
            console.log(`  ${paint(C.gray, 'SECRET OUTPUT')}`);
            console.log(`  Saved locally → ${paint(C.accent, path.relative(process.cwd(), filepath))}`);
            console.log(`  ${paint(C.green, 'Private key is encrypted inside the keystore JSON.')}`);
            console.log(`  ${paint(C.yellow, 'Back up the keystore and password separately. Never commit the keystore to Git.')}`);
            console.log();
        });
    } catch (error) {
        lastJob = {
            pattern: jobRef.pattern,
            isSuffix: jobRef.isSuffix,
            workers: jobRef.workers,
            state: 'encryption failed',
            attempts: result.attempts,
            rate: result.rate
        };
        notify(() => console.log(`${paint(C.red, 'Encryption error')} ${error.message}\n`));
    } finally {
        privateKey = null;
        secretPassword = null;
        if (activeJob === jobRef) activeJob = null;
    }
};

const startSearch = async (args) => {
    if (activeJob) throw new Error('A search is already active. Use status or stop first.');

    const { pattern, isSuffix, workers } = parseRunArgs(args);
    const normalized = pattern.toUpperCase();
    const { space, level } = estimate(pattern);

    console.log(`${paint(C.accent, '›')} Find an Ethereum address ${isSuffix ? 'ending' : 'starting'} with ${paint(C.bold, normalized)}`);
    console.log();
    console.log('  I’ll protect the result with a password, then launch a local worker pool.');
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Analyze')}  ${paint(C.gray, `pattern=${normalized} · ${isSuffix ? 'suffix' : 'prefix'} · case-insensitive`)}`);
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Estimate')} ${paint(C.gray, `16^${pattern.length} = ${fmt.format(space)} search space · ${level}`)}`);
    console.log(`  ${paint(C.gray, '└')} ${paint(C.blue, 'Workers')}  ${paint(C.gray, `${workers} local worker threads`)}`);
    console.log();

    let password = await askKeystorePassword();
    const progressEvery = pattern.length <= 4 ? 5000 : 50000;
    const pool = startVanityWorkerPool({ pattern, isSuffix, workers, progressEvery });
    const jobRef = { pattern: normalized, isSuffix, workers, pool, phase: 'searching' };
    activeJob = jobRef;

    console.log(`  ${paint(C.green, '●')} ${paint(C.green, 'Search started')} ${paint(C.gray, `${workers} workers · terminal remains interactive`)}`);
    console.log(`  ${paint(C.gray, 'Use status for live telemetry or stop to cancel.')}`);
    console.log();

    pool.result
        .then((result) => completeSearch(jobRef, result, password))
        .catch((error) => {
            if (activeJob === jobRef) activeJob = null;
            lastJob = {
                pattern: normalized,
                isSuffix,
                workers,
                state: error.code === 'SEARCH_STOPPED' ? 'stopped' : 'failed'
            };
            if (error.code !== 'SEARCH_STOPPED') {
                notify(() => console.log(`${paint(C.red, 'Search error')} ${error.message}\n`));
            } else if (!shuttingDown) {
                notify(() => console.log(`${paint(C.yellow, '●')} Search stopped.\n`));
            }
        })
        .finally(() => {
            password = null;
        });
};

const stopSearch = () => {
    if (!activeJob) {
        console.log(`${paint(C.gray, 'No active search.')}\n`);
        return;
    }
    if (activeJob.phase === 'encrypting') {
        console.log(`${paint(C.yellow, 'Encryption is already in progress; wait for the keystore write to finish.')}\n`);
        return;
    }
    activeJob.pool.stop();
};

const handleCommand = async (line) => {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    const command = tokens.shift().toLowerCase();

    try {
        if (command === 'run') await startSearch(tokens);
        else if (command === 'status') printStatus();
        else if (command === 'stop') stopSearch();
        else if (command === 'explain') explain(tokens[0]);
        else if (command === 'security') security();
        else if (command === 'help') printHelp();
        else if (command === 'clear') banner();
        else if (command === 'quit' || command === 'exit') {
            if (activeJob && activeJob.phase === 'encrypting') {
                console.log(`${paint(C.yellow, 'Keystore encryption is in progress. Wait until it finishes before exiting.')}\n`);
                return false;
            }
            if (activeJob) activeJob.pool.stop();
            return true;
        } else {
            console.log(`${paint(C.red, 'Unknown command:')} ${command}. Type ${paint(C.bold, 'help')}.\n`);
        }
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

    shuttingDown = true;
    rl.close();
    console.log(`\n${paint(C.gray, 'Session closed. Keep your keystore password private.')}`);
};

main().catch((error) => {
    shuttingDown = true;
    mutedOutput.muted = false;
    console.error(`${paint(C.red, 'Fatal')} ${error.message}`);
    if (activeJob && activeJob.phase === 'searching') activeJob.pool.stop();
    rl.close();
    process.exitCode = 1;
});
