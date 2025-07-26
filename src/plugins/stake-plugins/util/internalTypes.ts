import { asNumber, asObject, type Cleaner } from 'cleaners'
import type { JsonObject } from 'edge-core-js'

// -----------------------------------------------------------------------------
// Info Server Response
// -----------------------------------------------------------------------------

export interface InfoServerResponse {
  policies: Record<string, number>
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
