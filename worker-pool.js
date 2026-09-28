const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');

const MAX_WORKERS = 32;

const availableParallelism = () => {
    if (typeof os.availableParallelism === 'function') return os.availableParallelism();
    return Math.max(1, os.cpus().length);
};

const defaultWorkerCount = () => Math.min(8, Math.max(1, availableParallelism() - 1));

const resolveWorkerCount = (value) => {
    if (value === undefined || value === null || value === '') return defaultWorkerCount();
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_WORKERS) {
        throw new Error(`Worker count must be an integer between 1 and ${MAX_WORKERS}.`);
    }
    return parsed;
};

const statsFrom = (startedAt, attempts) => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const rate = elapsedMs > 0 ? Math.round(attempts / (elapsedMs / 1000)) : 0;
    return { elapsedMs, rate };
};

const startVanityWorkerPool = ({ pattern, isSuffix = false, workers, progressEvery = 25000, onProgress = null }) => {
    const workerCount = resolveWorkerCount(workers);
    const workerPath = path.join(__dirname, 'workers', 'vanity-worker.js');
    const startedAt = process.hrtime.bigint();
    const instances = [];
    const attemptsByWorker = new Map();
    let settled = false;
    let stopped = false;
    let resolveResult;
    let rejectResult;

    const totalAttempts = () => [...attemptsByWorker.values()].reduce((sum, attempts) => sum + attempts, 0);

    const snapshot = () => {
        const attempts = totalAttempts();
        const stats = statsFrom(startedAt, attempts);
        return {
            attempts,
            elapsedMs: stats.elapsedMs,
            rate: stats.rate,
            workers: workerCount,
            stopped,
            done: settled && !stopped
        };
    };

    const terminateAll = (except = null) => {
        for (const worker of instances) {
            if (worker !== except) worker.terminate().catch(() => {});
        }
    };

    const result = new Promise((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });

    for (let index = 0; index < workerCount; index++) {
        attemptsByWorker.set(index, 0);
        const worker = new Worker(workerPath, {
            workerData: { index, pattern, isSuffix, progressEvery }
        });
        instances.push(worker);

        worker.on('message', (message) => {
            if (settled) return;

            if (message.type === 'progress') {
                attemptsByWorker.set(index, message.attempts);
                if (typeof onProgress === 'function') onProgress(snapshot());
                return;
            }

            if (message.type === 'found') {
                attemptsByWorker.set(index, message.attempts);
                const aggregate = snapshot();
                settled = true;
                terminateAll(worker);
                resolveResult({
                    address: message.address,
                    privKey: message.privKey,
                    attempts: aggregate.attempts,
                    elapsedMs: aggregate.elapsedMs,
                    rate: aggregate.rate,
                    workers: workerCount,
                    winningWorker: index
                });
            }
        });

        worker.on('error', (error) => {
            if (settled) return;
            settled = true;
            terminateAll(worker);
            rejectResult(error);
        });

        worker.on('exit', (code) => {
            if (settled || stopped || code === 0) return;
            settled = true;
            terminateAll(worker);
            rejectResult(new Error(`Vanity worker ${index + 1} exited with code ${code}.`));
        });
    }

    const stop = () => {
        if (settled) return false;
        stopped = true;
        settled = true;
        terminateAll();
        const error = new Error('Search stopped by user.');
        error.code = 'SEARCH_STOPPED';
        rejectResult(error);
        return true;
    };

    return {
        result,
        stop,
        status: snapshot,
        workers: workerCount
    };
};

module.exports = {
    MAX_WORKERS,
    defaultWorkerCount,
    resolveWorkerCount,
    startVanityWorkerPool
};
