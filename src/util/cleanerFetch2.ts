import { Cleaner, uncleaner } from 'cleaners'

interface FetchInit<Req, Res> {
  asReq?: Cleaner<Req | undefined>
  asRes: Cleaner<Res>
  method?: 'GET' | 'POST'
}
type FetchInitWithUri<Req, Res> = { uri: string } & FetchInit<Req, Res>
interface FetchInput<Req> {
  uri?: string
  req?: Req
}
type FetchInputWithUri<Req> = { uri: string } & FetchInput<Req>

type FetcherWithUri<Req, Res> = (input: FetchInputWithUri<Req>) => Promise<Res>
type Fetcher<Req, Res> = (input?: FetchInput<Req>) => Promise<Res>

export function cleanFetch<Req, Res>(init: FetchInitWithUri<Req, Res>): (input?: FetchInput<Req>) => Promise<Res>
export function cleanFetch<Req, Res>(init: FetchInit<Req, Res>): (input: FetchInputWithUri<Req>) => Promise<Res>
export function cleanFetch<Req, Res>(init: FetchInit<Req, Res> | FetchInitWithUri<Req, Res>): FetcherWithUri<Req, Res> | Fetcher<Req, Res> {
  const { asReq, asRes } = init
  const wasReq = asReq ? uncleaner(asReq) : (r: unknown) => r

  const fetcher = async (input: FetchInputWithUri<Req>): Promise<Res> => {
    const { uri, req } = input ?? {}
    const request = wasReq(req)
    const response = await fetch(uri, {
      method: init.method,
      body: request
    })
    return asRes(await response.text())
  }

  if ('uri' in init) {
    return async (input?: FetchInput<Req>): Promise<Res> => {
      return await fetcher({ uri: init.uri, ...input })
    }
  }

  return fetcher
}
