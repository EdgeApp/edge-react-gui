import { asNumber, asObject, Cleaner } from 'cleaners'

// -----------------------------------------------------------------------------
// Info Server Response
// -----------------------------------------------------------------------------

export interface InfoServerResponse {
  policies: { [key: string]: number }
}

// -----------------------------------------------------------------------------
// Cleaners
// -----------------------------------------------------------------------------
export const asInfoServerResponse: Cleaner<InfoServerResponse> = asObject({
  policies: asObject(asNumber)
})
