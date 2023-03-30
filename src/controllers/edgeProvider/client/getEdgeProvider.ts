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
  edgeProviderBridge: {
    postReturn: (message: unknown) => void
  }
  ReactNativeWebView: {
    postMessage: (message: string) => void
  }
}

// ---------------------------------------------------------------------
// JSON-RPC bridge logic
// ---------------------------------------------------------------------

export function getEdgeProvider(): Promise<EdgeProvider> {
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

  // Make an initial call to both connect with the other side and
  // load the promo data:
  return out.getDeepLink().then(deepLink => {
    out.deepPath = deepLink.deepPath
    out.deepQuery = deepLink.deepQuery
    out.promoCode = deepLink.promoCode
    return out
  })
}
