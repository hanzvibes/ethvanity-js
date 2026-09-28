const test = require('node:test');
const assert = require('node:assert/strict');
const {
    privateToAddress,
    isValidVanityAddress,
    toChecksumAddress
} = require('../vanity.js');

test('private key 1 derives the canonical Ethereum address', () => {
    const privateKey = Buffer.alloc(32);
    privateKey[31] = 1;
    const address = privateToAddress(privateKey);
    assert.equal(address, '7e5f4552091a69125d5dfcb7b8c2659029395bdf');
});

test('toChecksumAddress matches a known EIP-55 vector', () => {
    const input = '52908400098527886e0f7030069857d2e4169ee7';
    assert.equal(toChecksumAddress(input), '52908400098527886E0F7030069857D2E4169EE7');
});

test('prefix matching is case-insensitive when checksum mode is off', () => {
    const address = 'cafe00000000000000000000000000000000beef';
    assert.equal(isValidVanityAddress(address, 'cafe', false, false), true);
    assert.equal(isValidVanityAddress(address, 'beef', false, false), false);
});

test('suffix matching works', () => {
    const address = 'cafe00000000000000000000000000000000beef';
    assert.equal(isValidVanityAddress(address, 'beef', false, true), true);
    assert.equal(isValidVanityAddress(address, 'cafe', false, true), false);
});

test('toChecksumAddress rejects malformed addresses', () => {
    assert.throws(() => toChecksumAddress('abc'), /40 hexadecimal/);
});
