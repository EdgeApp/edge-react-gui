import { describe, expect, test } from '@jest/globals'

import { rootReducer } from '../../reducers/RootReducer'

test('initialState', () => {
  const actual = rootReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toMatchSnapshot()
})

describe('linkPromoId', () => {
  const initial = rootReducer(undefined, {
    type: 'DUMMY_ACTION_PLEASE_IGNORE'
  })

  test('starts empty', () => {
    expect(initial.linkPromoId).toBe(null)
  })

  test('holds the id a deep link or promo card supplied', () => {
    const state = rootReducer(initial, {
      type: 'LINK_PROMO_ID/SET',
      data: { promoId: 'bob' }
    })

    expect(state.linkPromoId).toBe('bob')
  })

  test('retires the id once the conversion is logged', () => {
    const withPromo = rootReducer(initial, {
      type: 'LINK_PROMO_ID/SET',
      data: { promoId: 'bob' }
    })
    const state = rootReducer(withPromo, {
      type: 'LINK_PROMO_ID/SET',
      data: { promoId: undefined }
    })

    expect(state.linkPromoId).toBe(null)
  })

  test('does not survive a logout', () => {
    const withPromo = rootReducer(initial, {
      type: 'LINK_PROMO_ID/SET',
      data: { promoId: 'bob' }
    })
    const state = rootReducer(withPromo, { type: 'LOGOUT' })

    expect(state.linkPromoId).toBe(null)
  })
})
