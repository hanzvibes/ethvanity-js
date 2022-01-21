# Foobar

Foobar is a Python library for dealing with word pluralization.

## Clone Repository & Install

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install foobar.

```bash
$ git clone https://github.com/hanzvibes/ethvanity-js
$ cd ethvanity-js
$ npm i
```

## Edit for Custom input / length

```bash
edit index.js < for address & priv-key generated only

getVanityWallet('your_input', false, false, yourlength, (message) => {
    console.log(message)
    })

edit mnemonic.js < for address + priv-key & mnemonic support

let input = 'yourinput'; < your custom input
let minLength = 3; < your custom length
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
