// @flow
/* globals describe test expect */

import * as UI_SELECTORS from '../modules/UI/selectors.js'

describe('getWalletAddressesCheckedPercent', function () {
  describe('when no progress', function () {
    test('zero progress => zero progress', function () {
      const state: any = {
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
      const state: any = {
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
      const state: any = {
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
