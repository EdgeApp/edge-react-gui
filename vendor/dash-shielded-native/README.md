# dash-shielded-native

Native Dash Platform shielded-pool wallet library for React Native and Node.js.

One package serves both hosts, matching `monero-native` / `zcash-native` / `zano-native`:

| Export | Backend |
|--------|---------|
| `dash-shielded-native` / `./rn` | UniFFI iOS + Android |
| `dash-shielded-native/node` | N-API (`makeNodeDashShieldedModule`) |

v1 covers keys, `dash1z` / `tdash1z` addresses, sync stubs, and `ShieldedTransfer` proposal/create. Create currently requires `rs-platform-wallet` DAPI bindings before a live testnet send.

```ts
import { makeNodeDashShieldedModule } from 'dash-shielded-native/node'

const io = makeNodeDashShieldedModule({ documentDirectory })
const keys = await io.Tools.deriveViewingKey(mnemonic, 'testnet')
const synchronizer = await io.makeSynchronizer({
  mnemonicSeed: mnemonic,
  account: 0,
  alias: 'wallet',
  network: 'testnet',
  dataDir: documentDirectory,
  defaultHost: 'seed-1.testnet.networks.dash.org',
  defaultPort: 1443
})
```

Host build:

```bash
socket npm install
socket npm run build-native-host
socket npm run smoke-node
```
