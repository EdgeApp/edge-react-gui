// @flow

import { assert } from 'chai'
import { describe, it } from 'mocha'

import { KeyManager } from '../../../src/engine/keyManager.js'
import type { KeyManagerCallbacks } from '../../../src/engine/keyManager.js'
// InfoFiles for networks
import { bitcoin } from '../../../src/info/bitcoin.js'
import { bitcoincash } from '../../../src/info/bitcoincash.js'
import { dogecoin } from '../../../src/info/dogecoin.js'
// Bcoin extender function
import { addNetwork } from '../../../src/utils/bcoinExtender/bcoinExtender.js'
import { logger, setLogger } from '../../../src/utils/logger.js'
import fixtures from './fixtures.json'

// Add network to bcoin
addNetwork(bitcoin.bcoinInfo)
addNetwork(bitcoincash.bcoinInfo)
addNetwork(dogecoin.bcoinInfo)

const fakeLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
}

setLogger(fakeLogger)

for (const fixture of fixtures) {
  const keyManagerCallbacks: KeyManagerCallbacks = {
    onNewAddress: (scriptHash: string, address: string, path: string) => {
      logger.info(scriptHash, address, path)
    },
    onNewKey: (keys: any) => {
      logger.info(keys)
    }
  }
  describe(`Key Manager for ${fixture.network}`, function () {
    let keyManager
    it('creates new key manager', function () {
      const options = { ...fixture, callbacks: keyManagerCallbacks }
      keyManager = new KeyManager(options)
      return keyManager.load().then(() => {
        const pubSeed = keyManager.getPublicSeed()
        const seed = keyManager.getSeed()
        assert.equal(seed, options.seed)
        assert.equal(pubSeed, options.rawKeys.master.xpub)
        assert.equal(keyManager.keys.receive.children.length, 10)
        assert(keyManager.keys.receive.pubKey)
        assert.equal(keyManager.keys.change.children.length, 10)
        assert(keyManager.keys.change.pubKey)
      })
    })
  })
}
