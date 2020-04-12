# Edge Bitcoin Currency Plugin
[![Build Status][travis-image]][travis-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Implements Bitcoin send/receive functionality per the spec for currency plugins for [edge-core-js](https://github.com/Airbitz/edge-core-js)

## Installing

    npm i edge-currency-bitcoin -s

```js
import { bitcoinCurrencyPluginFactory, bitcoincashCurrencyPluginFactory } from `edge-currency-bitcoin`
```

Now you can pass `bitcoinCurrencyPluginFactory` to `edge-core-js`.

```js
const context = makeEdgeContext({
  apiKey: YOUR_API_KEY,
  plugins: [ bitcoinCurrencyPluginFactory, bitcoincashCurrencyPluginFactory ]
})
```

This plugin exposes the following `otherSettings` which can be set using abcAccount.updateSettings()

```js
{
  enableOverrideServers: boolean,
  electrumServers: Array<Array[String, String]>,
  feeInfoServer: String
}
```

`enableOverrideServers` = `true` will force the plugin to ONLY use the electrum servers specified in `electrumServers`.
`electrumServers` should be in the format [`[DNS name]`, `[port]`]. ie [`h.1209k.com`, `50001`].
`feeInfoServer` should be the fee server, should have the same API as `https://bitcoinfees.21.co/api/v1/fees/list`.

[npm-image]: https://badge.fury.io/js/edge-currency-bitcoin.svg
[npm-url]: https://npmjs.org/package/edge-currency-bitcoin
[travis-image]: https://travis-ci.org/Airbitz/edge-currency-bitcoin.svg?branch=master
[travis-url]: https://travis-ci.org/Airbitz/edge-currency-bitcoin
[daviddm-image]: https://david-dm.org/Airbitz/edge-currency-bitcoin.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Airbitz/edge-currency-bitcoin

## Contributing

You'll need to install Yarn 1.3.2 globally on your machine

To run a local version of this repo inside the full Edge Wallet app, clone this repo at the same level as `edge-react-gui`

    git clone git@github.com:Airbitz/edge-currency-bitcoin.git`
    cd edge-currency-bitcoin
    yarn

Run `npm run test` to run the unit tests.

To use the local cloned version of this repo, `cd edge-react-gui` and run

    npm run updot edge-currency-bitcoin
    npm run postinstall

This will copy the necessary files from `edge-currency-bitcoin` into the `edge-react-gui/node_modules/edge-currency-bitcoin` replacing the npm installed version. This needs to be done after any modifications to `edge-currency-bitcoin`

All sources are in the [JavaScript Standard Style](http://standardjs.com/) + [Prettier](https://prettier.io/). We check files prior to each commit, so if you have formatting issues, you can run `npm run format` to fix them automatically.

If you use Visual Studio Code, consider installing the [prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension. You'll want to enable the `prettier.eslintIntegration` configuration option for this to work seamlessly with Standard.

If you use Atom, you can use [prettier-atom](https://atom.io/packages/prettier-atom). You'll want to check the "ESLint Integration" setting for this to work seamlessly with Standard.

## License
BSD 3
