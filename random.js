const fs = require('fs');
const EthWallet = Wallet.default.generate();
var Wallet = require('ethereumjs-wallet');

console.log("Address : " + EthWallet.getAddressString());
console.log("Private Key : " + EthWallet.getPrivateKeyString());

fs.appendFileSync('address_random.txt', "Address : 0x"+ EthWallet.getAddressString(this.getAddress) + '\n' + "Private Key : "+ EthWallet.getPrivateKeyString(this.privKey) + '\n\n');
