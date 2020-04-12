// @flow

import { assert } from 'chai'
import {
  type EdgeCorePlugin,
  type EdgeCorePluginOptions,
  type EdgeCurrencyPlugin,
  type EdgeCurrencyTools,
  makeFakeIo
} from 'edge-core-js'
import { before, describe, it } from 'mocha'

import edgeCorePlugins from '../../../src/index.js'
import fixtures from './fixtures.json'

const fakeLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
}

for (const fixture of fixtures) {
  const WALLET_TYPE = fixture['WALLET_TYPE']
  const WALLET_FORMAT = fixture['WALLET_FORMAT']
  const keyName = WALLET_TYPE.split('wallet:')[1].split('-')[0] + 'Key'
  const xpubName = WALLET_TYPE.split('wallet:')[1].split('-')[0] + 'Xpub'

  let keys
  let tools: EdgeCurrencyTools

  const fakeIo = makeFakeIo()
  const pluginOpts: EdgeCorePluginOptions = {
    io: {
      ...fakeIo,
      console: fakeLogger,
      random: size => fixture['key']
    },
    initOptions: {},
    nativeIo: {},
    pluginDisklet: fakeIo.disklet
  }
  const factory = edgeCorePlugins[fixture['pluginName']]
  if (typeof factory !== 'function') throw new TypeError('Bad plugin')
  const corePlugin: EdgeCorePlugin = factory(pluginOpts)
  const plugin: EdgeCurrencyPlugin = (corePlugin: any)

  describe(`Info for Wallet type ${WALLET_TYPE}`, function () {
    before('Plugin', async function () {
      assert.equal(
        plugin.currencyInfo.currencyCode,
        fixture['Test Currency code']
      )
      tools = await plugin.makeCurrencyTools()
    })

    it('Test Currency code', function () {
      assert.equal(
        plugin.currencyInfo.currencyCode,
        fixture['Test Currency code']
      )
    })
  })

  describe(`createPrivateKey for Wallet type ${WALLET_TYPE}`, function () {
    it('Test Currency code', function () {
      assert.equal(
        plugin.currencyInfo.currencyCode,
        fixture['Test Currency code']
      )
    })

    it('Create valid key', async function () {
      keys = await tools.createPrivateKey(WALLET_TYPE)
      assert.equal(!keys, false)
      assert.equal(typeof keys[keyName], 'string')
      const length = keys[keyName].split(' ').length
      assert.equal(length, 24)
    })
  })

  describe.skip(`derivePublicKey for Wallet type ${WALLET_TYPE}`, function () {
    it('Valid private key', function (done) {
      tools
        .derivePublicKey({
          type: WALLET_TYPE,
          keys: {
            [keyName]: keys[keyName],
            format: WALLET_FORMAT
          },
          id: '!'
        })
        .then(keys => {
          assert.equal(keys[xpubName], fixture['xpub'])
          done()
        })
    })

    it('Invalid key name', function (done) {
      tools.derivePublicKey(fixture['Invalid key name']).catch(e => {
        done()
      })
    })

    it('Invalid wallet type', function (done) {
      tools.derivePublicKey(fixture['Invalid wallet type']).catch(e => {
        done()
      })
    })
  })

  describe(`parseUri for Wallet type ${WALLET_TYPE}`, function () {
    Object.keys(fixture['parseUri']).forEach(test => {
      if (fixture['parseUri'][test].length === 2) {
        it(test, async function () {
          const parsedUri = await tools.parseUri(fixture['parseUri'][test][0])
          const expectedParsedUri = fixture['parseUri'][test][1]
          assert.deepEqual(parsedUri, expectedParsedUri)
        })
      } else {
        it(test, function () {
          assert.throws(() => tools.parseUri(fixture['parseUri'][test][0]))
        })
      }
    })
  })

  describe(`encodeUri for Wallet type ${WALLET_TYPE}`, function () {
    Object.keys(fixture['encodeUri']).forEach(test => {
      if (fixture['encodeUri'][test].length === 2) {
        it(test, async function () {
          const encodedUri = await tools.encodeUri(
            fixture['encodeUri'][test][0]
          )
          const expectedEncodeUri = fixture['encodeUri'][test][1]
          assert.equal(encodedUri, expectedEncodeUri)
        })
      } else {
        it(test, function () {
          assert.throws(() => tools.encodeUri(fixture['encodeUri'][test][0]))
        })
      }
    })
  })

  describe(`getSplittableTypes for Wallet type ${WALLET_TYPE}`, function () {
    const getSplittableTypes = fixture['getSplittableTypes'] || []
    Object.keys(getSplittableTypes).forEach(format => {
      it(`Test for the wallet type ${format}`, function () {
        if (tools.getSplittableTypes == null) {
          throw new Error('No getSplittableTypes')
        }
        const walletTypes = tools.getSplittableTypes({
          type: WALLET_TYPE,
          keys: { format },
          id: '!'
        })
        assert.deepEqual(walletTypes, getSplittableTypes[format])
      })
    })
  })
}
