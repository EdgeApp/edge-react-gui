# Edge Currency Plugin for Account-Based currencies

[![Build Status](https://app.travis-ci.com/EdgeApp/edge-currency-accountbased.svg?branch=master)](https://app.travis-ci.com/EdgeApp/edge-currency-accountbased)

Plugins for [edge-core-js](https://github.com/EdgeApp/edge-core-js), handling many networks not derived from Bitcoin.

These are compatible with edge-core-js v0.21.2 or later.

## Installing

First, add this library to your project:

```sh
npm i -s edge-currency-accountbased
```

### Node.js

For Node.js, you should call `addEdgeCorePlugins` to register these plugins with edge-core-js:

```js
const { addEdgeCorePlugins, lockEdgeCorePlugins } = require('edge-core-js')
const plugins = require('edge-currency-accountbased')

addEdgeCorePlugins(plugins)

// Once you are done adding plugins, call this:
lockEdgeCorePlugins()
```

You can also add plugins individually if you want to be more picky:

```js
addEdgeCorePlugins({
  ethereum: plugins.ethereum
})
```

### Browser

The bundle located in `dist/edge-currency-accountbased.js` will automatically register itself with edge-core-js. Just serve the entire `dist` directory along with your app, and then load the script:

```html
<script src='https://example.com/app/dist/edge-currency-accountbased.js'>
```

If you want to debug this project, run `npm run start` to start a Webpack server,
and then adjust your script URL to http://localhost:8082/edge-currency-accountbased.js.

### React Native

The `edge-currency-accountbased` package will automatically install itself using React Native autolinking. To integrate the plugins with edge-core-js, add its URI to the context component:

```jsx
import { pluginUri, makePluginIo } from 'edge-currency-accountbased/rn'

<MakeEdgeContext
  nativeIo={{
    'edge-currency-accountbased': makePluginIo()
  }}
  pluginUris={[pluginUri]}
  // Plus other props as required...
/>
```

To debug this project, run `npm run start` to start a Webpack server, and then use `debugUri` instead of `pluginUri`.

Notice the `/rn` suffix on the `import` statement. If you leave this off (which is deprecated), react-native-piratechain and react-native-zcash will both be mandatory, and the instructions below won't apply.

#### Zcash / Piratechain / Zano

These chains only work on React Native. To use them, first install the following packages using the instructions in their repos:

- [react-native-piratechain](https://www.npmjs.com/package/react-native-piratechain)
- [react-native-zano](https://www.npmjs.com/package/react-native-zano)
- [react-native-zcash](https://www.npmjs.com/package/react-native-zcash)

Then, add the correct IO objects to the core:

```jsx
import { pluginUri, makePluginIo } from 'edge-currency-accountbased/rn'
import { makePiratechainIo } from 'edge-currency-accountbased/rn-piratechain'
import { makeZanoIo } from 'edge-currency-accountbased/rn-zano'
import { makeZcashIo } from 'edge-currency-accountbased/rn-zcash'

<MakeEdgeContext
  nativeIo={{
    'edge-currency-accountbased': makePluginIo()
    piratechain: makePiratechainIo(),
    zano: makeZanoIo(),
    zcash: makeZcashIo(),
  }}
  pluginUris={[pluginUri]}
  // Plus other props as required...
/>
```

## Contributing

You'll need to install Yarn 1.3.2 globally on your machine

To set up this project, just do:

```sh
git clone git@github.com:EdgeApp/edge-currency-accountbased.git`
cd edge-currency-accountbased
npm run npm install prepare
```

Run `npm run test` to run the unit tests.

To test your changes in the full Edge wallet app, run `npm run start` to start a web server, and then set `DEBUG_ACCOUNTBASED` in your env.json to use the web server instead of the bundled library.

You can also do `updot edge-currency-accountbased` from within `edge-react-gui` to copy your edits in to `node_modules`. Re-build and re-launch the app to use the updated plugins.

## Adding a New Blockchain / Currency

Please note that our team considers (but does not guarantee) PR's to add new currencies / blockchains to this repo's master branch (included into production version of Edge Wallet). Among other requirements the code must satisfy the following guidelines:

- Rebase of your branch upon this repo's `master` branch. For more info:
  https://github.com/edx/edx-platform/wiki/How-to-Rebase-a-Pull-Request

### Naming Convention

Plugins take their names from the network, not the currency. For instance, the "ripple" plugin supports the Ripple network. There are many currencies on the Ripple network, including XRP, tokens, and bank-backed currencies, so naming the Ripple plugin "xrp" would be too narrow.

The same principle applies to all the plugins in this repository, with a few unfortunate exceptions.

## License

BSD 3
