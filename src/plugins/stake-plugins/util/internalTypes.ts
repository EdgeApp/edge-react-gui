import { asNumber, asObject, Cleaner } from 'cleaners'
import { JsonObject } from 'edge-core-js'

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

// -----------------------------------------------------------------------------
// Partial options that Core would normall pass as EdgeCorePluginOptions
// -----------------------------------------------------------------------------
export interface EdgeGuiPluginOptions {
  initOptions: JsonObject
}
