import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import type * as Logger from '../util/logger'

jest.mock('../config', () => ({
  CONFIG: { LOG_SERVER: { host: 'http://localhost', port: '9999' } }
}))

describe('logToServer', () => {
  const realConsoleError = console.error
  const realConsoleLog = console.log
  const realFetch = global.fetch

  beforeEach(() => {
    // @ts-expect-error - global.clog is injected at runtime
    global.clog = jest.fn()
  })

  afterEach(() => {
    console.error = realConsoleError
    console.log = realConsoleLog
    global.fetch = realFetch
    // @ts-expect-error - global.clog is injected at runtime
    delete global.clog
  })

  it('sends one request per line when the server is unreachable', async () => {
    const fetchMock = jest.fn(async () => {
      throw new TypeError('Network request failed')
    })
    global.fetch = fetchMock as unknown as typeof fetch

    // Redirect the console the way src/app.ts does when LOG_SERVER is set.
    // Metro's inline requires load the logger on the first redirected call,
    // so the logger is loaded after the redirect here too:
    let logToServer: typeof Logger.logToServer | undefined
    console.error = (...args: unknown[]) => {
      logToServer ??=
        jest.requireActual<typeof Logger>('../util/logger').logToServer
      logToServer(args)
    }
    console.log = console.error

    console.log('hello')
    for (let i = 0; i < 10; i++) await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
