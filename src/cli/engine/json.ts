/**
 * JSON helpers for the engine REST API.
 * Uint8Array -> base64, Map -> object.
 */
import { base64 } from 'rfc4648'

import type { EngineError } from './errors'
import { engineError } from './errors'

/**
 * Encode the values core hands back that JSON cannot carry.
 *
 * No `Date` arm: `JSON.stringify` calls `Date.prototype.toJSON` *before* the
 * replacer, so a replacer is handed the ISO string and can never see the
 * Date. The output is the same either way, which is why the arm went
 * unnoticed.
 */
export function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    // `rfc4648`, not `Buffer`: this is the engine's response serializer, so
    // every Uint8Array the API returns goes through it.
    return base64.stringify(value)
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
const MAX_BODY_BYTES = 4 * 1024 * 1024

function tooLarge(): EngineError {
  return engineError(
    'PAYLOAD_TOO_LARGE',
    `Request body exceeds ${MAX_BODY_BYTES} bytes`,
    413
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
    throw engineError('BAD_REQUEST', 'Invalid JSON body', 400)
  }
}
