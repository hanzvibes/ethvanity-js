
![Logo](https://github.com/hanzvibes/ethvanity-js/raw/main/vanity.png)

A Simple Script for Generate Vanity Address with CLI , I was recode This from [@ppabcd](https://github.com/ppabcd/vanity-cli)


## 🌟 Features

- Mnemonic Support
- More efficient usage of resources
- Mobile-friendly
- 100% Offline
## 📂 Clone Repository & Install

```bash
git clone https://github.com/hanzvibes/ethvanity-js
cd ethvanity-js
npm i
```
    
## 👨‍💻 Run the Script

Generate Vanity Address with Private-key Only ( Faster )

```bash
  node index.js
```

Generate Vanity Address with Mnemonic Support ( Longer )

```bash
  node mnemonic.js
```


## 📑 Edit index.js

```javascript
getVanityWallet('yourinput', false, yourchecksum, yourlength, (message) => {
    console.log(message)
    })

- yourinput = A - F / 0 - 8 , for example 000 / deadd / b00b
- yourchecksum = 'true' is Case-sensitive , 'false' is Not Case-sensitive
- yourlength = 2 - 4 , 3 is Recommended
```

## 📑 Edit mnemonic.js

```javascript
let input = 'yourinput';
let minLength = yourlength;

* Maximum Input is 8 Characters
* Recommended Length is 2 - 4
```


## 📱 Output Example

![App Screenshot](https://github.com/hanzvibes/ethvanity-js/raw/main/output.png)

## 📱Output file Example

![App Screenshot](https://github.com/hanzvibes/ethvanity-js/raw/main/file_output.png)

## 📱Example of my Vanity Address

![App Screenshot](https://github.com/hanzvibes/ethvanity-js/raw/main/example.png)



## 🔗 Source Code ( Original )
- [@ppabcd](https://github.com/ppabcd/vanity-cli)
## 🔗 Source Code vanity.js
- [@bokub](https://github.com/bokub/vanity-eth) ( vanity-eth.tk )

## 🌐 Join My Telegram

- https://t.me/whendistriser

## 👥 Contact Me

- [Facebook](https://fb.me/4RAEHAN)
- [Instagram](https://instagram.com/hanzvibes)

