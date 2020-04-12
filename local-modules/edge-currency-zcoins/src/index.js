// @flow

import { Socket } from 'net'
import { TLSSocket } from 'tls'

import { crypto } from 'bcoin'
import { type EdgeIo } from 'edge-core-js/types'

import { makeEdgeCorePlugins } from './plugin/currencyPlugin.js'
import {
  type EdgeSocket,
  type EdgeSocketOptions,
  type PluginIo,
  makeEdgeSocket,
  makeFetchJson,
  makeFetchText
} from './plugin/pluginIo.js'

export function makeNodeIo (io: EdgeIo): PluginIo {
  const { secp256k1, pbkdf2 } = crypto
  return {
    ...io,
    fetchJson: makeFetchJson(io),
    fetchText: makeFetchText(io),
    pbkdf2,
    secp256k1,
    makeSocket (opts: EdgeSocketOptions): Promise<EdgeSocket> {
      let socket: net$Socket
      if (opts.type === 'tcp') socket = new Socket()
      else if (opts.type === 'tls') socket = new TLSSocket(new Socket())
      else throw new Error('Unsupported socket type')

      return Promise.resolve(makeEdgeSocket(socket, opts))
    }
  }
}

const edgeCorePlugins = makeEdgeCorePlugins(opts => makeNodeIo(opts.io))

export default edgeCorePlugins
