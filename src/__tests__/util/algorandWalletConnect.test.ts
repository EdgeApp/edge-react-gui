import { describe, expect, it } from '@jest/globals'

import {
  type AlgoWcTransaction,
  describeAlgoWcTransaction,
  getAlgoWcDangers,
  getAlgoWcWalletAddress,
  groupAlgoWcTransactions,
  signAlgoWcTransactions
} from '../../util/algorandWalletConnect'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'

const WALLET = 'WALLETAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const DAPP = 'DAPPBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
const THIEF = 'THIEFCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
const USDC = '31566704'

const currencyConfig = makeFakeCurrencyConfig(
  {
    pluginId: 'algorand',
    currencyCode: 'ALGO',
    denominations: [{ multiplier: '1000000', name: 'ALGO' }]
  },
  {
    [USDC]: {
      currencyCode: 'USDC',
      denominations: [{ multiplier: '1000000', name: 'USDC' }],
      displayName: 'USD Coin',
      networkLocation: { contractAddress: USDC }
    }
  }
)

const makeTx = (fields: Partial<AlgoWcTransaction>): AlgoWcTransaction => ({
  type: 'pay',
  willSign: true,
  groupId: undefined,
  sender: WALLET,
  networkFee: '1000',
  recipient: undefined,
  nativeAmount: undefined,
  assetId: undefined,
  clawbackFrom: undefined,
  appId: undefined,
  rekeyTo: undefined,
  closeRemainderTo: undefined,
  ...fields
})

const describeTx = (
  tx: AlgoWcTransaction
): ReturnType<typeof describeAlgoWcTransaction> =>
  describeAlgoWcTransaction(tx, currencyConfig, WALLET)

describe('signAlgoWcTransactions', () => {
  const sign = async (txn: string): Promise<string> => `signed:${txn}`
  const makePayload = (txns: object[]): object => ({
    id: 1,
    jsonrpc: '2.0',
    method: 'algo_signTxn',
    params: [txns]
  })

  it('signs every transaction in order', async () => {
    const out = await signAlgoWcTransactions(
      makePayload([{ txn: 'a' }, { txn: 'b', signers: [WALLET] }]),
      sign
    )
    expect(out).toEqual(['signed:a', 'signed:b'])
  })

  it('leaves transactions marked as not ours unsigned', async () => {
    const signed: string[] = []
    const out = await signAlgoWcTransactions(
      makePayload([
        { txn: 'a' },
        { txn: 'b', signers: [] },
        { txn: 'c', signers: [], stxn: 'theirs' },
        { txn: 'd' }
      ]),
      async txn => {
        signed.push(txn)
        return await sign(txn)
      }
    )
    expect(out).toEqual(['signed:a', null, 'theirs', 'signed:d'])
    expect(signed).toEqual(['a', 'd'])
  })

  it('fails as a whole when one signature fails', async () => {
    await expect(
      signAlgoWcTransactions(
        makePayload([{ txn: 'a' }, { txn: 'b' }]),
        async txn => {
          if (txn === 'b') throw new Error('nope')
          return await sign(txn)
        }
      )
    ).rejects.toThrow('nope')
  })
})

describe('groupAlgoWcTransactions', () => {
  it('splits a request into its groups', () => {
    const txs = [
      makeTx({ groupId: 'g1' }),
      makeTx({ groupId: 'g1' }),
      makeTx({}),
      makeTx({}),
      makeTx({ groupId: 'g2' })
    ]
    const groups = groupAlgoWcTransactions(txs)
    expect(groups.map(group => group.length)).toEqual([2, 1, 1, 1])
    expect(groups.flat()).toEqual(txs)
  })
})

describe('getAlgoWcWalletAddress', () => {
  it('is the sender of a transaction the wallet signs', () => {
    expect(
      getAlgoWcWalletAddress([
        makeTx({ sender: DAPP, willSign: false }),
        makeTx({})
      ])
    ).toBe(WALLET)
  })
})

describe('getAlgoWcDangers', () => {
  it('finds nothing in ordinary transactions', () => {
    expect(
      getAlgoWcDangers(
        [makeTx({ recipient: DAPP, nativeAmount: '5' })],
        currencyConfig
      )
    ).toEqual([])
  })

  it('names each rekey and close-out by its position', () => {
    expect(
      getAlgoWcDangers(
        [
          makeTx({ recipient: DAPP, nativeAmount: '5' }),
          makeTx({ recipient: WALLET, nativeAmount: '0', rekeyTo: THIEF }),
          makeTx({ recipient: DAPP, closeRemainderTo: THIEF }),
          makeTx({
            type: 'axfer',
            assetId: USDC,
            recipient: DAPP,
            closeRemainderTo: THIEF
          })
        ],
        currencyConfig
      )
    ).toEqual([
      'Transaction 2 gives THIEFC...CCCCCC permanent control of this account and everything in it',
      "Transaction 3 sends this wallet's entire ALGO balance to THIEFC...CCCCCC",
      "Transaction 4 sends this wallet's entire USDC balance to THIEFC...CCCCCC"
    ])
  })

  it('ignores transactions the wallet does not sign', () => {
    expect(
      getAlgoWcDangers(
        [makeTx({ sender: DAPP, willSign: false, rekeyTo: THIEF })],
        currencyConfig
      )
    ).toEqual([])
  })
})

describe('describeAlgoWcTransaction', () => {
  it('describes a payment', () => {
    expect(
      describeTx(makeTx({ recipient: DAPP, nativeAmount: '1500000' }))
    ).toEqual({ title: 'Payment', body: '1.5 ALGO to DAPPBB...BBBBBB' })
  })

  it('shows the smallest amount in full', () => {
    expect(
      describeTx(makeTx({ recipient: DAPP, nativeAmount: '1' })).body
    ).toBe('0.000001 ALGO to DAPPBB...BBBBBB')
  })

  it('describes a transfer of a known asset', () => {
    expect(
      describeTx(
        makeTx({
          type: 'axfer',
          assetId: USDC,
          recipient: DAPP,
          nativeAmount: '2500000'
        })
      )
    ).toEqual({ title: 'Asset Transfer', body: '2.5 USDC to DAPPBB...BBBBBB' })
  })

  it('shows an unknown asset in base units', () => {
    expect(
      describeTx(
        makeTx({
          type: 'axfer',
          assetId: '999',
          recipient: DAPP,
          nativeAmount: '42'
        })
      ).body
    ).toBe('42 base units of asset 999 to DAPPBB...BBBBBB')
  })

  it('describes an opt-in', () => {
    expect(
      describeTx(
        makeTx({
          type: 'axfer',
          assetId: USDC,
          recipient: WALLET,
          nativeAmount: '0'
        })
      )
    ).toEqual({ title: 'Asset Opt-In', body: 'USDC' })
  })

  it('describes application calls', () => {
    expect(describeTx(makeTx({ type: 'appl', appId: '1234' }))).toEqual({
      title: 'Application Call',
      body: 'Application 1234'
    })
    expect(describeTx(makeTx({ type: 'appl', appId: '0' })).body).toBe(
      'New application'
    )
  })

  it('describes a transaction with nothing to add', () => {
    expect(describeTx(makeTx({ type: 'keyreg' }))).toEqual({
      title: 'Key Registration',
      body: undefined
    })
  })

  it("marks another party's transaction", () => {
    expect(
      describeTx(
        makeTx({
          sender: DAPP,
          willSign: false,
          recipient: WALLET,
          nativeAmount: '2000000'
        })
      )
    ).toEqual({
      title: 'Payment (signed by someone else)',
      body: '2 ALGO from DAPPBB...BBBBBB to this wallet'
    })
  })

  it('names the account a clawback takes from', () => {
    expect(
      describeTx(
        makeTx({
          type: 'axfer',
          assetId: USDC,
          recipient: THIEF,
          nativeAmount: '1000000',
          clawbackFrom: DAPP
        })
      ).body
    ).toBe('1 USDC from DAPPBB...BBBBBB to THIEFC...CCCCCC')
  })

  it('adds a line for a rekey and for a close-out', () => {
    expect(
      describeTx(
        makeTx({
          recipient: DAPP,
          nativeAmount: '0',
          rekeyTo: THIEF,
          closeRemainderTo: THIEF
        })
      ).body
    ).toBe(
      [
        '0 ALGO to DAPPBB...BBBBBB',
        'Rekeys the account to THIEFC...CCCCCC',
        'Sends the entire remaining balance to THIEFC...CCCCCC'
      ].join('\n')
    )
  })
})
