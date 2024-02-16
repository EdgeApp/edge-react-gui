import { afterAll, afterEach, describe, expect, it, jest } from '@jest/globals'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import { EdgeAccount, EdgeContext } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { DevTestScene } from '../../components/scenes/DevTestScene'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

jest.useRealTimers()
const consoleLog = jest.spyOn(console, 'log')

let context: EdgeContext | undefined
let account: EdgeAccount | undefined

// For use later when we need tests that use EVM currencies
// let ethWallet: EdgeCurrencyWallet | undefined
// let avaxWallet: EdgeCurrencyWallet | undefined

const asFakeUser = asObject({
  username: asString,
  lastLogin: asOptional(asDate),
  loginId: asString,
  loginKey: asString,
  repos: asObject(asObject(asUnknown)),
  server: asUnknown
})

const asUserDump = asObject({
  loginKey: asString,
  data: asFakeUser
})

describe('DevTestScene', () => {
  // let consoleLog: jest.SpyInstance
  // beforeAll(() => {
  //   consoleLog = jest.spyOn(console, 'log').mockImplementation()
  // proces.stdout.write??
  // })

  // Reset mocks after each test to clean state
  afterEach(() => {
    consoleLog.mockClear()
  })

  // Restore original console.log after all tests
  afterAll(() => {
    consoleLog.mockRestore()
  })

  it('Render DevTestScene', () => {
    const mockState: FakeState = {
      core: {
        account: {
          currencyConfig: {
            bitcoin: { currencyInfo: btcCurrencyInfo }
          },
          currencyWallets: {
            '332s0ds39f': { currencyInfo: btcCurrencyInfo, name: 'Test wallet', fiatCurrencyCode: 'iso:USD', id: 'testid' }
          },
          watch: () => () => {}
        }
      }
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <DevTestScene {...fakeSceneProps('devTab', undefined)} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
    // renderer.unmount()
  })

  // Additional tests can be added here, for example, to test different states or props
})
