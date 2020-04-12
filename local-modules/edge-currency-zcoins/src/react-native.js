// @flow

import 'regenerator-runtime/runtime'

import { type EdgeCorePluginOptions } from 'edge-core-js/types'

import { makeEdgeCorePlugins } from './plugin/currencyPlugin.js'

window.addEdgeCorePlugins(
  makeEdgeCorePlugins((opts: EdgeCorePluginOptions) => {
    const nativeIo = opts.nativeIo['edge-currency-zcoins']
    if (nativeIo == null) {
      throw new Error('React Native Bitcoin IO object not loaded')
    }

    const { fetchJson, fetchText, pbkdf2, secp256k1, makeSocket, sigmaMint, sigmaSpend } = nativeIo
    return { ...opts.io, fetchJson, fetchText, pbkdf2, secp256k1, makeSocket, sigmaMint, sigmaSpend }
  })
)
