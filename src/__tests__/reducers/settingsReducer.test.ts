import { describe, expect, jest, test } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import {
  asSyncedAccountSettings,
  readSyncedSettings,
  setStealthSendEnabled,
  setStealthSwapEnabled
} from '../../actions/SettingsActions'
import {
  initialState,
  settings as settingsReducer
} from '../../reducers/scenes/SettingsReducer'
import type { Dispatch, GetState, ThunkAction } from '../../types/reduxTypes'
import { asLocalAccountSettings } from '../../types/types'

test('initialState', () => {
  const expected = initialState
  const actual = settingsReducer(undefined, {
    type: 'DUMMY_ACTION_PLEASE_IGNORE'
  })

  expect(actual).toEqual(expected)
})

describe('saved Stealth toggles', () => {
  test('default to off, including over a malformed value', () => {
    const blank = asSyncedAccountSettings({})
    expect(blank.stealthSendEnabled).toBe(false)
    expect(blank.stealthSwapEnabled).toBe(false)

    const malformed = asSyncedAccountSettings({
      stealthSendEnabled: 'yes',
      stealthSwapEnabled: 1
    })
    expect(malformed.stealthSendEnabled).toBe(false)
    expect(malformed.stealthSwapEnabled).toBe(false)
  })

  test('load on LOGIN', () => {
    const state = settingsReducer(initialState, {
      type: 'LOGIN',
      data: {
        account: {} as unknown as EdgeAccount,
        syncedSettings: asSyncedAccountSettings({
          stealthSendEnabled: true,
          stealthSwapEnabled: false
        }),
        localSettings: asLocalAccountSettings({})
      }
    })

    expect(state.stealthSendEnabled).toBe(true)
    expect(state.stealthSwapEnabled).toBe(false)
  })

  test('round trip through the synced settings file, each on its own', async () => {
    const account = {
      disklet: makeMemoryDisklet()
    } as unknown as EdgeAccount
    const dispatch = jest.fn()
    const run = async (thunk: ThunkAction<Promise<void>>): Promise<void> => {
      await thunk(dispatch as unknown as Dispatch, jest.fn<GetState>())
    }

    await run(setStealthSendEnabled(account, true))
    let saved = await readSyncedSettings(account)
    expect(saved.stealthSendEnabled).toBe(true)
    expect(saved.stealthSwapEnabled).toBe(false)

    await run(setStealthSwapEnabled(account, true))
    await run(setStealthSendEnabled(account, false))
    saved = await readSyncedSettings(account)
    expect(saved.stealthSendEnabled).toBe(false)
    expect(saved.stealthSwapEnabled).toBe(true)

    // Each write also lands in the store through `updateOneSetting`:
    expect(dispatch).toHaveBeenCalledTimes(3)
  })
})
