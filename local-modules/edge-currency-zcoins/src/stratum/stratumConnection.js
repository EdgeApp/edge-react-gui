// @flow
/* global WebSocket */

import { parse } from 'uri-js'

import { type EdgeSocket, type PluginIo } from '../plugin/pluginIo.js'
import { logger } from '../utils/logger.js'
import { pushUpdate, removeIdFromQueue } from '../utils/updateQueue.js'
import { fetchPing, fetchVersion } from './stratumMessages.js'

export type OnFailHandler = (error: Error) => void

// Timing can vary a little in either direction for fewer wake ups:
const TIMER_SLACK = 500
const KEEP_ALIVE_MS = 60000

/**
 * This is a private type used by the Stratum connection.
 * Use the static task-creator methods to build these.
 */
export interface StratumTask {
  method: string;
  params: Array<any>;
  +onDone: (reply: any, requestMs: number) => void;
  +onFail: OnFailHandler;
}

export interface StratumCallbacks {
  +onOpen: () => void;
  +onClose: (error?: Error) => void;
  +onQueueSpace: (stratumVersion: string) => StratumTask | void;
  +onNotifyHeight: (height: number) => void;
  +onNotifyScriptHash: (scriptHash: string, hash: string) => void;
  +onTimer: (queryTime: number) => void;
  +onVersion: (version: string, requestMs: number) => void;
}

export interface StratumOptions {
  callbacks: StratumCallbacks;
  io: PluginIo;
  queueSize?: number; // defaults to 10
  timeout?: number; // seconds, defaults to 30
  walletId?: string; // for logging purposes
}

type PendingMessage = {
  startTime: number,
  task: StratumTask
}

/**
 * A connection to a Stratum server.
 * Manages the underlying TCP socket, as well as message framing,
 * queue depth, error handling, and so forth.
 */
export class StratumConnection {
  uri: string
  connected: boolean
  version: string | void

  constructor (uri: string, options: StratumOptions) {
    const {
      callbacks,
      io,
      queueSize = 5,
      timeout = 30,
      walletId = ''
    } = options
    this.walletId = walletId
    this.io = io
    this.callbacks = callbacks
    this.queueSize = queueSize
    this.timeout = 1000 * timeout
    this.uri = uri
    this.sigkill = false

    // Message queue:
    this.nextId = 0
    this.pendingMessages = {}

    // Send a version message before anything else:
    this.submitTask(
      fetchVersion(
        (version: string, requestMs: number) => {
          this.version = version
          this.callbacks.onVersion(version, requestMs)
        },
        (error: Error) => {
          logger.info(`${this.walletId} Failed initial ping ${this.uri}`)
          this.handleError(error)
        }
      )
    )
    this.setupTimer()
  }

  /**
   * Activates the underlying TCP connection.
   */
  async open () {
    const { uri, io } = this

    try {
      if (uri.indexOf('electrumws') === 0 || uri.indexOf('electrumwss') === 0) {
        // It's a websocket!
        const server = this.uri
          .replace(/^electrumwss/, 'wss')
          .replace(/^electrumws/, 'ws')
        const socket = new WebSocket(server)
        socket.onclose = event => {
          this.onSocketClose()
        }
        socket.onerror = event => {
          this.error = new Error(JSON.stringify(event))
        }
        socket.onopen = event => {
          this.onSocketConnect()
        }
        socket.onmessage = (event: Object) => {
          this.onSocketData(event.data)
        }
        this.socket = socket
        this.cancelConnect = false
      } else if (
        uri.indexOf('electrum') === 0 ||
        uri.indexOf('electrums') === 0
      ) {
        // It's a TCP!
        const parsed = parse(uri)
        if (
          (parsed.scheme !== 'electrum' && parsed.scheme !== 'electrums') ||
          !parsed.host ||
          !parsed.port
        ) {
          throw new Error('Bad URL')
        }

        // Connect to the server:
        await io
          .makeSocket({
            host: parsed.host,
            port: Number(parsed.port),
            type: parsed.scheme === 'electrum' ? 'tcp' : 'tls'
          })
          .then(socket => {
            socket.on('close', () => this.onSocketClose())
            socket.on('error', (e: Error) => {
              this.error = e
            })
            socket.on('open', () => this.onSocketConnect())
            socket.on('message', (data: string) => this.onSocketData(data))
            this.socket = socket
            this.cancelConnect = false
            return socket.connect()
          })
      } else {
        throw new Error('Wrong URL prefix')
      }
    } catch (e) {
      this.handleError(e)
    }
  }

  wakeUp () {
    pushUpdate({
      id: this.walletId + '==' + this.uri,
      updateFunc: () => {
        this.doWakeUp()
      }
    })
  }

  /**
   * Re-triggers the `onQueueSpace` callback if there is space in the queue.
   */
  doWakeUp () {
    const { connected, version } = this
    if (connected && version != null) {
      while (Object.keys(this.pendingMessages).length < this.queueSize) {
        const task = this.callbacks.onQueueSpace(version)
        if (!task) break
        this.submitTask(task)
      }
    }
  }

  /**
   * Forcefully sends a task to the Stratum server,
   * ignoring the queue checks. This should *only* be used for spends.
   * This will fail if the connection is not connected.
   */
  submitTask (task: StratumTask) {
    // Add the message to the queue:
    const id = ++this.nextId
    const message = { task, startTime: Date.now() }
    this.pendingMessages[id.toString()] = message

    // Send the message:
    this.transmitMessage(id, message)
  }

  /**
   * Closes the connection in response to an error.
   */
  handleError (e: Error) {
    if (!this.error) this.error = e
    if (this.connected && this.socket) this.disconnect()
    else this.cancelConnect = true
  }

  /**
   * Closes the connection on engine shutdown.
   */
  disconnect () {
    clearTimeout(this.timer)
    this.sigkill = true
    this.connected = false
    if (this.socket) this.socket.close()
    removeIdFromQueue(this.uri)
  }

  // ------------------------------------------------------------------------
  // Private stuff
  // ------------------------------------------------------------------------

  // Options:
  io: PluginIo
  queueSize: number
  timeout: number // Converted to ms
  callbacks: StratumCallbacks
  walletId: string

  // Message queue:
  nextId: number
  pendingMessages: { [id: string]: PendingMessage }

  // Connection state:
  cancelConnect: boolean
  lastKeepAlive: number
  partialMessage: string
  socket: EdgeSocket | WebSocket | void
  timer: TimeoutID
  error: Error | void
  sigkill: boolean

  /**
   * Called when the socket disconnects for any reason.
   */
  onSocketClose () {
    const error = this.error || new Error('Socket closed')
    clearTimeout(this.timer)
    this.connected = false
    this.socket = void 0
    this.cancelConnect = false
    this.sigkill = false
    for (const id of Object.keys(this.pendingMessages)) {
      const message = this.pendingMessages[id]
      try {
        message.task.onFail(error)
      } catch (e) {
        this.logError(e)
      }
    }
    this.pendingMessages = {}
    try {
      this.callbacks.onClose(this.error)
    } catch (e) {
      this.logError(e)
    }
  }

  /**
   * Called when the socket completes its connection.
   */
  onSocketConnect () {
    if (this.cancelConnect) {
      if (this.socket) this.socket.close()
      return
    }

    this.connected = true
    this.lastKeepAlive = Date.now()
    this.partialMessage = ''

    try {
      this.callbacks.onOpen()
    } catch (e) {
      this.handleError(e)
    }

    // Launch pending messages:
    for (const id of Object.keys(this.pendingMessages)) {
      const message = this.pendingMessages[id]
      this.transmitMessage(Number(id), message)
    }

    this.wakeUp()
  }

  /**
   * Called when the socket receives data.
   */
  onSocketData (data: string) {
    const buffer = this.partialMessage + data
    const parts = buffer.split('\n')
    for (let i = 0; i + 1 < parts.length; ++i) {
      this.onMessage(parts[i])
    }
    this.partialMessage = parts[parts.length - 1]
  }

  /**
   * Called when the socket receives a complete message.
   */
  onMessage (messageJson: string) {
    try {
      const now = Date.now()
      const json = JSON.parse(messageJson)

      if (json.id) {
        // We have an ID, so it's a reply to a single request:
        const id: string = json.id.toString()
        const message = this.pendingMessages[id]
        if (!message) {
          throw new Error(`Bad Stratum id in ${messageJson}`)
        }
        delete this.pendingMessages[id]
        const { error } = json
        try {
          if (error) {
            const errorMessage = error.message
              ? error.message.split('\n')[0]
              : error.code
            throw new Error(errorMessage)
          }
          message.task.onDone(json.result, now - message.startTime)
        } catch (e) {
          message.task.onFail(e)
        }
      } else if (json.method === 'blockchain.headers.subscribe') {
        try {
          if (json.params == null || json.params[0] == null) {
            throw new Error(`Bad Stratum reply ${messageJson}`)
          }
          const reply = json.params[0]
          if (typeof reply.height === 'number') {
            this.callbacks.onNotifyHeight(reply.height)
          } else if (typeof reply.block_height === 'number') {
            this.callbacks.onNotifyHeight(reply.block_height)
          } else {
            throw new Error(`Bad Stratum reply ${messageJson}`)
          }
        } catch (e) {
          this.logError(e)
        }
      } else if (json.method === 'blockchain.scripthash.subscribe') {
        try {
          // TODO: Validate
          this.callbacks.onNotifyScriptHash(json.params[0], json.params[1])
        } catch (e) {
          this.logError(e)
        }
      } else if (/subscribe$/.test(json.method)) {
        // It's some other kind of subscription.
      } else {
        throw new Error(`Bad Stratum reply ${messageJson}`)
      }
    } catch (e) {
      this.handleError(e)
    }
    this.wakeUp()
  }

  /**
   * Called when the timer expires.
   */
  onTimer () {
    const now = Date.now() - TIMER_SLACK

    if (this.lastKeepAlive + KEEP_ALIVE_MS < now) {
      this.submitTask(
        this.version === '1.1'
          ? fetchVersion(
            (version: string) => {
              this.callbacks.onTimer(now)
            },
            (e: Error) => this.handleError(e)
          )
          : fetchPing(
            () => {
              this.callbacks.onTimer(now)
            },
            (e: Error) => this.handleError(e)
          )
      )
    }

    for (const id of Object.keys(this.pendingMessages)) {
      const message = this.pendingMessages[id]
      if (message.startTime + this.timeout < now) {
        try {
          message.task.onFail(new Error('Timeout'))
        } catch (e) {
          this.logError(e)
        }
        delete this.pendingMessages[id]
      }
    }
    this.setupTimer()
  }

  logError (e: Error) {
    logger.info(`${this.walletId} - ${e.toString()}`)
  }

  setupTimer () {
    // Find the next time something needs to happen:
    let nextWakeUp = this.lastKeepAlive + KEEP_ALIVE_MS

    for (const id of Object.keys(this.pendingMessages)) {
      const message = this.pendingMessages[id]
      const timeout = message.startTime + this.timeout
      if (timeout < nextWakeUp) nextWakeUp = timeout
    }

    const now = Date.now() - TIMER_SLACK
    const delay = nextWakeUp < now ? 0 : nextWakeUp - now
    this.timer = setTimeout(() => this.onTimer(), delay)
  }

  transmitMessage (id: number, pending: PendingMessage) {
    const now = Date.now()
    if (this.socket && this.connected && !this.cancelConnect) {
      pending.startTime = now
      // If this is a keepAlive, record the time:
      if (
        pending.task.method === 'server.ping' ||
        pending.task.method === 'server.version'
      ) {
        this.lastKeepAlive = now
      }

      const message = {
        id,
        method: pending.task.method,
        params: pending.task.params
      }
      this.socket.send(JSON.stringify(message) + '\n')
    }
  }
}
