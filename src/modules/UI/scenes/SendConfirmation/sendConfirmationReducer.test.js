/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test describe expect */

import { sendConfirmation as sendConfirmationReducer } from './reducer.js'
import { initialState } from './selectors.js'

describe('sendConfirmationReducer', () => {
  test('initialState', () => {
    const expected = initialState
    const actual = sendConfirmationReducer(undefined, {})

    expect(actual).toEqual(expected)
  })
})
