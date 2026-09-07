import { describe, expect, test } from '@jest/globals'

import { rootReducer } from '../../reducers/RootReducer'

test('initialState', () => {
  const actual = rootReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toMatchSnapshot()
})

describe('linkPromo', () => {
  const initial = rootReducer(undefined, {
    type: 'DUMMY_ACTION_PLEASE_IGNORE'
  })
  const bobOnBuy = { promoId: 'bob', tab: 'buyTab' } as const

  test('starts empty', () => {
    expect(initial.linkPromo).toBe(null)
  })

  test('holds the promo a deep link or promo card supplied', () => {
    const state = rootReducer(initial, {
      type: 'LINK_PROMO/SET',
      data: { linkPromo: bobOnBuy }
    })

    expect(state.linkPromo).toEqual(bobOnBuy)
  })

  test('retires the promo once the conversion is logged', () => {
    const withPromo = rootReducer(initial, {
      type: 'LINK_PROMO/SET',
      data: { linkPromo: bobOnBuy }
    })
    const state = rootReducer(withPromo, {
      type: 'LINK_PROMO/SET',
      data: { linkPromo: null }
    })

    expect(state.linkPromo).toBe(null)
  })

  test('a newer link replaces the promo and its tab', () => {
    const withPromo = rootReducer(initial, {
      type: 'LINK_PROMO/SET',
      data: { linkPromo: bobOnBuy }
    })
    const state = rootReducer(withPromo, {
      type: 'LINK_PROMO/SET',
      data: { linkPromo: { promoId: 'carol', tab: 'swapTab' } }
    })

    expect(state.linkPromo).toEqual({ promoId: 'carol', tab: 'swapTab' })
  })

  test('does not survive a logout', () => {
    const withPromo = rootReducer(initial, {
      type: 'LINK_PROMO/SET',
      data: { linkPromo: bobOnBuy }
    })
    const state = rootReducer(withPromo, { type: 'LOGOUT' })

    expect(state.linkPromo).toBe(null)
  })
})
