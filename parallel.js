const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');
const { startMonitor } = require('./monitor.js');

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
    const index = args.indexOf(name);
    if (index === -1 || index + 1 >= args.length) return fallback;
    return args[index + 1];
};
const hasFlag = (name) => args.includes(name);
const pattern = args[0];

if (!pattern || !/^[0-9a-fA-F]+$/.test(pattern)) {
    console.error('Usage: node parallel.js <hex-pattern> [--workers 40] [--suffix] [--port 4173] [--lan]');
    process.exit(1);
}
if (pattern.length > 12) {
    console.error('Pattern length is limited to 12 hex characters in this runner.');
    process.exit(1);
}

const cpuCount = Math.max(1, os.cpus().length);
const workerCount = Math.max(1, Math.min(128, Number.parseInt(readFlag('--workers', String(cpuCount)), 10) || cpuCount));
const port = Math.max(1, Math.min(65535, Number.parseInt(readFlag('--port', '4173'), 10) || 4173));
const host = hasFlag('--lan') ? '0.0.0.0' : '127.0.0.1';
const isSuffix = hasFlag('--suffix');
const progressEvery = Math.max(5000, Number.parseInt(readFlag('--progress-every', '50000'), 10) || 50000);
const normalized = pattern.toLowerCase();
const expectedSpace = Math.pow(16, normalized.length);
const lanUrls = () => Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => `http://${net.address}:${port}`);
const startedAt = Date.now();
const states = new Map();
const workers = [];
let status = 'running';
let foundAddress = null;
let resultPath = null;
let shuttingDown = false;

for (let i = 1; i <= workerCount; i++) {
    states.set(i, { id: i, attempts: 0, rate: 0, elapsedMs: 0, lastSeen: startedAt, status: 'starting' });
}

const snapshot = () => {
    const list = [...states.values()];
    const totalAttempts = list.reduce((sum, w) => sum + (w.attempts || 0), 0);
    const totalRate = list.reduce((sum, w) => sum + (w.rate || 0), 0);
    const chanceFound = expectedSpace > 1
        ? 1 - Math.exp(totalAttempts * Math.log1p(-1 / expectedSpace))
        : Math.min(1, totalAttempts);

    return {
        status,
        pattern: normalized,
        isSuffix,
        workerCount,
        activeWorkers: status === 'running' ? list.filter((w) => w.status === 'running' || w.status === 'starting').length : 0,
        totalAttempts,
        totalRate,
        expectedSpace,
        chanceFound: Math.max(0, Math.min(1, chanceFound)),
        meanSecondsAtCurrentRate: totalRate > 0 ? expectedSpace / totalRate : null,
        startedAt,
        foundAddress,
        resultFile: resultPath ? path.basename(resultPath) : null,
        workers: list
    };
};

const writeSecretFile = (result) => {
    const filename = `address_0x${normalized}.txt`;
    const filepath = path.resolve(process.cwd(), filename);
    const body = `Address : ${result.address}\nPrivate Key : ${result.privKey}\n`;
    fs.writeFileSync(filepath, body, { mode: 0o600 });
    return filepath;
};

const stopWorkers = async (exceptId = null) => {
    await Promise.all(workers.map(({ id, worker }) => {
        if (id === exceptId) return Promise.resolve();
        return worker.terminate().catch(() => undefined);
    }));
};

const shutdown = async (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (status === 'running') status = 'stopped';
    await stopWorkers();
    process.exit(exitCode);
};

(async () => {
    try {
        const server = await startMonitor({ host, port, getSnapshot: snapshot });
        const localUrl = `http://127.0.0.1:${port}`;
        console.log(`ethvanity parallel · target=${normalized.toUpperCase()} · workers=${workerCount}`);
        console.log(`monitor: ${localUrl}`);
        if (host === '0.0.0.0') {
            const urls = lanUrls();
            if (urls.length) console.log(`LAN: ${urls.join(' · ')}`);
        }
        console.log('private keys are never exposed by the monitor');
        if (workerCount > cpuCount) console.log(`note: ${workerCount} workers on ${cpuCount} logical CPUs may reduce total throughput`);
        console.log();

        for (let id = 1; id <= workerCount; id++) {
            const worker = new Worker(path.resolve(__dirname, 'search-worker.js'), {
                workerData: { id, pattern: normalized, isSuffix, progressEvery }
            });
            workers.push({ id, worker });
            states.get(id).status = 'running';

            worker.on('message', async (message) => {
                const current = states.get(id);
                if (!current) return;

                if (message.type === 'progress') {
                    current.attempts = message.attempts;
                    current.rate = message.rate;
                    current.elapsedMs = message.elapsedMs;
                    current.lastSeen = message.at || Date.now();
                    current.status = 'running';
                    return;
                }

                if (message.type === 'found' && status === 'running') {
                    current.attempts = message.result.attempts;
                    current.rate = message.result.rate;
                    current.elapsedMs = message.result.elapsedMs;
                    current.lastSeen = message.at || Date.now();
                    current.status = 'found';
                    status = 'found';
                    foundAddress = message.result.address;
                    resultPath = writeSecretFile(message.result);
                    console.log(`\nmatch found by worker #${id}`);
                    console.log(`public address: ${foundAddress}`);
                    console.log(`secret saved locally: ${resultPath}`);
                    console.log('monitor remains available until you press Ctrl+C');
                    await stopWorkers(id);
                    return;
                }

                if (message.type === 'error') {
                    current.status = 'error';
                    current.lastSeen = message.at || Date.now();
                    current.error = message.message;
                    if ([...states.values()].every((w) => w.status === 'error')) status = 'error';
                }
            });

            worker.on('error', (error) => {
                const current = states.get(id);
                if (current) {
                    current.status = 'error';
                    current.error = error.message;
                    current.lastSeen = Date.now();
                }
            });

            worker.on('exit', (code) => {
                const current = states.get(id);
                if (!current) return;
                if (status === 'running' && current.status !== 'error') current.status = code === 0 ? 'stopped' : 'error';
                current.lastSeen = Date.now();
            });
        }

        const ticker = setInterval(() => {
            const s = snapshot();
            if (status !== 'running') return;
            process.stdout.write(`\r${s.totalAttempts.toLocaleString('en-US')} attempts · ${s.totalRate.toLocaleString('en-US')} addr/s · ${s.activeWorkers}/${s.workerCount} workers`);
        }, 1000);
        ticker.unref();

        process.on('SIGINT', async () => {
            console.log('\nStopping workers…');
            server.close();
            await shutdown(0);
        });
        process.on('SIGTERM', async () => {
            server.close();
            await shutdown(0);
        });
    } catch (error) {
        console.error(`Failed to start: ${error.message}`);
        await shutdown(1);
    }
})();
