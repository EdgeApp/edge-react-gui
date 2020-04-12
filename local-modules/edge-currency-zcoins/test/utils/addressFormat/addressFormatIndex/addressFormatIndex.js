// @flow

import { assert } from 'chai'
import { describe, it } from 'mocha'

// eslint-disable-next-line no-unused-vars
import edgeCorePlugins from '../../../../src/index.js'
import {
  toLegacyFormat,
  toNewFormat,
  validAddress
} from '../../../../src/utils/addressFormat/addressFormatIndex.js'
import fixtures from './fixtures.json'

for (const fixture of fixtures) {
  const { network } = fixture

  describe(`Address format for ${network}`, function () {
    fixture['valid'].forEach(address => {
      it(`test valid for ${address}`, function () {
        assert.equal(validAddress(address, network), true)
      })
    })

    fixture['inValid'].forEach(address => {
      it(`test invalid for ${address}`, function () {
        assert.equal(validAddress(address, network), false)
      })
    })

    fixture['toLegacy'].forEach(([address, expected]) => {
      it(`get legacy format for ${address}`, function () {
        assert.equal(toLegacyFormat(address, network), expected)
      })
    })

    fixture['toNewFormat'].forEach(([address, expected]) => {
      it(`get new format for ${address}`, function () {
        assert.equal(toNewFormat(address, network), expected)
      })
    })
  })
}
