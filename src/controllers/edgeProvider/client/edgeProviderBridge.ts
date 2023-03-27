import type { EdgeProvider } from '../types/edgeProviderTypes'
import { getEdgeProvider } from './getEdgeProvider'

// ---------------------------------------------------------------------
// WebView global variables
// ---------------------------------------------------------------------

declare const window: {
  edgeProvider: EdgeProvider
}

declare class Event {
  constructor(type: string)
  type: string
}

declare const document: {
  dispatchEvent: (event: Event) => void
}

// ---------------------------------------------------------------------
// Start-up logic
// ---------------------------------------------------------------------

getEdgeProvider().then(edgeProvider => {
  window.edgeProvider = edgeProvider
  document.dispatchEvent(new Event('edgeProviderReady'))
})
