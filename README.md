
![Logo](https://github.com/hanzvibes/ethvanity-js/raw/main/vanity.png)


## Features

- Mnemonic Support
- More efficient usage of resources
- Mobile-friendly
## Clone Repository & Install

```bash
git clone https://github.com/hanzvibes/ethvanity-js
cd ethvanity-js
npm i
```
    
## Run the Script

Generate Vanity Address with Private-key ( Faster )

```bash
  node index.js
```

Generate Vanity Address with Private-key & Mnemonic Support ( Longer )

```bash
  node mnemonic.js
```


## Edit index.js

```javascript
getVanityWallet('yourinput', false, false, yourlength, (message) => {
    console.log(message)
    })

* Maximum Input is 8 Characters
* Recommended Length is 2 - 4
```

## Edit mnemonic.js

```javascript
let input = 'yourinput';
let minLength = yourlength;

* Maximum Input is 8 Characters
* Recommended Length is 2 - 4
```

## Source Code ( Original )
- [@ppabcd](https://github.com/ppabcd/vanity-cli)
## Source Code vanity.js
- [@bokub](https://github.com/bokub/vanity-eth) ( vanity-eth.tk )
