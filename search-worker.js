const { parentPort, workerData } = require('worker_threads');
const { findVanityWallet } = require('./vanity.js');

const { pattern, isSuffix = false, progressEvery = 50000, id } = workerData;

try {
    const result = findVanityWallet(pattern, {
        isSuffix,
        progressEvery,
        onProgress: ({ attempts, elapsedMs, rate }) => {
            parentPort.postMessage({
                type: 'progress',
                id,
                attempts,
                elapsedMs,
                rate,
                at: Date.now()
            });
        }
    });

    parentPort.postMessage({
        type: 'found',
        id,
        result,
        at: Date.now()
    });
} catch (error) {
    parentPort.postMessage({
        type: 'error',
        id,
        message: error && error.message ? error.message : String(error),
        at: Date.now()
    });
}
