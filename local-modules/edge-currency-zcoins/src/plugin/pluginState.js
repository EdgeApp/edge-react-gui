// @flow

import { type Disklet, navigateDisklet } from 'disklet'
import { type EdgeIo } from 'edge-core-js/types'

import type { EngineState } from '../engine/engineState.js'
import { FixCurrencyCode, InfoServer } from '../info/constants'
import { logger } from '../utils/logger.js'
import { ServerCache } from './serverCache.js'

export type CurrencySettings = {
  customFeeSettings: Array<string>,
  electrumServers: Array<string>,
  disableFetchingServers?: boolean
}

/**
 * This object holds the plugin-wide per-currency caches.
 * Engine plugins are responsible for keeping it up to date.
 */
export type PluginStateSettings = {
  io: EdgeIo,
  defaultSettings: CurrencySettings,
  currencyCode: string,
  pluginName: string
}
export class PluginState extends ServerCache {
  // On-disk header information:
  height: number
  headerCache: {
    [height: string]: {
      timestamp: number
    }
  }

  // True if somebody is currently fetching a header:
  headerStates: {
    [height: number]: { fetching: boolean }
  }

  // On-disk server information:
  serverCache: ServerCache

  /**
   * Begins notifying the engine of state changes. Used at connection time.
   */
  addEngine (engineState: EngineState): void {
    this.engines.push(engineState)
  }

  /**
   * Stops notifying the engine of state changes. Used at disconnection time.
   */
  removeEngine (engineState: EngineState): void {
    this.engines = this.engines.filter(engine => engine !== engineState)
  }

  dumpData (): any {
    return {
      'pluginState.headerCache': this.headerCache,
      'pluginState.serverCache': this.serverCache,
      'pluginState.servers_': this.servers_
    }
  }

  // ------------------------------------------------------------------------
  // Private stuff
  // ------------------------------------------------------------------------
  io: EdgeIo
  disableFetchingServers: boolean
  defaultServers: Array<string>
  infoServerUris: string

  engines: Array<EngineState>
  disklet: Disklet

  headerCacheDirty: boolean
  serverCacheJson: Object
  pluginName: string

  constructor ({
    io,
    defaultSettings,
    currencyCode,
    pluginName
  }: PluginStateSettings) {
    super()
    this.height = 0
    this.headerCache = {}
    this.io = io
    this.defaultServers = defaultSettings.electrumServers
    this.disableFetchingServers = !!defaultSettings.disableFetchingServers
    // Rename the bitcoin currencyCode to get the new version of the server list
    const fixedCode = FixCurrencyCode(currencyCode)
    this.infoServerUris = `${InfoServer}/electrumServers/${fixedCode}`
    this.engines = []
    this.disklet = navigateDisklet(io.disklet, 'plugins/' + pluginName)

    this.pluginName = pluginName
    this.headerCacheDirty = false
    this.serverCacheJson = {}
  }

  async load () {
    try {
      const headerCacheText = await this.disklet.getText('headers.json')
      const headerCacheJson = JSON.parse(headerCacheText)
      // TODO: Validate JSON

      this.height = headerCacheJson.height
      this.headerCache = headerCacheJson.headers
    } catch (e) {
      this.headerCache = {}
      logger.info(`${this.pluginName}: Failed to load header cache: ${e}`)
    }

    try {
      const serverCacheText = await this.disklet.getText('serverCache.json')
      const serverCacheJson = JSON.parse(serverCacheText)
      // TODO: Validate JSON

      this.serverCacheJson = serverCacheJson
    } catch (e) {
      logger.info(`${this.pluginName}: Failed to load server cache: ${e}`)
    }

    // Fetch stratum servers in the background:
    this.fetchStratumServers()

    return this
  }

  async clearCache () {
    this.clearServerCache()
    this.headerCache = {}
    this.headerCacheDirty = true
    this.serverCacheDirty = true
    await this.saveHeaderCache()
    await this.saveServerCache()
    await this.fetchStratumServers()
  }

  saveHeaderCache (): Promise<void> {
    if (this.headerCacheDirty) {
      return this.disklet
        .setText(
          'headers.json',
          JSON.stringify({
            height: this.height,
            headers: this.headerCache
          })
        )
        .then(() => {
          logger.info(`${this.pluginName} - Saved header cache`)
          this.headerCacheDirty = false
        })
        .catch(e => logger.info(`${this.pluginName} - ${e.toString()}`))
    }
    return Promise.resolve()
  }

  async saveServerCache () {
    // this.printServerCache()
    if (this.serverCacheDirty) {
      try {
        await this.disklet.setText(
          'serverCache.json',
          JSON.stringify(this.servers_)
        )
        this.serverCacheDirty = false
        this.cacheLastSave_ = Date.now()
        logger.info(`${this.pluginName} - Saved server cache`)
      } catch (e) {
        logger.info(`${this.pluginName} - ${e.toString()}`)
      }
    }
  }

  dirtyServerCache (serverUrl: string) {
    this.serverCacheDirty = true
    for (const engine of this.engines) {
      if (engine.progressRatio === 1) {
        for (const uri in engine.serverStates) {
          if (uri === serverUrl) {
            this.saveServerCache()
            return
          }
        }
      }
    }
  }

  dirtyHeaderCache () {
    this.headerCacheDirty = true
    for (const engine of this.engines) {
      if (engine.progressRatio === 1) {
        this.saveHeaderCache()
        return
      }
    }
  }

  async fetchStratumServers (): Promise<void> {
    const { io } = this
    let serverList = this.defaultServers
    if (!this.disableFetchingServers) {
      try {
        logger.info(`${this.pluginName} - GET ${this.infoServerUris}`)
        const result = await io.fetch(this.infoServerUris)
        if (!result.ok) {
          logger.info(
            `${this.pluginName} - Fetching ${this.infoServerUris} failed with ${
              result.status
            }`
          )
        } else {
          serverList = await result.json()
        }
      } catch (e) {
        logger.info(e)
      }
    }
    if (!Array.isArray(serverList)) {
      serverList = this.defaultServers
    }
    this.serverCacheLoad(this.serverCacheJson, serverList)
    await this.saveServerCache()

    // Tell the engines about the new servers:
    for (const engine of this.engines) {
      engine.refillServers()
    }
  }

  updateHeight (height: number) {
    if (this.height < height) {
      this.height = height
      this.dirtyHeaderCache()

      // Tell the engines about our new height:
      for (const engine of this.engines) {
        engine.onHeightUpdated(height)
      }
    }
  }

  async updateServers (settings: Object) {
    const { electrumServers, disableFetchingServers } = settings || {}
    if (typeof disableFetchingServers === 'boolean') {
      this.disableFetchingServers = disableFetchingServers
    }
    if (Array.isArray(electrumServers)) {
      this.defaultServers = electrumServers
    }
    const engines = []
    const disconnects = []
    for (const engine of this.engines) {
      engines.push(engine)
      engine.serverList = []
      disconnects.push(engine.disconnect())
    }
    await Promise.all(disconnects)
    this.clearServerCache()
    this.serverCacheJson = {}
    this.serverCacheDirty = true
    await this.saveServerCache()
    await this.fetchStratumServers()
    for (const engine of engines) {
      engine.connect()
    }
  }
}
