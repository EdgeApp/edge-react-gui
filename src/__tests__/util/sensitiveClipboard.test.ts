import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import Clipboard from '@react-native-clipboard/clipboard'
import { NativeModules } from 'react-native'

import {
  copySensitiveText,
  SENSITIVE_CLIPBOARD_SECONDS
} from '../../util/sensitiveClipboard'

const mockClipboard = jest.mocked(Clipboard)

describe('copySensitiveText', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockClipboard.setString.mockClear()
  })

  afterEach(() => {
    delete NativeModules.EdgeClipboard
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('hands the text and the expiry to the native module', async () => {
    const setSensitiveString = jest.fn(
      async (text: string, expirySeconds: number): Promise<void> => {}
    )
    NativeModules.EdgeClipboard = { setSensitiveString }

    await copySensitiveText('abandon ability able')

    expect(setSensitiveString.mock.calls).toEqual([
      ['abandon ability able', SENSITIVE_CLIPBOARD_SECONDS]
    ])
    // The OS owns the clipboard in this path, so JS never writes to it:
    jest.advanceTimersByTime(SENSITIVE_CLIPBOARD_SECONDS * 1000)
    expect(mockClipboard.setString.mock.calls).toEqual([])
  })

  it('rejects when the native module rejects', async () => {
    NativeModules.EdgeClipboard = {
      setSensitiveString: async (): Promise<void> => {
        throw new Error('clipboard unavailable')
      }
    }

    await expect(copySensitiveText('abandon')).rejects.toThrow(
      'clipboard unavailable'
    )
  })

  it('clears the clipboard after the expiry without the native module', async () => {
    await copySensitiveText('abandon ability able')
    expect(mockClipboard.setString.mock.calls).toEqual([
      ['abandon ability able']
    ])

    jest.advanceTimersByTime(SENSITIVE_CLIPBOARD_SECONDS * 1000 - 1)
    expect(mockClipboard.setString.mock.calls).toHaveLength(1)

    jest.advanceTimersByTime(1)
    expect(mockClipboard.setString.mock.calls).toEqual([
      ['abandon ability able'],
      ['']
    ])
  })

  it('restarts the countdown on a second copy', async () => {
    await copySensitiveText('first')
    jest.advanceTimersByTime(SENSITIVE_CLIPBOARD_SECONDS * 1000 - 1000)
    await copySensitiveText('second')

    // The first timer would have fired here:
    jest.advanceTimersByTime(1000)
    expect(mockClipboard.setString.mock.calls).toEqual([['first'], ['second']])

    jest.advanceTimersByTime(SENSITIVE_CLIPBOARD_SECONDS * 1000 - 1000)
    expect(mockClipboard.setString.mock.calls).toEqual([
      ['first'],
      ['second'],
      ['']
    ])
  })

  it('falls back when the native module lacks the method', async () => {
    NativeModules.EdgeClipboard = {}

    await copySensitiveText('abandon')

    expect(mockClipboard.setString.mock.calls).toEqual([['abandon']])
  })
})
