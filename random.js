const fs = require('fs');
const path = require('path');
const { generateMnemonic, EthHdWallet } = require('eth-hd-wallet');

const mnemonic = generateMnemonic();
const wallet = EthHdWallet.fromMnemonic(mnemonic);
const [address] = wallet.generateAddresses(1);
const privateKey = wallet.getPrivateKey(address).toString('hex');

const outputDir = path.resolve(process.cwd(), 'wallets');
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `random-${stamp}-${address.slice(-8).toLowerCase()}.txt`;
const filepath = path.join(outputDir, filename);
const body = [
    `Address : ${address}`,
    `Private Key : ${privateKey}`,
    `Mnemonic : ${mnemonic}`,
    ''
].join('\n');

fs.writeFileSync(filepath, body, { mode: 0o600, flag: 'wx' });

console.log('Random Ethereum wallet generated locally.');
console.log(`Address : ${address}`);
console.log(`Saved secret material to ${path.relative(process.cwd(), filepath)}`);
console.log('Keep that file private and never commit it to Git.');
