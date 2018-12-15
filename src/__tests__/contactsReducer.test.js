// @flow

/* globals test expect */

import { contacts, initialState } from '../reducers/ContactsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = initialState
  const actual = contacts(undefined, dummyAction)

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
  const actual = contacts(undefined, {
    type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
    data: { contacts: [contact] }
  })

  expect(actual).toEqual(expected)
})
