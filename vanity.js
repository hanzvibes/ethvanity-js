/* eslint-env worker */
const secp256k1 = require('secp256k1');
const keccak = require('keccak');
const randomBytes = require('randombytes');
const fs = require('fs');

/**
 * Transform a private key into an address.
 */
const privateToAddress = (privateKey) => {
    const pub = secp256k1.publicKeyCreate(privateKey, false).slice(1);
    return keccak('keccak256').update(pub).digest().slice(-20).toString('hex');
};

/**
 * Create a wallet from a random private key.
 * @returns {{address: string, privKey: string}}
 */
const getRandomWallet = () => {
    const randbytes = randomBytes(32);
    return {
        address: privateToAddress(randbytes),
        privKey: randbytes.toString('hex')
    };
};

/**
 * Check if a wallet respects the input constraints.
 */
const isValidVanityAddress = (address, input, isChecksum, isSuffix) => {
    const subStr = isSuffix ? address.substr(40 - input.length) : address.substr(0, input.length);

    if (!isChecksum) {
        return input === subStr;
    }
    if (input.toLowerCase() !== subStr) {
        return false;
    }

    return isValidChecksum(address, input, isSuffix);
};

const isValidChecksum = (address, input, isSuffix) => {
    const hash = keccak('keccak256').update(address).digest().toString('hex');
    const shift = isSuffix ? 40 - input.length : 0;

    for (let i = 0; i < input.length; i++) {
        const j = i + shift;
        if (input[i] !== (parseInt(hash[j], 16) >= 8 ? address[j].toUpperCase() : address[j])) {
            return false;
        }
    }
    return true;
};

const toChecksumAddress = (address) => {
    const hash = keccak('keccak256').update(address).digest().toString('hex');
    let ret = '';
    for (let i = 0; i < address.length; i++) {
        ret += parseInt(hash[i], 16) >= 8 ? address[i].toUpperCase() : address[i];
    }
    return ret;
};

const getStats = (startedAt, attempts) => {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const elapsedMs = Number(elapsedNs) / 1e6;
    const rate = elapsedMs > 0 ? Math.round(attempts / (elapsedMs / 1000)) : 0;
    return { elapsedMs, rate };
};

/**
 * Find exactly one vanity wallet and stop.
 * This is used by the interactive terminal UI.
 */
const findVanityWallet = (input, options = {}) => {
    const {
        isChecksum = false,
        isSuffix = false,
        progressEvery = 25000,
        onProgress = null
    } = options;

    if (typeof input !== 'string' || !/^[0-9a-fA-F]+$/.test(input)) {
        throw new Error('Pattern must contain hexadecimal characters only (0-9, A-F).');
    }

    if (input.length > 40) {
        throw new Error('Pattern cannot be longer than an Ethereum address.');
    }

    const pattern = isChecksum ? input : input.toLowerCase();
    const startedAt = process.hrtime.bigint();
    let attempts = 0;

    for (;;) {
        const wallet = getRandomWallet();
        attempts++;

        if (isValidVanityAddress(wallet.address, pattern, isChecksum, isSuffix)) {
            const stats = getStats(startedAt, attempts);
            return {
                address: `0x${toChecksumAddress(wallet.address)}`,
                privKey: wallet.privKey,
                attempts,
                elapsedMs: stats.elapsedMs,
                rate: stats.rate
            };
        }

        if (onProgress && attempts % Math.max(1, progressEvery) === 0) {
            const stats = getStats(startedAt, attempts);
            onProgress({ attempts, elapsedMs: stats.elapsedMs, rate: stats.rate });
        }
    }
};

/**
 * Legacy continuous generator. It keeps searching and saves progressively
 * shorter matches down to minLength.
 */
const getVanityWallet = async (input, isChecksum, isSuffix, minLength, cb) => {
    input = isChecksum ? input : input.toLowerCase();
    let wallet = getRandomWallet();
    let attempts = 1;

    for (;;) {
        for (let j = 0; j <= input.length - minLength; j++) {
            const candidate = input.substr(0, input.length - j);
            if (isValidVanityAddress(wallet.address, candidate, isChecksum, isSuffix)) {
                fs.appendFileSync(
                    `address_0x${candidate}.txt`,
                    `Address : 0x${toChecksumAddress(wallet.address)}\nPrivate Key : ${wallet.privKey}\n\n`,
                    { mode: 0o600 }
                );
                cb(`- 0x${toChecksumAddress(wallet.address)} | ${attempts} attempts`);
                attempts = 0;
                break;
            }
        }
        wallet = getRandomWallet();
        attempts++;
    }
};

module.exports = {
    findVanityWallet,
    getVanityWallet,
    isValidVanityAddress,
    toChecksumAddress
};
