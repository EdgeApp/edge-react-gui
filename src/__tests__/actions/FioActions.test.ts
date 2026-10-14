import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'

import { checkFioObtData } from '../../actions/FioActions'
import type { RootState } from '../../reducers/RootReducer'
import type { Dispatch } from '../../types/reduxTypes'
import type { FioObtRecord } from '../../types/types'

jest.mock('../../util/FioAddressUtils', () => ({
  ...jest.requireActual<object>('../../util/FioAddressUtils'),
  addToFioAddressCache: async () => {}
}))

const makeObtRecord = (txid: string, memo: string): FioObtRecord => ({
  payer_fio_address: 'alice@edge',
  payee_fio_address: 'bob@edge',
  payer_fio_public_key: 'FIO-payer',
  payee_fio_public_key: 'FIO-payee',
  content: { obt_id: txid, memo },
  fio_request_id: 0,
  status: 'sent_to_blockchain',
  time_stamp: '2026-01-01T00:00:00'
})

const makeTx = (txid: string): EdgeTransaction =>
  ({
    txid,
    tokenId: null,
    isSend: false,
    metadata: { notes: '' }
  } as unknown as EdgeTransaction)

const makeFioWallet = (records: FioObtRecord[]): EdgeCurrencyWallet =>
  ({
    otherMethods: {
      fetchObtData: async () => records
    }
  } as unknown as EdgeCurrencyWallet)

const account = {
  currencyConfig: {
    fio: {
      otherMethods: {
        isFioAddressValid: async () => false
      }
    }
  }
}

const makeState = (fioWallets: EdgeCurrencyWallet[]): RootState =>
  ({
    core: { account },
    ui: { fio: { fioWallets } }
  } as unknown as RootState)

describe('checkFioObtData', () => {
  const dispatch = jest.fn() as unknown as Dispatch
  const saveTxMetadata = jest.fn<(...args: any[]) => Promise<void>>()
  const wallet = { saveTxMetadata } as unknown as EdgeCurrencyWallet

  beforeEach(() => {
    saveTxMetadata.mockReset()
    saveTxMetadata.mockResolvedValue(undefined)
  })

  it('applies OBT data to every matching transaction in the batch', async () => {
    const fioWallet = makeFioWallet([
      makeObtRecord('tx-b', 'rent'),
      makeObtRecord('tx-c', 'dinner')
    ])
    const getState = (): RootState => makeState([fioWallet])

    await checkFioObtData(wallet, [
      makeTx('tx-a'),
      makeTx('tx-b'),
      makeTx('tx-c')
    ])(dispatch, getState)

    expect(saveTxMetadata.mock.calls.map(([arg]) => arg.txid)).toEqual([
      'tx-b',
      'tx-c'
    ])
    const [{ metadata }] = saveTxMetadata.mock.calls[0]
    expect(metadata.name).toBe('alice@edge')
    expect(metadata.notes).toContain('rent')
  })

  it('leaves transactions without an OBT record untouched', async () => {
    const fioWallet = makeFioWallet([makeObtRecord('other', 'memo')])
    const getState = (): RootState => makeState([fioWallet])

    await checkFioObtData(wallet, [makeTx('tx-a'), makeTx('tx-b')])(
      dispatch,
      getState
    )

    expect(saveTxMetadata).not.toHaveBeenCalled()
  })

  it('waits for FIO wallets that load after the transactions arrive', async () => {
    const fioWallet = makeFioWallet([makeObtRecord('tx-a', 'late')])
    let calls = 0
    const getState = (): RootState =>
      makeState(calls++ === 0 ? [] : [fioWallet])

    await checkFioObtData(wallet, [makeTx('tx-a')])(dispatch, getState)

    expect(saveTxMetadata).toHaveBeenCalledTimes(1)
    expect(saveTxMetadata.mock.calls[0][0].txid).toBe('tx-a')
  })
})
