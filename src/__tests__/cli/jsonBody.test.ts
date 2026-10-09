import { describe, expect, it } from '@jest/globals'
import { Readable } from 'stream'

import { readJsonBody } from '../../cli/engine/json'
import { thrown } from '../../util/fake/thrownEngineError'

/** A request-shaped stream carrying `text`, with whatever headers it needs. */
function makeRequest(text: string, headers: Record<string, string> = {}): any {
  const stream: any = Readable.from([Buffer.from(text, 'utf8')])
  stream.headers = headers
  return stream
}

/** The `code` an engineError carries. */
async function codeOf(fn: () => Promise<unknown>): Promise<string> {
  return (await thrown(fn)).code
}

describe('readJsonBody', () => {
  it('parses a JSON object', async () => {
    const body = await readJsonBody(makeRequest('{"walletId":"abc"}'))
    expect(body).toStrictEqual({ walletId: 'abc' })
  })

  it('answers an empty body with undefined', async () => {
    // Not an error: a POST with no body is how `engine-stop` is called.
    expect(await readJsonBody(makeRequest(''))).toBeUndefined()
  })

  it('refuses invalid JSON with BAD_REQUEST', async () => {
    expect(await codeOf(async () => await readJsonBody(makeRequest('{')))).toBe(
      'BAD_REQUEST'
    )
  })

  it('refuses an oversized content-length before reading anything', async () => {
    // The pre-check exists so a declared-huge upload is refused without
    // being buffered.
    expect(
      await codeOf(
        async () =>
          await readJsonBody(
            makeRequest('{}', { 'content-length': String(8 * 1024 * 1024) })
          )
      )
    ).toBe('PAYLOAD_TOO_LARGE')
  })

  it('refuses a stream that outgrows the cap even when content-length lies', async () => {
    const big = `{"x":"${'a'.repeat(5 * 1024 * 1024)}"}`
    expect(
      await codeOf(
        async () =>
          await readJsonBody(makeRequest(big, { 'content-length': '2' }))
      )
    ).toBe('PAYLOAD_TOO_LARGE')
  })

  it('accepts a body with no content-length at all', async () => {
    const body = await readJsonBody(makeRequest('{"ok":true}'))
    expect(body).toStrictEqual({ ok: true })
  })
})
