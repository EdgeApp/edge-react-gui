import { Cleaner, uncleaner } from 'cleaners'
import deepmerge from 'deepmerge'

// Alias of fetch's first parameter
type URI = RequestInfo

export interface FetchSchema<RequestPayload, ResponsePayload> {
  asRequest?: Cleaner<RequestPayload | undefined>
  asResponse: Cleaner<ResponsePayload>
  options?: RequestInit
  resource: URI | ((input: FetchInput<RequestPayload>) => URI | undefined)
}
export type FetchInput<RequestPayload> = RequestInit & {
  endpoint?: string
  payload?: RequestPayload
}

export type Fetcher<RequestPayload, ResponsePayload> = (input?: FetchInput<RequestPayload>) => Promise<ResponsePayload>

export function cleanFetch<RequestPayload, ResponsePayload>(schema: FetchSchema<RequestPayload, ResponsePayload>): Fetcher<RequestPayload, ResponsePayload> {
  const { asRequest, asResponse, resource } = schema
  const wasRequest = asRequest ? uncleaner(asRequest) : (r: unknown) => r

  const fetcher = async (input?: FetchInput<RequestPayload>): Promise<ResponsePayload> => {
    const uri = typeof resource === 'function' ? resource(input ?? {}) : resource
    if (uri == null) throw new Error(`Missing resource identifier (URI)`)
    const request = wasRequest(input?.payload)

    const options = deepmerge(schema.options ?? {}, {
      ...input,
      ...(request != null ? { body: request } : {})
    })
    const fetchResponse = await fetch(uri, options)

    if (!fetchResponse.ok) {
      const message = await fetchResponse.text()
      throw new Error(`${String(uri)} ${fetchResponse.status}${message ? `: ${message}` : ''}`)
    }

    const responseText = await fetchResponse.text()
    try {
      return asResponse(responseText)
    } catch (error) {
      throw new TypeError(`${String(error)}:\n\n${responseText}`)
    }
  }

  return fetcher
}

/**
 * Extends an existing Fetcher function's input/options with additional fetch
 * options and/or input. It will deep-merge any final fetch input on-top when
 * invoking the fetcher.
 *
 * This allows you to easily create a new fetcher function that closes over
 * some options in scope. It can also extend the input properties (`payload` and
 * `endpoint`) with some default values.
 */
export function fetcherWithOptions<RequestPayload, ResponsePayload>(
  fetcher: Fetcher<RequestPayload, ResponsePayload>,
  input: FetchInput<RequestPayload>
): Fetcher<RequestPayload, ResponsePayload> {
  return async (finalInput?: FetchInput<RequestPayload>) => {
    return await fetcher(finalInput == null ? input : deepmerge(input, finalInput))
  }
}
