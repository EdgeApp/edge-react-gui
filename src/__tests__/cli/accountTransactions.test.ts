import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccountTxQuery } from 'edge-core-js'

import {
  asQueryNumber,
  getTransactionSettings,
  queryAccountTransactions,
  setDefaultIsoFiat,
  summarizeAccountTransactions
} from '../../cli/engine/routes/accountTransactions'

interface ThrownEngineError extends Error {
  code: string
}

interface FakeStore {
  store: any
  queries: EdgeAccountTxQuery[]
  changeLocalSettings: jest.Mock<(settings: unknown) => Promise<void>>
}

function makeStore(): FakeStore {
  const queries: EdgeAccountTxQuery[] = []
  const queryTxs = jest.fn(async (query: EdgeAccountTxQuery) => {
    queries.push(query)
    return {
      transactions: [{ txid: 'a' }],
      cursor: 'next',
      summary: { count: 1, earliestDate: 'x', latestDate: 'y' }
    }
  })
  const changeLocalSettings = jest.fn(async (settings: unknown) => {})
  const store = {
    queryTxs,
    changeLocalSettings,
    localSettings: { defaultIsoFiat: 'iso:USD' }
  }
  return { store, queries, changeLocalSettings }
}

function makeCtx(
  store: unknown,
  spec: any,
  raw: Record<string, string>,
  body?: unknown
): any {
  const valid = spec.query != null ? spec.query(raw) : {}
  return {
    params: { sessionId: 'sess_test' },
    state: {
      sessions: {
        get: () => ({ account: { transactions: store } }),
        touch: () => {}
      }
    },
    body,
    query: Object.assign(new URLSearchParams(raw), { valid })
  }
}

describe('asQueryNumber', () => {
  it('accepts signed decimals', () => {
    expect(asQueryNumber('12.5')).toBe(12.5)
    expect(asQueryNumber('-3')).toBe(-3)
    expect(asQueryNumber('-12.50')).toBe(-12.5)
    expect(asQueryNumber('.5')).toBe(0.5)
    expect(asQueryNumber(7)).toBe(7)
  })

  it('rejects anything else', () => {
    for (const raw of ['abc', 'Infinity', '', '1e3', '1.2.3', null, NaN]) {
      expect(() => asQueryNumber(raw)).toThrow('Expected a decimal number')
    }
  })
})

describe('query-transactions', () => {
  it('maps the fiat sort and bounds onto the core query', async () => {
    const { store, queries } = makeStore()
    const result = await queryAccountTransactions.handler(
      makeCtx(store, queryAccountTransactions, {
        sort: 'fiatAmount',
        sortDirection: 'asc',
        direction: 'send',
        startDate: '2026-01-01',
        minFiatAmount: '-100.25',
        maxFiatAmount: '-0.5',
        after: 'cursor1'
      })
    )
    expect(result).toEqual({ transactions: [{ txid: 'a' }], cursor: 'next' })
    expect(queries[0]).toMatchObject({
      sort: { field: 'fiatAmount', direction: 'asc' },
      direction: 'send',
      minFiatAmount: -100.25,
      maxFiatAmount: -0.5,
      after: 'cursor1'
    })
  })

  it('refuses a fiat sort without narrowing', async () => {
    const { store } = makeStore()
    let code = ''
    try {
      await queryAccountTransactions.handler(
        makeCtx(store, queryAccountTransactions, { sort: 'fiatAmount' })
      )
    } catch (error) {
      code = (error as ThrownEngineError).code
    }
    expect(code).toBe('BAD_REQUEST')
  })

  it('rejects a non-number fiat bound in the cleaner', () => {
    expect(() =>
      makeCtx({}, queryAccountTransactions, { minFiatAmount: 'ten' })
    ).toThrow()
  })

  it('parses list, token and amount filters', async () => {
    const { store, queries } = makeStore()
    await queryAccountTransactions.handler(
      makeCtx(store, queryAccountTransactions, {
        walletIds: 'w1, w2,',
        pluginIds: 'bitcoin',
        tokenIds: 'null,abc',
        minAmount: '150000000',
        maxAmount: '-5',
        sortDirection: 'desc'
      })
    )
    expect(queries[0]).toMatchObject({
      walletIds: ['w1', 'w2'],
      pluginIds: ['bitcoin'],
      tokenIds: [null, 'abc'],
      minNativeAmount: '150000000',
      maxNativeAmount: '-5',
      sort: { field: 'date', direction: 'desc' }
    })
    const spec: any = queryAccountTransactions
    expect(spec.query({ walletIds: ['a', 'b'] }).walletIds).toEqual(['a', 'b'])
    expect(() => spec.query({ walletIds: 5 })).toThrow('comma list')
    expect(() => spec.query({ minAmount: '1.5' })).toThrow('integer amount')
  })

  it('leaves the fiat fields out when not given', async () => {
    const { store, queries } = makeStore()
    await queryAccountTransactions.handler(
      makeCtx(store, queryAccountTransactions, {})
    )
    expect(queries[0].minFiatAmount).toBeUndefined()
    expect(queries[0].maxFiatAmount).toBeUndefined()
    expect(queries[0].sort).toBeUndefined()
  })
})

describe('summarize-transactions', () => {
  it('passes the fiat bounds and asks for a summary', async () => {
    const { store, queries } = makeStore()
    const summary = await summarizeAccountTransactions.handler(
      makeCtx(store, summarizeAccountTransactions, {
        minFiatAmount: '12.50',
        maxFiatAmount: '99'
      })
    )
    expect(summary).toEqual({ count: 1, earliestDate: 'x', latestDate: 'y' })
    expect(queries[0]).toMatchObject({
      minFiatAmount: 12.5,
      maxFiatAmount: 99,
      details: 'summary'
    })
  })
})

describe('transaction settings', () => {
  it('reads and writes the default fiat', async () => {
    const { store, changeLocalSettings } = makeStore()
    expect(
      await getTransactionSettings.handler(
        makeCtx(store, getTransactionSettings, {})
      )
    ).toEqual({ defaultIsoFiat: 'iso:USD' })
    expect(
      await setDefaultIsoFiat.handler(
        makeCtx(store, setDefaultIsoFiat, {}, { defaultIsoFiat: 'iso:EUR' })
      )
    ).toEqual({ ok: true })
    expect(changeLocalSettings).toHaveBeenCalledWith({
      defaultIsoFiat: 'iso:EUR'
    })
  })
})
