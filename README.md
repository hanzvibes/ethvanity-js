![Logo](https://github.com/hanzvibes/ethvanity-js/raw/main/assets/vanity.png)
A Simple Script for Generate Vanity Address with CLI , I was recode This from [@ppabcd](https://github.com/ppabcd/vanity-cli)

![GitHub top language](https://img.shields.io/github/languages/top/hanzvibes/ethvanity-js?style=for-the-badge)

![GitHub last commit](https://img.shields.io/github/last-commit/hanzvibes/ethvanity-js?style=flat-square)

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/hanzvibes/ethvanity-js?style=flat-square)

![GitHub](https://img.shields.io/github/license/hanzvibes/ethvanity-js?style=flat-square)

## π Features

- Mnemonic Support
- More efficient usage of resources
- Mobile-friendly
- 100% Offline

## π Clone Repository & Install

```bash
git clone https://github.com/hanzvibes/ethvanity-js
cd ethvanity-js
npm i
```
    
## π¨βπ» Run the Script

Generate Vanity Address with Private-key Only ( Faster )

```bash
  node index.js
```

Generate Vanity Address with Mnemonic Support ( Longer )

```bash
  node mnemonic.js
```


## π Edit index.js

```javascript
getVanityWallet('yourinput', false, yourchecksum, yourlength, (message) => {
    console.log(message)
    })

- yourinput = A - F / 0 - 8 , for example 000 / deadd / b00b
- yourchecksum = 'true' is Case-sensitive , 'false' is Not Case-sensitive
- yourlength = 2 - 4 , 3 is Recommended
```

## π Edit mnemonic.js

```javascript
let input = 'yourinput';
let minLength = yourlength;

- yourinput = A - F / 0 - 8 , for example 000 / deadd / b00b
- yourlength = 2 - 5

* Recommended Length is 2 / 3
```


## π± CLI Output Example

![App Screenshot](https://github.com/hanzvibes/ethvanity-js/raw/main/assets/output.png)

## π±Output Files Example

![App Screenshot](https://github.com/hanzvibes/ethvanity-js/raw/main/assets/address_0x00000.png)

## π±Example of my Vanity Address

![App Screenshot](https://github.com/hanzvibes/ethvanity-js/raw/main/assets/example.png)



## π Source Code ( Original )
- [@ppabcd](https://github.com/ppabcd/vanity-cli)
## π Source Code vanity.js
- [@bokub](https://github.com/bokub/vanity-eth) ( vanity-eth.tk )

## π Join My Telegram

- https://t.me/whendistriser

## π₯ Contact Me

- [Facebook](https://fb.me/4RAEHAN)
- [Instagram](https://instagram.com/hanzvibes)

