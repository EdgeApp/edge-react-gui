# monero-native

Native Monero wallet library (LWSF) for React Native and Node.js.

The compiled C++ lives in this package. React Native and Node are hosts.

- GitHub: [EdgeApp/monero-native](https://github.com/EdgeApp/monero-native)
- npm: `monero-native`

## React Native

Add the package and run `pod install` as needed.

```js
import { makeMonero } from 'monero-native'
```

Mobile binaries: `npm run build-native` (Android + iOS). That script fetches third-party C++ and is not run on `npm install`.

## Node (CLI)

```js
import { makeNodeMoneroModule } from 'monero-native/node'
```

Host addon: `npm run build-native-host` (explicit; `prepare` / `prepack` compile JavaScript only).
