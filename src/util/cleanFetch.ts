import {
  asCodec,
  asObject,
  asString,
  type Cleaner,
  type CleanerShape,
  uncleaner
} from 'cleaners'
import deepmerge from 'deepmerge'

export interface FetchSchema<RequestPayload, ResponsePayload> {
  /**
   * This is the request payload cleaner type.
   *
   * It is optional because the type maybe defined exclusively as a static type.
   */
  asRequest?: Cleaner<RequestPayload | undefined>
  /**
   * This is the response payload cleaner type. It will be used to clean the
   * response data from the fetch response
   */
  asResponse: Cleaner<ResponsePayload>
  /**
   * This is the fetch options to include with every request. It is identical
   * to the options parameter for standard `fetch`. Options will be deep-merged
   * with the options passed to the fetcher function.
   */
  options?: RequestInit
  /**
   * Used to define the URL to fetch from. It can be a `URL` object or a function
   * which derives the `URL` from the {@link FetchInput}.
   *
   * A function allows the URL to be derived from the request payload for
   * use in the URL's query parameters. In addition, the resource function can
   * extend the endpoint from {@link FetchInput}.
   */
  resource: URL | ((input: FetchInput<RequestPayload>) => URL | undefined)
}
export type FetchInput<RequestPayload> = RequestInit & {
  /**
   * This is the endpoint to fetch from.
   *
   * It is optional because it can be defined by the {@link FetchSchema} via
   * the `resource` (see {@link FetchSchema['resource']}).
   */
  endpoint?: URL
  /**
   * This is the request payload body to send with the request.
   *
   * It is optional because it can be defined by the {@link FetchSchema} via
   * the `asRequest` cleaner (see {@link FetchSchema['asRequest']}).
   */
  payload?: RequestPayload
}

/**
 * A fetcher function that can be used to fetch data from a given URL.
 * It is designed to be an identical API to the standard `fetch` function.
 * In addition to the standard `fetch` options, the fetcher function accepts
 * an `endpoint` and `payload` property.
 *
 * The `endpoint` property is a standard `URL` object. This allows for the
 * caller to control the URL of the request.
 *
 * The `payload` property is the request payload body in the expected type
 * defined by the {@link FetchSchema}.
 *
 * @param input - The input to the fetcher.
 * @returns A promise that resolves to the response payload.
 */
export type Fetcher<RequestPayload, ResponsePayload> = (
  input?: FetchInput<RequestPayload>
) => Promise<ResponsePayload>

/**
 * Creates a fetcher function that can be used to fetch data from a given URL.
 * The fetcher function will automatically handle the request and response payloads,
 * and will throw an error if the response is not valid.
 *
 * @param schema - The {@link FetchSchema} to use for the fetcher.
 * @returns A {@link Fetcher} function that can be used to fetch data from a given URL.
 */
export function cleanFetch<RequestPayload, ResponsePayload>(
  schema: FetchSchema<RequestPayload, ResponsePayload>
): Fetcher<RequestPayload, ResponsePayload> {
  const { asRequest, asResponse, resource } = schema
  const wasRequest = asRequest ? uncleaner(asRequest) : (r: unknown) => r

  const fetcher = async (
    input?: FetchInput<RequestPayload>
  ): Promise<ResponsePayload> => {
    const url =
      typeof resource === 'function' ? resource(input ?? {}) : resource
    if (url == null) throw new Error(`Missing resource identifier (URL)`)
    const request = wasRequest(input?.payload)

    const options = deepmerge(schema.options ?? {}, {
      ...input,
      ...(request != null ? { body: request } : {})
    })
    const fetchResponse = await fetch(url, options)

    if (!fetchResponse.ok) {
      const message = await fetchResponse.text()
      throw new Error(
        `${String(url)} ${fetchResponse.status}${message ? `: ${message}` : ''}`
      )
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
    return await fetcher(
      finalInput == null ? input : deepmerge(input, finalInput)
    )
  }
}

/**
 * Creates a cleaner that converts a URLSearchParams object to a given object
 * shape. It is a codec cleaner so it can be uncleaned to get the original
 * search params string.
 *
 * @param shape The object shape for the parameters.
 * @returns A cleaner that converts a URLSearchParams object to a given object
 * shape.
 */
export const asSearchParams = <T extends object>(
  shape: CleanerShape<T>
): Cleaner<T> =>
  asCodec<T>(
    (v: unknown): T => {
      const search = new URLSearchParams(asString(v))
      const obj: Record<string, string | string[]> = {}
      for (const [key, value] of search) {
        if (obj[key] == null) {
          obj[key] = value
        } else {
          obj[key] = [obj[key]].flat().concat(value)
        }
      }
      return asObject<T>({ ...shape })(obj)
    },
    params => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        query.set(key, value)
      })

      return query.toString()
    }
  )
