const {getVanityWallet} = require('./vanity.js');
/**
 * getVanityWallet(input, isChecksum, isSuffix, minLength, callback)
 */
getVanityWallet('00000000', false, false, 4, (message) => {
    console.log(message)
})
