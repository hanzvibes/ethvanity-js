const test = require('node:test');
const assert = require('node:assert/strict');
const {
    MAX_WORKERS,
    resolveWorkerCount,
    startVanityWorkerPool
} = require('../worker-pool.js');

test('resolveWorkerCount validates explicit worker counts', () => {
    assert.equal(resolveWorkerCount(1), 1);
    assert.equal(resolveWorkerCount('4'), 4);
    assert.throws(() => resolveWorkerCount(0), /between 1/);
    assert.throws(() => resolveWorkerCount(MAX_WORKERS + 1), /between 1/);
});

test('worker pool finds a simple one-nibble prefix', { timeout: 10000 }, async () => {
    const job = startVanityWorkerPool({ pattern: '0', workers: 2, progressEvery: 16 });
    const result = await job.result;

    assert.match(result.address.toLowerCase(), /^0x0/);
    assert.equal(result.workers, 2);
    assert.ok(result.attempts >= 1);
    assert.ok(result.rate >= 0);
});
