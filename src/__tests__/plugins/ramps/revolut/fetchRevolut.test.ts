import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { fetchRevolutRedirectUrl } from '../../../../plugins/ramps/revolut/util/fetchRevolut'

const returnUrl =
  'https://return.edge.app/fiatprovider/buy/revolut?transactionStatus=success'
const orderId = '00000000-0000-4000-8000-000000000000'

describe('fetchRevolutRedirectUrl', function () {
  const originalFetch = global.fetch

  afterEach(function () {
    global.fetch = originalFetch
  })

  it('sends the partner redirect URL encoded exactly once', async function () {
    const fetchMock = jest.fn(
      async (_input: string, _init?: RequestInit) =>
        new Response(
          JSON.stringify({ ramp_redirect_url: 'https://ramp.revolut.com/' })
        )
    )
    global.fetch = fetchMock as unknown as typeof fetch

    await fetchRevolutRedirectUrl(
      {
        fiat: 'EUR',
        amount: 50,
        crypto: 'BTC',
        payment: 'card',
        region: 'DE',
        wallet: 'bc1qexample',
        partnerRedirectUrl: returnUrl,
        orderId
      },
      { apiKey: 'key', baseUrl: 'https://ramp-partners.revolut.com' }
    )

    const requestUrl = new URL(fetchMock.mock.calls[0][0])
    // Revolut appends `&orderId=` to this value and redirects to it, so a
    // second encoding layer leaves it unparseable and the success deep link
    // never reaches the app:
    expect(requestUrl.searchParams.get('partnerRedirectUrl')).toBe(returnUrl)
    expect(requestUrl.searchParams.get('orderId')).toBe(orderId)
  })
})
