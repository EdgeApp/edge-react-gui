// @flow
// The native code will use this file to set up the IO object
// before sending it across the bridge to the core side.

import { pbkdf2, secp256k1 } from 'react-native-fast-crypto'
import { Socket } from 'react-native-tcp'
import { bridgifyObject } from 'yaob'

import {
  type EdgeSocket,
  type EdgeSocketOptions,
  type ExtraIo,
  makeEdgeSocket,
  makeFetchJson,
  makeFetchText
} from './plugin/pluginIo.js'

export default function makeCustomIo (): ExtraIo {
  bridgifyObject(pbkdf2)
  bridgifyObject(secp256k1)

  return {
    fetchJson: makeFetchJson(window),
    fetchText: makeFetchText(window),
    pbkdf2,
    secp256k1,
    makeSocket (opts: EdgeSocketOptions): Promise<EdgeSocket> {
      let socket: net$Socket
      if (opts.type === 'tcp') socket = new Socket()
      else if (opts.type === 'tls') throw new Error('No TLS support')
      else throw new Error('Unsupported socket type')

      return Promise.resolve(makeEdgeSocket(socket, opts))
    }
  }
}
