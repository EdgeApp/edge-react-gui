# zcash-native

Native Zcash wallet library for React Native and Node.js, built on [zingolib](https://github.com/zingolabs/zingolib).

- GitHub: [EdgeApp/zcash-native](https://github.com/EdgeApp/zcash-native)
- npm: `zcash-native`

Zingolib is pulled as a git revision. Nym is off.

## React Native

```js
import { makeZcash } from 'zcash-native'
```

Mobile: `npm run build-native-ios` and `npm run build-native-android` (UniFFI). Not run on `npm install`.

## Node (CLI)

```js
import { makeNodeZcashModule } from 'zcash-native/node'
```

Host addon: `npm run build-native-host` (explicit; `prepare` / `prepack` compile JavaScript only).
