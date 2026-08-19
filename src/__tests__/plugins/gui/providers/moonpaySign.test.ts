import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { ENV } from '../../../../env'
import {
  fetchMoonpayInterstitialUrl,
  signMoonpayUrl
} from '../../../../plugins/gui/providers/moonpaySign'
import { fetchInfo, fetchWaterfall } from '../../../../util/network'

jest.mock('../../../../util/network', () => ({
  fetchInfo: jest.fn(),
  fetchWaterfall: jest.fn()
}))

jest.mock('../../../../env', () => ({
  ENV: { MOONPAY_RELAY_CHECK_SIGN_PROXY: undefined }
}))

const mockedFetchInfo = fetchInfo as jest.MockedFunction<typeof fetchInfo>
const mockedFetchWaterfall = fetchWaterfall as jest.MockedFunction<
  typeof fetchWaterfall
>

const widgetUrl = 'https://buy.moonpay.com/?apiKey=pk_live_key'

const jsonResponse = (body: unknown, ok: boolean = true): any => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body
})

describe('signMoonpayUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ENV.MOONPAY_RELAY_CHECK_SIGN_PROXY = undefined
  })

  it('posts the url and returns the signed url', async () => {
    mockedFetchInfo.mockResolvedValue(
      jsonResponse({ signedUrl: 'https://buy.moonpay.com/?signed=1' })
    )
    const result = await signMoonpayUrl(widgetUrl)
    expect(result).toBe('https://buy.moonpay.com/?signed=1')
    const [path, options] = mockedFetchInfo.mock.calls[0]
    expect(path).toBe('v1/moonpay/signUrl')
    expect(JSON.parse(options?.body as string)).toEqual({ url: widgetUrl })
  })

  it('throws the signing error on a non-OK response', async () => {
    mockedFetchInfo.mockResolvedValue(jsonResponse({}, false))
    await expect(signMoonpayUrl(widgetUrl)).rejects.toThrow(
      'Moonpay URL signing failed: 500'
    )
  })
})

describe('fetchMoonpayInterstitialUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ENV.MOONPAY_RELAY_CHECK_SIGN_PROXY = undefined
  })

  it('posts relayCheck: true and returns the interstitial url', async () => {
    mockedFetchInfo.mockResolvedValue(
      jsonResponse({
        interstitialUrl: 'https://info1.edge.app/v1/moonpay/relayCheck?token=t'
      })
    )
    const result = await fetchMoonpayInterstitialUrl(widgetUrl)
    expect(result).toBe('https://info1.edge.app/v1/moonpay/relayCheck?token=t')
    const [path, options] = mockedFetchInfo.mock.calls[0]
    expect(path).toBe('v1/moonpay/signUrl')
    expect(JSON.parse(options?.body as string)).toEqual({
      url: widgetUrl,
      relayCheck: true
    })
    expect(mockedFetchWaterfall).not.toHaveBeenCalled()
  })

  it('throws on an empty interstitial url so the caller falls back to bound signing', async () => {
    mockedFetchInfo.mockResolvedValue(jsonResponse({ interstitialUrl: '' }))
    await expect(fetchMoonpayInterstitialUrl(widgetUrl)).rejects.toThrow(
      'empty interstitial URL'
    )
  })

  it('throws the relay-check error on a non-OK response', async () => {
    mockedFetchInfo.mockResolvedValue(jsonResponse({}, false))
    await expect(fetchMoonpayInterstitialUrl(widgetUrl)).rejects.toThrow(
      'Moonpay relay check failed: 500'
    )
  })

  it('routes through the trimmed dev sign proxy with the same timeout', async () => {
    ENV.MOONPAY_RELAY_CHECK_SIGN_PROXY = 'http://192.0.2.10:8009/'
    mockedFetchWaterfall.mockResolvedValue(
      jsonResponse({ interstitialUrl: 'http://192.0.2.10:8009/v1/x' })
    )
    const result = await fetchMoonpayInterstitialUrl(widgetUrl)
    expect(result).toBe('http://192.0.2.10:8009/v1/x')
    const [servers, path, , timeout] = mockedFetchWaterfall.mock.calls[0]
    expect(servers).toEqual(['http://192.0.2.10:8009'])
    expect(path).toBe('v1/moonpay/signUrl')
    expect(timeout).toBe(10000)
    expect(mockedFetchInfo).not.toHaveBeenCalled()
  })
})
