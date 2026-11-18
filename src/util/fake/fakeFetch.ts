/** One request a fake fetch received, with its JSON body parsed. */
export interface FakeFetchCall {
  url: string
  method?: string
  body?: unknown
}

/** A fetch Response with the parts API helpers read: ok, status and text. */
export const makeTextResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

/**
 * Replaces the global fetch with `respond`, recording each request in
 * `calls`. `restore` puts the real fetch back.
 */
export function installFakeFetch(
  respond: (call: FakeFetchCall) => Response | Promise<Response>
): { calls: FakeFetchCall[]; restore: () => void } {
  const realFetch = global.fetch
  const calls: FakeFetchCall[] = []
  global.fetch = (async (input: unknown, init?: RequestInit) => {
    const call: FakeFetchCall = {
      url: String(input),
      method: init?.method,
      body: init?.body == null ? undefined : JSON.parse(init.body as string)
    }
    calls.push(call)
    return await respond(call)
  }) as typeof fetch
  return {
    calls,
    restore: () => {
      global.fetch = realFetch
    }
  }
}
