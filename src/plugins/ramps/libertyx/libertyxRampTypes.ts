import { asObject, asOptional, asString } from 'cleaners'

export interface InitOptions {
  readonly partnerIcon: string
}

export const asInitOptions = asObject<InitOptions>({
  partnerIcon: asOptional(asString, `https://content.edge.app/libertyXlogo.png`)
}).withRest
