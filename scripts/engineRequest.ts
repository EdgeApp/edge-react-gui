/**
 * One raw HTTP client for the test scripts.
 *
 * `testCliCaptcha` and `testEdgeLogin` each carried a byte-identical
 * forty-line copy of this, and `testCli` a third variant. They need the raw
 * status and body — `ApiClient` throws on a 4xx, which is exactly what these
 * scripts are asserting — so they cannot simply use the client; one copy
 * here is the next best thing.
 */
import http from 'http'

export interface RawResponse {
  status: number
  json: any
}

export async function engineRequest(
  socketPath: string,
  method: string,
  urlPath: string,
  body?: unknown
): Promise<RawResponse> {
  const payload =
    body === undefined ? undefined : Buffer.from(JSON.stringify(body))
  return await new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        path: urlPath,
        socketPath,
        headers: {
          Accept: 'application/json',
          ...(payload != null
            ? {
                'Content-Type': 'application/json',
                'Content-Length': String(payload.length)
              }
            : {})
        }
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          resolve({
            status: res.statusCode ?? 0,
            json: raw === '' ? undefined : JSON.parse(raw)
          })
        })
      }
    )
    req.on('error', reject)
    if (payload != null) req.write(payload)
    req.end()
  })
}
