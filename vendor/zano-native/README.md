# zano-native

Native Zano wallet library for React Native and Node.js.

The compiled SDK lives in this package. React Native and Node are hosts.

- GitHub: [EdgeApp/zano-native](https://github.com/EdgeApp/zano-native)
- npm: `zano-native`

## React Native

```js
import { makeZano } from 'zano-native'
```

Mobile binaries: `npm run update-sources`. Not run on `npm install`.

## Node (CLI)

```js
import { makeNodeZanoModule } from 'zano-native/node'
```

Host addon: `npm run build-native-host` (explicit; `prepare` / `prepack` compile JavaScript only).
