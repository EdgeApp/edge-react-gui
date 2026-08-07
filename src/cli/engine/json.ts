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

export async function readJsonBody(
  req: NodeJS.ReadableStream & {
    headers?: Record<string, string | string[] | undefined>
  }
): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
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
