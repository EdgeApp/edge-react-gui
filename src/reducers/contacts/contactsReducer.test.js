/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { contactsReducer, initialState } from './contactsReducer.js'
import { loadContactsSuccess } from './actions.js'

test('initialState', () => {
  const expected = initialState
  const actual = contactsReducer(undefined, { type: 'UNKNOWN' })

  expect(actual).toEqual(expected)
})

test('contacts loaded', () => {
  const contact = {
    hasThumbnail: true,
    emailAddresses: ['hello@email.com'],
    postalAddresses: ['123 Main St.'],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: 'Smith',
    thumbnailPath: 'path/to/thumbnail',
    recordID: '',
    givenName: 'John'
  }
  const expected = [contact]
  const action = loadContactsSuccess([contact])
  const actual = contactsReducer(undefined, action)

  expect(actual).toEqual(expected)
})
