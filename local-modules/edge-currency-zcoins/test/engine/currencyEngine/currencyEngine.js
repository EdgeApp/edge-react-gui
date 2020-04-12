// @flow

import EventEmitter from 'events'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

import { assert } from 'chai'
import { downgradeDisklet, navigateDisklet } from 'disklet'
import {
  type EdgeCorePlugin,
  type EdgeCorePluginOptions,
  type EdgeCurrencyEngine,
  type EdgeCurrencyEngineOptions,
  type EdgeCurrencyPlugin,
  type EdgeCurrencyTools,
  errorNames,
  makeFakeIo
} from 'edge-core-js'
import { readFileSync } from 'jsonfile'
import { before, describe, it } from 'mocha'
import fetch from 'node-fetch'
import request from 'request'

import edgeCorePlugins from '../../../src/index.js'
import { logger } from '../../../src/utils/logger.js'

const fakeLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
}

const DATA_STORE_FOLDER = 'txEngineFolderBTC'
const FIXTURES_FOLDER = join(__dirname, 'fixtures')

const fixtureFile = 'tests.json'
const dummyAddressDataFile = 'dummyAddressData.json'
const dummyHeadersDataFile = 'dummyHeadersData.json'
const dummyTransactionsDataFile = 'dummyTransactionsData.json'

// return only the directories inside fixtures dir
const dirs = dir =>
  readdirSync(dir).filter(file => statSync(join(dir, file)).isDirectory())

for (const dir of dirs(FIXTURES_FOLDER)) {
  const fixtureDataPath = join(FIXTURES_FOLDER, dir)

  const fixture = readFileSync(join(fixtureDataPath, fixtureFile))
  const dummyAddressData = readFileSync(
    join(fixtureDataPath, dummyAddressDataFile)
  )
  const dummyHeadersData = readFileSync(
    join(fixtureDataPath, dummyHeadersDataFile)
  )
  const dummyTransactionsData = readFileSync(
    join(fixtureDataPath, dummyTransactionsDataFile)
  )

  const WALLET_FORMAT = fixture['WALLET_FORMAT']
  const WALLET_TYPE = fixture['WALLET_TYPE']
  const TX_AMOUNT = fixture['TX_AMOUNT']

  let engine: EdgeCurrencyEngine
  let keys

  const fakeIo = makeFakeIo()
  const pluginOpts: EdgeCorePluginOptions = {
    io: {
      ...fakeIo,
      console: fakeLogger,
      random: size => fixture['key'],
      fetch: fetch
    },
    initOptions: {},
    nativeIo: {},
    pluginDisklet: fakeIo.disklet
  }
  const factory = edgeCorePlugins[fixture['pluginName']]
  if (typeof factory !== 'function') throw new TypeError('Bad plugin')
  const corePlugin: EdgeCorePlugin = factory(pluginOpts)
  const plugin: EdgeCurrencyPlugin = (corePlugin: any)

  const emitter = new EventEmitter()
  const callbacks = {
    onAddressesChecked (progressRatio) {
      logger.info('onAddressesCheck', progressRatio)
      emitter.emit('onAddressesCheck', progressRatio)
    },
    onBalanceChanged (currencyCode, balance) {
      logger.info('onBalanceChange:', currencyCode, balance)
      emitter.emit('onBalanceChange', currencyCode, balance)
    },
    onBlockHeightChanged (height) {
      logger.info('onBlockHeightChange:', height)
      emitter.emit('onBlockHeightChange', height)
    },
    onTransactionsChanged (transactionList) {
      logger.info('onTransactionsChanged:', transactionList)
      emitter.emit('onTransactionsChanged', transactionList)
    },
    onTxidsChanged () {}
  }

  const walletLocalDisklet = navigateDisklet(fakeIo.disklet, DATA_STORE_FOLDER)
  const walletLocalFolder = downgradeDisklet(walletLocalDisklet)
  const engineOpts: EdgeCurrencyEngineOptions = {
    callbacks,
    walletLocalDisklet,
    walletLocalEncryptedDisklet: walletLocalDisklet,
    userSettings: fixture.ChangeSettings
  }

  describe(`Engine Creation Errors for Wallet type ${WALLET_TYPE}`, function () {
    before('Plugin', async function () {
      assert.equal(
        plugin.currencyInfo.currencyCode,
        fixture['Test Currency code']
      )
      const tools: EdgeCurrencyTools = await plugin.makeCurrencyTools()
      // Hack for now until we change all the dummy data to represent the new derivation path
      keys = await tools.createPrivateKey(WALLET_TYPE)
      Object.assign(keys, {
        coinType: 0,
        format: WALLET_FORMAT
      })
      // $FlowFixMe
      keys = await tools.internalDerivePublicKey({
        type: WALLET_TYPE,
        keys,
        id: '!'
      })
    })

    it('Error when Making Engine without local folder', function () {
      return plugin
        .makeCurrencyEngine({ type: WALLET_TYPE, keys, id: '!' }, engineOpts)
        .catch(e => {
          assert.equal(
            e.message,
            'Cannot create an engine without a local folder'
          )
        })
    })

    it('Error when Making Engine without keys', function () {
      return (
        plugin
          // $FlowFixMe
          .makeCurrencyEngine({ type: WALLET_TYPE, id: '!' }, engineOpts)
          .catch(e => {
            assert.equal(e.message, 'Missing Master Key')
          })
      )
    })

    it('Error when Making Engine without key', function () {
      return plugin
        .makeCurrencyEngine(
          { type: WALLET_TYPE, keys: { ninjaXpub: keys.pub }, id: '!' },
          engineOpts
        )
        .catch(e => {
          assert.equal(e.message, 'Missing Master Key')
        })
    })
  })
  describe(`Start Engine for Wallet type ${WALLET_TYPE}`, function () {
    before('Create local cache file', function (done) {
      walletLocalFolder
        .file('addresses.json')
        .setText(JSON.stringify(dummyAddressData))
        .then(() =>
          walletLocalFolder
            .file('txs.json')
            .setText(JSON.stringify(dummyTransactionsData))
        )
        .then(() =>
          walletLocalFolder
            .file('headers.json')
            .setText(JSON.stringify(dummyHeadersData))
        )
        .then(done)
    })

    it('Make Engine', function () {
      const { id, userSettings } = fixture['Make Engine']
      return plugin
        .makeCurrencyEngine(
          { type: WALLET_TYPE, keys, id },
          { ...engineOpts, userSettings }
        )
        .then(e => {
          engine = e
          assert.equal(typeof engine.startEngine, 'function', 'startEngine')
          assert.equal(typeof engine.killEngine, 'function', 'killEngine')
          // assert.equal(typeof engine.enableTokens, 'function', 'enableTokens')
          assert.equal(
            typeof engine.getBlockHeight,
            'function',
            'getBlockHeight'
          )
          assert.equal(typeof engine.getBalance, 'function', 'getBalance')
          assert.equal(
            typeof engine.getNumTransactions,
            'function',
            'getNumTransactions'
          )
          assert.equal(
            typeof engine.getTransactions,
            'function',
            'getTransactions'
          )
          assert.equal(
            typeof engine.getFreshAddress,
            'function',
            'getFreshAddress'
          )
          assert.equal(
            typeof engine.addGapLimitAddresses,
            'function',
            'addGapLimitAddresses'
          )
          assert.equal(typeof engine.isAddressUsed, 'function', 'isAddressUsed')
          assert.equal(typeof engine.makeSpend, 'function', 'makeSpend')
          assert.equal(typeof engine.signTx, 'function', 'signTx')
          assert.equal(typeof engine.broadcastTx, 'function', 'broadcastTx')
          assert.equal(typeof engine.saveTx, 'function', 'saveTx')
          return true
        })
    })
  })

  describe(`Is Address Used for Wallet type ${WALLET_TYPE} from cache`, function () {
    const testCases = fixture['Address used from cache']
    const wrongFormat = testCases.wrongFormat || []
    const notInWallet = testCases.notInWallet || []
    const empty = testCases.empty || {}
    const nonEmpty = testCases.nonEmpty || {}

    wrongFormat.forEach(address => {
      it('Checking a wrong formated address', function (done) {
        try {
          engine.isAddressUsed(address)
        } catch (e) {
          assert(e, 'Should throw')
          assert.equal(e.message, 'Wrong formatted address')
          done()
        }
      })
    })

    notInWallet.forEach(address => {
      it("Checking an address we don't own", function () {
        try {
          assert.equal(engine.isAddressUsed(address), false)
        } catch (e) {
          assert(e, 'Should throw')
          assert.equal(e.message, 'Address not found in wallet')
        }
      })
    })

    Object.keys(empty).forEach(test => {
      it(`Checking an empty ${test}`, function (done) {
        assert.equal(engine.isAddressUsed(empty[test]), false)
        done()
      })
    })

    Object.keys(nonEmpty).forEach(test => {
      it(`Checking a non empty ${test}`, function (done) {
        assert.equal(engine.isAddressUsed(nonEmpty[test]), true)
        done()
      })
    })
  })

  describe(`Get Transactions from Wallet type ${WALLET_TYPE}`, function () {
    it('Should get number of transactions from cache', function (done) {
      assert.equal(
        engine.getNumTransactions({}),
        TX_AMOUNT,
        `should have ${TX_AMOUNT} tx from cache`
      )
      done()
    })

    it('Should get transactions from cache', function (done) {
      engine.getTransactions({}).then(txs => {
        assert.equal(
          txs.length,
          TX_AMOUNT,
          `should have ${TX_AMOUNT} tx from cache`
        )
        done()
      })
    })

    it('Should get transactions from cache with options', function (done) {
      engine.getTransactions({ startIndex: 1, startEntries: 2 }).then(txs => {
        assert.equal(txs.length, 2, 'should have 2 tx from cache')
        done()
      })
    })
  })

  describe('Should Add Gap Limit Addresses', function () {
    const gapAddresses = fixture['Add Gap Limit']
    const derived = gapAddresses.derived || []
    // const future = gapAddresses.future || []

    it('Add Empty Array', function (done) {
      engine.addGapLimitAddresses([])
      done()
    })

    it('Add Already Derived Addresses', function (done) {
      engine.addGapLimitAddresses(derived)
      done()
    })

    // it('Add Future Addresses', function (done) {
    //   engine.addGapLimitAddresses(future)
    //   done()
    // })
  })

  describe('Should start engine', function () {
    it.skip('Get BlockHeight', function (done) {
      const { uri, defaultHeight } = fixture.BlockHeight
      this.timeout(3000)
      const testHeight = () => {
        emitter.on('onBlockHeightChange', height => {
          if (height >= heightExpected) {
            emitter.removeAllListeners('onBlockHeightChange')
            assert(engine.getBlockHeight() >= heightExpected, 'Block height')
            done() // Can be "done" since the promise resolves before the event fires but just be on the safe side
          }
        })
        engine.startEngine().catch(e => {
          logger.info('startEngine error', e, e.message)
        })
      }
      let heightExpected = defaultHeight
      if (uri) {
        request.get(uri, (err, res, body) => {
          assert(!err, 'getting block height from a second source')
          const thirdPartyHeight = parseInt(JSON.parse(body).height)
          if (thirdPartyHeight && !isNaN(thirdPartyHeight)) {
            heightExpected = thirdPartyHeight
          }
          testHeight()
        })
      } else {
        testHeight()
      }
    })
  })

  describe(`Get Wallet Keys for Wallet type ${WALLET_TYPE}`, function () {
    it('get private key', function (done) {
      engine.getDisplayPrivateSeed()
      done()
    })
    it('get public key', function (done) {
      engine.getDisplayPublicSeed()
      done()
    })
  })

  // describe(`Is Address Used for Wallet type ${WALLET_TYPE} from network`, function () {
  //   it('Checking a non empty P2WSH address', function (done) {
  //     setTimeout(() => {
  //       assert.equal(engine.isAddressUsed('tb1qzsqz3akrp8745gsrl45pa2370gculzwx4qcf5v'), true)
  //       done()
  //     }, 1000)
  //   })

  //   it('Checking a non empty address P2SH', function (done) {
  //     setTimeout(() => {
  //       assert.equal(engine.isAddressUsed('2MtegHVwZFy88UjdHU81wWiRkwDq5o8pWka'), true)
  //       done()
  //     }, 1000)
  //   })
  // })

  describe(`Get Fresh Address for Wallet type ${WALLET_TYPE}`, function () {
    it('Should provide a non used BTC address when no options are provided', function () {
      this.timeout(3000)
      const address = engine.getFreshAddress({}) // TODO
      // $FlowFixMe
      const engineState: any = engine.engineState
      const scriptHash = engineState.scriptHashes[address.publicAddress]
      const transactions = engineState.addressInfos[scriptHash].txids
      assert(transactions.length === 0, 'Should have never received coins')
    })
  })

  describe(`Make Spend and Sign for Wallet type ${WALLET_TYPE}`, function () {
    const spendTests = fixture.Spend || {}
    const insufficientTests = fixture.InsufficientFundsError || {}

    it('Should fail since no spend target is given', function () {
      const spendInfo = {
        networkFeeOption: 'high',
        metadata: {
          name: 'Transfer to College Fund',
          category: 'Transfer:Wallet:College Fund'
        },
        spendTargets: []
      }
      return engine.makeSpend(spendInfo).catch(e => {
        assert(e, 'Should throw')
      })
    })

    Object.keys(spendTests).forEach(test => {
      it(`Should build transaction with ${test}`, function () {
        this.timeout(3000)
        const templateSpend = spendTests[test]
        return engine
          .makeSpend(templateSpend)
          .then(a => {
            return engine.signTx(a)
          })
          .then(a => {
            logger.info('sign', a)
          })
      })
    })

    Object.keys(insufficientTests).forEach(test => {
      it(`Should throw InsufficientFundsError for ${test}`, function () {
        const templateSpend = insufficientTests[test]
        return engine
          .makeSpend(templateSpend)
          .catch(e => assert.equal(e.name, errorNames.InsufficientFundsError))
      })
    })
  })

  describe(`Sweep Keys and Sign for Wallet type ${WALLET_TYPE}`, function () {
    const sweepTests = fixture.Sweep || {}

    Object.keys(sweepTests).forEach(test => {
      it.skip(`Should build transaction with ${test}`, function () {
        this.timeout(5000)
        const templateSpend = sweepTests[test]
        if (engine.sweepPrivateKeys == null) {
          throw new Error('No sweepPrivateKeys')
        }
        return engine
          .sweepPrivateKeys(templateSpend)
          .then(a => {
            return engine.signTx(a)
          })
          .then(a => {
            // console.warn('sign', a)
          })
      })
    })
  })

  describe(`Stop Engine for Wallet type ${WALLET_TYPE}`, function () {
    it('dump the wallet data', function (done) {
      const dataDump = engine.dumpData()
      const { id } = fixture['Make Engine']
      assert(dataDump.walletId === id, 'walletId')
      assert(dataDump.walletType === WALLET_TYPE, 'walletType')
      // $FlowFixMe
      assert(dataDump.walletFormat === WALLET_FORMAT, 'walletFormat')
      done()
    })

    it('changeSettings', function (done) {
      engine.changeUserSettings(fixture.ChangeSettings).then(done)
    })

    it('Stop the engine', function (done) {
      logger.info('kill engine')
      engine.killEngine().then(done)
    })
  })
}
