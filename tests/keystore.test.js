const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizePrivateKey,
    encryptPrivateKeyToKeystore,
    decryptKeystore
} = require('../keystore.js');

test('normalizePrivateKey accepts exactly 32 bytes', () => {
    const raw = '11'.repeat(32);
    assert.equal(normalizePrivateKey(raw), `0x${raw}`);
    assert.throws(() => normalizePrivateKey('1234'), /32 bytes/);
});

test('encrypted keystore round-trips without exposing the raw private key', async () => {
    const privateKey = '11'.repeat(32);
    const password = 'correct horse battery staple';
    const json = await encryptPrivateKeyToKeystore(
        privateKey,
        password,
        null,
        { scrypt: { N: 1024, r: 8, p: 1 } }
    );

    assert.equal(json.includes(privateKey), false);

    const wallet = await decryptKeystore(json, password);
    assert.equal(wallet.privateKey.toLowerCase(), `0x${privateKey}`);
});
