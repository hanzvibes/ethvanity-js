// Loading Screen
console.clear()
const loading = require('loading-cli');
const load = loading("Generating Random Wallet").start();
console.log("\n");
console.log("- Generating Random Address...");
console.log("\n");

// Generate Random ETH Address
const { generateMnemonic, EthHdWallet } = require('eth-hd-wallet')
const wallet = EthHdWallet.fromMnemonic(generateMnemonic());
const [ address ] = wallet.generateAddresses(1);
const privateKey = wallet.getPrivateKey(address);
const data = '...'
const signature = wallet.sign({ address, data });
const publicKey = wallet.recoverSignerPublicKey({ signature, data });
const fs = require('fs');
const BIP44_PATH = `m/44'/60'/0'/0`

// Color Variable
var color = require('colors-cli');
var xaddress = color.blue_bt;
var xprivatekey = color.yellow_bt;
var xmnemonic = color.green_bt;
var xsignature = color.red_bt;
var xpath = color.magenta;

// Generate Mnemonic
let mnemonic = generateMnemonic();

// Address Output
console.log("\n");
console.log(xaddress('- Address : ')+address);
console.log(xprivatekey('- Private Key : ')+privateKey.toString('hex') );
console.log(xmnemonic('- Mnemonic : ')+mnemonic);
console.log(xsignature('- Signature : ')+signature);
console.log(xpath('- Path : ')+BIP44_PATH);

// Saving files...
fs.appendFileSync('address_random.txt', "- Address : "+wallet.getAddresses() + '\n' + "- Private Key : "+privateKey.toString('hex') + '\n' + "- Mnemonic : "+mnemonic + '\n' + "- Signature : "+signature + '\n\n');

// Reminder
console.log("\n");
load.succeed("File saved as address_random.txt");
load.warn("Please don't share this data to Anyone !!");
console.log("\n");
