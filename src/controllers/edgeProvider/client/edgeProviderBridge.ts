/* eslint-disable @typescript-eslint/promise-function-async */

import { asNumber, uncleaner } from 'cleaners'

import { methodCleaners } from '../types/edgeProviderCleaners'
import type { EdgeProvider } from '../types/edgeProviderTypes'
import { asRpcReturn, RpcCall } from '../types/jsonRpcCleaners'
import { makePendingList } from './pendingList'

// ---------------------------------------------------------------------
// WebView global variables
// ---------------------------------------------------------------------

declare const window: {
  edgeProvider: EdgeProvider
  edgeProviderBridge: {
    postReturn: (message: unknown) => void
  }
  ReactNativeWebView: {
    postMessage: (message: string) => void
  }
}

declare class Event {
  constructor(type: string)
  type: string
}

declare const document: {
  dispatchEvent: (event: Event) => void
}

// ---------------------------------------------------------------------
// JSON-RPC bridge logic
// ---------------------------------------------------------------------

function makeEdgeProvider(): EdgeProvider {
  const pendingCalls = makePendingList()

  // Handle return messages from the GUI:
  window.edgeProviderBridge = {
    postReturn(message) {
      try {
        const clean = asRpcReturn(message)
        const id = asNumber(clean.id)

        const { resolve, reject } = pendingCalls.grab(id)
        if (clean.error != null) {
          reject(new Error(clean.error.message))
        } else {
          resolve(clean.result)
        }
      } catch (error) {
        console.error('JSON-RPC failed:', error)
      }
    }
  }

  // Build method wrappers:
  const out: EdgeProvider = {} as any
  for (const key of Object.keys(methodCleaners) as Array<keyof typeof methodCleaners>) {
    const cleaners = methodCleaners[key]
    if (cleaners == null) continue

    const { asParams, asReturn } = cleaners
    const wasParams = uncleaner<any>(asParams)
    out[key] = function edgeProviderMethod(...params: unknown[]): Promise<any> {
      return new Promise((resolve, reject) => {
        const id = pendingCalls.add({
          resolve(value) {
            resolve(asReturn(value))
          },
          reject
        })
        const call: RpcCall = {
          id,
          jsonrpc: '2.0',
          method: key,
          params: wasParams(params)
        }
        window.ReactNativeWebView.postMessage(JSON.stringify(call))
      })
    }
  }
  return out
}

// ---------------------------------------------------------------------
// Start-up logic
// ---------------------------------------------------------------------

// The WebView sometimes executes this script more than once,
// but we only want one bridge to exist:
if (window.edgeProviderBridge == null) {
  const edgeProvider = makeEdgeProvider()

  // Make an initial call to both connect with the other side and
  // load the promo data:
  edgeProvider
    .getDeepLink()
    .then(deepLink => {
      edgeProvider.deepPath = deepLink.deepPath
      edgeProvider.deepQuery = deepLink.deepQuery
      edgeProvider.promoCode = deepLink.promoCode

      // Tell the world:
      window.edgeProvider = edgeProvider
      document.dispatchEvent(new Event('edgeProviderReady'))
    })
    // Use console logging because this exists in a web-view without access to RN
    .catch(err => console.error(err))
}
