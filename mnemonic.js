const fs = require('fs');
const path = require('path');
const { generateMnemonic, EthHdWallet } = require('eth-hd-wallet');
const { isValidVanityAddress, toChecksumAddress } = require('./vanity.js');

const input = '00000000';
const minLength = 3;

if (!/^[0-9a-fA-F]+$/.test(input)) {
    throw new Error('input must contain hexadecimal characters only (0-9, A-F).');
}
if (!Number.isInteger(minLength) || minLength < 1 || minLength > input.length) {
    throw new Error('minLength must be an integer between 1 and input.length.');
}

const outputDir = path.resolve(process.cwd(), 'wallets');
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

let attempts = 0;

for (;;) {
    const mnemonic = generateMnemonic();
    const wallet = EthHdWallet.fromMnemonic(mnemonic);
    const [walletAddress] = wallet.generateAddresses(1);
    const addr = walletAddress.replace(/^0x/, '').toLowerCase();
    attempts++;

    for (let j = 0; j <= input.length - minLength; j++) {
        const candidate = input.slice(0, input.length - j).toLowerCase();
        if (isValidVanityAddress(addr, candidate, false, false)) {
            const checksumAddress = `0x${toChecksumAddress(addr)}`;
            const privateKey = wallet.getPrivateKey(walletAddress).toString('hex');
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `mnemonic-${candidate}-${stamp}-${addr.slice(-8)}.txt`;
            const filepath = path.join(outputDir, filename);
            const body = [
                `Address : ${checksumAddress}`,
                `Private Key : ${privateKey}`,
                `Mnemonic : ${mnemonic}`,
                ''
            ].join('\n');

            fs.writeFileSync(filepath, body, { mode: 0o600, flag: 'wx' });
            console.log(`- ${checksumAddress} | ${attempts} attempts | ${path.relative(process.cwd(), filepath)}`);
            attempts = 0;
            break;
        }
    }
}
