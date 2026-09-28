const { ethers } = require('ethers');

const normalizePrivateKey = (privateKey) => {
    const value = String(privateKey || '').replace(/^0x/, '');
    if (!/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error('Private key must be exactly 32 bytes.');
    }
    return `0x${value}`;
};

const encryptPrivateKeyToKeystore = async (privateKey, password, progressCallback = null, options = undefined) => {
    if (typeof password !== 'string' || password.length < 12) {
        throw new Error('Keystore password must be at least 12 characters.');
    }

    const wallet = new ethers.Wallet(normalizePrivateKey(privateKey));
    const onProgress = typeof progressCallback === 'function' ? progressCallback : undefined;

    if (options === undefined) {
        return onProgress ? wallet.encrypt(password, onProgress) : wallet.encrypt(password);
    }

    return wallet.encrypt(password, options, onProgress);
};

const decryptKeystore = async (json, password) => {
    return ethers.Wallet.fromEncryptedJson(json, password);
};

module.exports = {
    normalizePrivateKey,
    encryptPrivateKeyToKeystore,
    decryptKeystore
};
