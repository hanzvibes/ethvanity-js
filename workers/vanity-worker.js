const { parentPort, workerData } = require('worker_threads');
const { getRandomWallet, isValidVanityAddress, toChecksumAddress } = require('../vanity.js');

const pattern = String(workerData.pattern).toLowerCase();
const isSuffix = Boolean(workerData.isSuffix);
const progressEvery = Math.max(1, Number(workerData.progressEvery) || 25000);
let attempts = 0;

for (;;) {
    const wallet = getRandomWallet();
    attempts++;

    if (isValidVanityAddress(wallet.address, pattern, false, isSuffix)) {
        parentPort.postMessage({
            type: 'found',
            attempts,
            address: `0x${toChecksumAddress(wallet.address)}`,
            privKey: wallet.privKey
        });
        parentPort.close();
        break;
    }

    if (attempts % progressEvery === 0) {
        parentPort.postMessage({ type: 'progress', attempts });
    }
}
