import { afterEach, describe, expect, it, jest } from '@jest/globals'

import {
  type LogOutput,
  LogsClockError,
  sendLogs
} from '../../actions/LogActions'
import { lstrings } from '../../locales/strings'

const makeLog = (): LogOutput => ({
  isoDate: '2026-10-09T12:00:00.000Z',
  uniqueId: 'abc123_info',
  userMessage: '',
  deviceInfo: 'test device',
  appVersion: '0.0.0',
  OS: 'test',
  accounts: [],
  data: ''
})

const mockFetch = (status: number, body: string): void => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body
  }
  global.fetch = jest.fn(async () => response) as unknown as typeof fetch
}

describe('sendLogs', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
  })

  it('resolves when the logs server accepts the upload', async () => {
    mockFetch(200, '')
    await expect(sendLogs(makeLog(), false)).resolves.toBeUndefined()
  })

  it('names the device clock when the server says the time is out of sync', async () => {
    mockFetch(400, 'Time Out of Sync')
    const error = await sendLogs(makeLog(), false).catch(
      (error: unknown) => error
    )
    expect(error).toBeInstanceOf(LogsClockError)
    expect((error as Error).message).toBe(
      lstrings.settings_modal_send_logs_clock_error
    )
  })

  it('keeps the status code for any other refusal', async () => {
    mockFetch(400, 'Missing Request fields.')
    const error = await sendLogs(makeLog(), false).catch(
      (error: unknown) => error
    )
    expect(error).not.toBeInstanceOf(LogsClockError)
    expect((error as Error).message).toContain('returned status 400')
  })
})
