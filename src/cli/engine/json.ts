/**
 * JSON helpers for the engine REST API.
 * Uint8Array -> base64, Date -> ISO-8601, Map -> object.
 */

export function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64')
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of value.entries()) {
      obj[String(k)] = v
    }
    return obj
  }
  return value
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, jsonReplacer)
}

/** Nothing the REST API accepts is anywhere near this large. */
export const MAX_BODY_BYTES = 4 * 1024 * 1024

function tooLarge(): Error {
  return Object.assign(
    new Error(`Request body exceeds ${MAX_BODY_BYTES} bytes`),
    { code: 'PAYLOAD_TOO_LARGE', status: 413 }
  )
}

export async function readJsonBody(
  req: NodeJS.ReadableStream & {
    headers?: Record<string, string | string[] | undefined>
  }
): Promise<unknown> {
  const declared = Number(req.headers?.['content-length'] ?? '0')
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw tooLarge()

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > MAX_BODY_BYTES) throw tooLarge()
    chunks.push(buf)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw === '') return undefined
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), {
      code: 'BAD_REQUEST',
      status: 400
    })
  }
}
