/* eslint-disable flowtype/require-valid-file-annotation */
/* eslint-disable flowtype/require-valid-file-annotation */
/* globals describe test expect */

import * as SETTINGS_SELECTORS from '../modules/Settings/selectors'
import * as UI_SELECTORS from '../modules/UI/selectors.js'

describe('getSupportedWalletTypes', function () {
  describe('when multiple supported wallet types', function () {
    test('[plugins] => [supportedWalletTypes]', function () {
      const allCurrencyInfos = [{ displayName: 'Bitcoin', walletType: 'wallet:bitcoin' }, { displayName: 'Ethereum', walletType: 'wallet:ethereum' }]
      const state = {
        ui: {
          settings: {
            plugins: {
              allCurrencyInfos
            }
          }
        }
      }
      const expected = [{ label: 'Bitcoin', value: 'wallet:bitcoin' }, { label: 'Ethereum', value: 'wallet:ethereum' }]
      const actual = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
      expect(actual).toEqual(expected)
    })
  })

  describe('when no supported wallet types', function () {
    test('[plugins] => [supportedWalletTypes]', function () {
      const state = {
        ui: {
          settings: {
            plugins: {
              allCurrencyInfos: []
            }
          }
        }
      }
      const expected = []
      const actual = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
      expect(actual).toEqual(expected)
    })
  })
})

describe('getWalletAddressesCheckedPercent', function () {
  describe('when no progress', function () {
    test('zero progress => zero progress', function () {
      const state = {
        ui: {
          wallets: {
            walletLoadingProgress: {
              fakeWalletId1: 0,
              fakeWalletId2: 0,
              fakeWalletId3: 0
            }
          }
        }
      }
      const expected = 0
      const actual = UI_SELECTORS.getWalletLoadingPercent(state)
      expect(actual).toEqual(expected)
    })
  })

  describe('when partial progress', function () {
    test('partial progress => partial progress', function () {
      const randomNumbers = []
      while (randomNumbers.length < 3) {
        const newRandomNumber = Math.random()
        if (newRandomNumber > 0 && newRandomNumber < 1) {
          randomNumbers.push(newRandomNumber)
        }
      }
      const state = {
        ui: {
          wallets: {
            walletLoadingProgress: {
              fakeWalletId1: randomNumbers[0],
              fakeWalletId2: randomNumbers[1],
              fakeWalletId3: randomNumbers[2]
            }
          }
        }
      }
      const lowerLimit = 0
      const upperLimit = 100
      const actual = UI_SELECTORS.getWalletLoadingPercent(state)
      expect(actual).toBeGreaterThan(lowerLimit)
      expect(actual).toBeLessThan(upperLimit)
    })
  })

  describe('when progress complete', function () {
    test('complete progress => complete progress', function () {
      const state = {
        ui: {
          wallets: {
            walletLoadingProgress: {
              fakeWalletId1: 1,
              fakeWalletId2: 1,
              fakeWalletId3: 1
            }
          }
        }
      }
      const expected = 100
      const actual = UI_SELECTORS.getWalletLoadingPercent(state)
      expect(actual).toEqual(expected)
    })
  })
})
