const {getVanityWallet} = require('./vanity.js');

// Loading Screen
console.clear()
console.log("\nGenerating Vanity Address....\n")

/*
 - input = 'A-F' / '0-9' chosen by the user
 - isChecksum = 'true' Is a case-sensitive , 'false' is not a case-sensitive
 - isSuffix = 'true' Is a suffix , 'false' is a prefix
 - cb = Callback called after x attempts, or when an address if found
 */
getVanityWallet('00000000', false, false, 2, (message) => {
    console.log(message)
})
