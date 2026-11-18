import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import {
  BACK_SETTLE_MS,
  makePluginBackHistory
} from '../../components/navigation/pluginBackHistory'

const DEEP_LINK = 'https://app.dfx.swiss/buy?blockchain=Monero&amount-in=500'
const LOGIN = 'https://app.dfx.swiss/login'
const EMAIL = 'https://app.dfx.swiss/login/mail'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('makePluginBackHistory', () => {
  it('leaves the scene when the webview has no history', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation(LOGIN, false)

    expect(history.pressBack()).toBe(false)
  })

  it('leaves the scene when going back bounces off a redirect', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    // DFX redirects its deep link to its login page:
    history.onNavigation(DEEP_LINK, false)
    history.onNavigation(LOGIN, true)

    expect(history.pressBack()).toBe(true)
    history.onNavigation(DEEP_LINK, false)
    history.onNavigation(LOGIN, true)
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).toHaveBeenCalledTimes(1)
  })

  it('leaves the scene when going back changes nothing', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation(LOGIN, true)

    expect(history.pressBack()).toBe(true)
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).toHaveBeenCalledTimes(1)
  })

  it('stays when going back reaches an earlier page', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation(LOGIN, true)
    history.onNavigation(EMAIL, true)

    expect(history.pressBack()).toBe(true)
    history.onNavigation(LOGIN, true)
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).not.toHaveBeenCalled()
  })

  it('treats a page that differs only in its query as the same page', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation(`${LOGIN}?redirect=buy`, true)

    history.pressBack()
    history.onNavigation(`${LOGIN}?redirect=buy&t=1`, true)
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).toHaveBeenCalledTimes(1)
  })

  it('tells hash-routed pages apart', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation('https://plugin.example/#/amount', true)

    history.pressBack()
    history.onNavigation('https://plugin.example/#/start', true)
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).not.toHaveBeenCalled()
  })

  it('does not leave once cancelled, as when the scene blurs', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation(LOGIN, true)

    history.pressBack()
    history.cancel()
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).not.toHaveBeenCalled()
  })

  it('checks a repeated press only once', () => {
    const leave = jest.fn()
    const history = makePluginBackHistory(leave)
    history.onNavigation(LOGIN, true)

    history.pressBack()
    history.pressBack()
    jest.advanceTimersByTime(BACK_SETTLE_MS)

    expect(leave).toHaveBeenCalledTimes(1)
  })
})
