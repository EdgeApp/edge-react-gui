import { afterEach, describe, expect, it } from '@jest/globals'

import { fetchDfx } from '../../../plugins/ramps/dfx/dfxApi'
import { RampIpCountryError } from '../../../types/RampIpCountryError'
import {
  installFakeFetch,
  makeTextResponse
} from '../../../util/fake/fakeFetch'

let fakeFetch: ReturnType<typeof installFakeFetch> | undefined

afterEach(() => {
  fakeFetch?.restore()
  fakeFetch = undefined
})

/** Fetches a DFX path that fails with this response, and returns the error. */
async function failingFetch(
  path: string,
  response: Response
): Promise<unknown> {
  fakeFetch = installFakeFetch(() => response)
  return await fetchDfx(path).then(
    () => new Error('The fetch succeeded'),
    (error: unknown) => error
  )
}

describe('fetchDfx', () => {
  it("names the path, the status and DFX's own message", async () => {
    const error = await failingFetch(
      '/auth',
      makeTextResponse(403, {
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden'
      })
    )

    expect(error).toMatchObject({ message: '/auth returned 403: Forbidden' })
  })

  it('keeps query strings, which can hold the address, out of the error', async () => {
    const error = await failingFetch(
      '/auth/signMessage?address=bc1qaddress',
      makeTextResponse(404, {
        statusCode: 404,
        message: 'Cannot GET /v1/auth/signMessage?address=bc1qaddress',
        error: 'Not Found'
      })
    )

    expect(error).toMatchObject({
      message:
        '/auth/signMessage returned 404: Cannot GET /v1/auth/signMessage?…'
    })
  })

  it('leaves out a body that is not a DFX error', async () => {
    const error = await failingFetch('/sell/42', {
      ok: false,
      status: 502,
      text: async () => '<html><body>Bad gateway</body></html>'
    } as unknown as Response)

    expect(error).toMatchObject({ message: '/sell/42 returned 502' })
  })

  it("caps DFX's message", async () => {
    const error = await failingFetch(
      '/sell/quote',
      makeTextResponse(400, { statusCode: 400, message: ['x'.repeat(500)] })
    )

    expect(error).toMatchObject({
      message: `/sell/quote returned 400: ${'x'.repeat(200)}`
    })
  })

  it('still tells a blocked country apart', async () => {
    const error = await failingFetch(
      '/auth',
      makeTextResponse(403, {
        statusCode: 403,
        message: 'The country of IP address is not allowed',
        error: 'Forbidden'
      })
    )

    expect(error).toBeInstanceOf(RampIpCountryError)
  })
})
