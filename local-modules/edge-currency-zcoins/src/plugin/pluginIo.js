// @flow

import { type EdgeIo } from 'edge-core-js/types'
import { type Subscriber, bridgifyObject, emit, onMethod } from 'yaob'

export type FetchJson = (uri: string, opts?: Object) => Promise<Object>
export type FetchText = (uri: string, opts?: Object) => Promise<string>

export type EdgeSecp256k1 = {
  publicKeyCreate: (
    privateKey: Uint8Array,
    compressed: boolean
  ) => Promise<string>,
  privateKeyTweakAdd: (
    privateKey: Uint8Array,
    tweak: Uint8Array
  ) => Promise<Uint8Array>,
  publicKeyTweakAdd: (
    publicKey: Uint8Array,
    tweak: Uint8Array,
    compressed: boolean
  ) => Promise<Uint8Array>
}

export type EdgePbkdf2 = {
  deriveAsync: (
    key: Uint8Array,
    salt: Uint8Array,
    iter: number,
    len: number,
    algo: string
  ) => Promise<Uint8Array>
}

/**
 * Wrapper for TCP sockets with event & method names based on WebSocket.
 */
export type EdgeSocket = {
  +on: Subscriber<{
    close: void, // The socket is closed for any reason.
    error: any, // An network error occurred.
    message: string, // The socket has received data.
    open: void // The socket is opened.
  }>,

  /**
   * Connects to a server & resolves when finished.
   * Must only be called once.
   */
  connect(): Promise<mixed>,

  /**
   * Transmits data to the server. Must only be called on open sockets.
   */
  send(data: string): Promise<mixed>,

  /**
   * Shuts down the socket. No other methods are callable after this.
   */
  close(): Promise<mixed>
}

export type EdgeSocketOptions = {
  host: string,
  port?: number,
  type: 'tcp' | 'tls'
}

/**
 * Wraps a Node-style socket into an EdgeSocket.
 */
export function makeEdgeSocket (
  socket: net$Socket,
  opts: EdgeSocketOptions
): EdgeSocket {
  const out: EdgeSocket = {
    on: onMethod,

    async connect (): Promise<mixed> {
      socket.setEncoding('utf8')
      socket.on('close', (hadError: boolean) => emit(out, 'close'))
      socket.on('error', (error: Error) => emit(out, 'error', error))
      socket.on('data', (data: string) => emit(out, 'message', String(data)))
      socket.on('connect', () => emit(out, 'open'))
      socket.connect({ host: opts.host, port: opts.port })
    },

    send (data: string) {
      socket.write(data, 'utf8')
      return Promise.resolve()
    },

    close () {
      socket.destroy()
      return Promise.resolve()
    }
  }
  bridgifyObject(out)
  return out
}

export function makeFetchJson (io: EdgeIo | typeof window): FetchJson {
  return function fetchJson (uri, opts) {
    return io.fetch(uri, opts).then(reply => {
      if (!reply.ok) {
        throw new Error(`Error ${reply.status} while fetching ${uri}`)
      }
      return reply.json()
    })
  }
}

export function makeFetchText (io: EdgeIo | typeof window): FetchText {
  return function fetchText (uri, opts) {
    return io.fetch(uri, opts).then(reply => {
      if (!reply.ok) {
        throw new Error(`Error ${reply.status} while fetching ${uri}`)
      }
      return reply.text()
    })
  }
}

/**
 * The extra things we need to add to the EdgeIo object.
 */
export type ExtraIo = {
  +fetchJson: FetchJson,
  +fetchText: FetchText,
  +secp256k1?: EdgeSecp256k1,
  +pbkdf2?: EdgePbkdf2,
  sigmaMint(denomination: number, privateKey: number[], index: number): Promise<any>,
  sigmaSpend(denomination: number, privateKey: number[], index: number, anonymitySet: string[], groupId: number, blockHash: string, txHash: string): Promise<any>,
  makeSocket(opts: EdgeSocketOptions): Promise<EdgeSocket>
}

/**
 * The IO object this plugin uses internally.
 */
export type PluginIo = EdgeIo & ExtraIo
