# ETH VanityGen
Ethereum Vanity Address Generator CLI

# Usage

Clone Repository & Install :

git clone https://github.com/hanzvibes/ethvanity-js
cd ethvanity-js
npm i

Run

cd ethvanity-js
node index.js

Run with Mnemonic

node mnemonic.js

Custom Input & Minimum Length

edit index.js < for address & priv-key generated only

getVanityWallet('your_input', false, false, yourlength, (message) => {
    console.log(message)
    })

edit mnemonic.js < for address + priv-key & mnemonic support

let input = 'yourinput'; < your custom input
let minLength = 3; < your custom length
