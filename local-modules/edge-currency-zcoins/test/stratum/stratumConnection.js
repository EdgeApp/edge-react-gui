// @flow

import { assert, expect } from 'chai'
import { makeFakeIo } from 'edge-core-js'
import { describe, it } from 'mocha'

import { makeNodeIo } from '../../src/index.js'
import {
  type StratumCallbacks,
  StratumConnection
} from '../../src/stratum/stratumConnection.js'
import {
  type StratumBlockHeader,
  type StratumHistoryRow,
  type StratumUtxo,
  fetchBlockHeader,
  fetchScriptHashHistory,
  fetchScriptHashUtxo,
  fetchTransaction,
  subscribeHeight,
  subscribeScriptHash
} from '../../src/stratum/stratumMessages.js'
import { bitcoinTimestampFromHeader } from '../../src/utils/coinUtils.js'

const fakeLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
}

// const ELECTRUM_SERVER = 'electrum://electrum.villocq.com:50001'
const ELECTRUM_SERVER = 'electrum://electrum.qtornado.com:50001'
const io = Object.assign({}, makeNodeIo(makeFakeIo()), { console: fakeLogger })

describe.skip('StratumConnection', function () {
  this.timeout(3000)
  it('fetchVersion', function (done) {
    let gotReply = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion (version) {
        connection.disconnect()
        expect(parseFloat(version)).to.be.at.least(1.1)
        gotReply = true
      },
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to fetch version'))
      },
      onQueueSpace () {}
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })

  it('subscribeHeight', function (done) {
    let gotReply = false
    const task = subscribeHeight(
      data => {
        expect(data).to.be.at.least(400000)
        gotReply = true
        connection.disconnect()
      },
      e => {
        console.error(e)
        connection.disconnect()
      }
    )
    let taskQueued = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion (version) {},
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to get height'))
      },
      onQueueSpace () {
        if (taskQueued) return
        taskQueued = true
        return task
      }
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })

  it('fetchBlockHeader', function (done) {
    let gotReply = false
    const task = fetchBlockHeader(
      400000,
      bitcoinTimestampFromHeader,
      (data: StratumBlockHeader) => {
        if (data.block_height != null) {
          expect(data.block_height).to.equal(400000)
        }
        if (data.prev_block_hash != null) {
          expect(data.prev_block_hash).to.equal(
            '0000000000000000030034b661aed920a9bdf6bbfa6d2e7a021f78481882fa39'
          )
        }
        expect(data.timestamp).to.equal(1456417484)
        gotReply = true
        connection.disconnect()
      },
      e => {
        console.error(e)
        connection.disconnect()
      }
    )
    let taskQueued = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion (version) {},
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to get header'))
      },
      onQueueSpace () {
        if (taskQueued) return
        taskQueued = true
        return task
      }
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })

  it('fetchTransaction', function (done) {
    let gotReply = false
    const task = fetchTransaction(
      '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
      (data: string) => {
        expect(data).to.equal(
          '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000'
        )
        gotReply = true
        connection.disconnect()
      },
      e => {
        console.error(e)
        connection.disconnect()
      }
    )
    let taskQueued = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion (version) {},
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to get transaction'))
      },
      onQueueSpace () {
        if (taskQueued) return
        taskQueued = true
        return task
      }
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })

  it('subscribeScriptHash', function (done) {
    let gotReply = false
    const task = subscribeScriptHash(
      '187b07664e7f1c6a26911530652b24376c1a8d1ae734d7c9fa925e7f117b077d',
      (data: string | null) => {
        assert.equal(
          data,
          'a1e0a04e5c66342aca0171a398ff131f9cb51edb30c1e68cf67dd28bb3615b57'
        )
        gotReply = true
        connection.disconnect()
      },
      e => {
        console.error(e)
        connection.disconnect()
      }
    )
    let taskQueued = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion (version) {},
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to subscribe address'))
      },
      onQueueSpace () {
        if (taskQueued) return
        taskQueued = true
        return task
      }
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })

  it('fetchScriptHashHistory', function (done) {
    let gotReply = false
    const task = fetchScriptHashHistory(
      '187b07664e7f1c6a26911530652b24376c1a8d1ae734d7c9fa925e7f117b077d',
      (data: Array<StratumHistoryRow>) => {
        assert.equal(data.length > 0, true)
        assert.equal(
          data[0].tx_hash,
          '7d73beab722e34648c586a1657450e5b7ee5be0456e1579c60a69f1da19a561c'
        )
        assert.equal(data[0].height, 496162)
        gotReply = true
        connection.disconnect()
      },
      e => {
        console.error(e)
        connection.disconnect()
      }
    )
    let taskQueued = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion (version) {},
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to get history'))
      },
      onQueueSpace () {
        if (taskQueued) return
        taskQueued = true
        return task
      }
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })

  it('fetchScriptHashUtxo', function (done) {
    let gotReply = false
    const task = fetchScriptHashUtxo(
      '187b07664e7f1c6a26911530652b24376c1a8d1ae734d7c9fa925e7f117b077d',
      (data: Array<StratumUtxo>) => {
        assert.equal(data.length > 0, true)
        assert.equal(
          data[0].tx_hash,
          '7d73beab722e34648c586a1657450e5b7ee5be0456e1579c60a69f1da19a561c'
        )
        assert.equal(data[0].height, 496162)
        assert.equal(data[0].tx_pos, 0)
        assert.equal(data[0].value, 10874)
        gotReply = true
        connection.disconnect()
      },
      e => {
        console.error(e)
        connection.disconnect()
      }
    )
    let taskQueued = false
    const callbacks: StratumCallbacks = {
      onTimer () {},
      onVersion () {},
      onNotifyHeight () {},
      onNotifyScriptHash () {},
      onOpen () {},
      onClose () {
        done(gotReply ? void 0 : new Error('Failed to get utxo'))
      },
      onQueueSpace () {
        if (taskQueued) return
        taskQueued = true
        return task
      }
    }
    const connection = new StratumConnection(ELECTRUM_SERVER, { callbacks, io })
    connection.open()
  })
})
