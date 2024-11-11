import { Cleaner } from 'cleaners'
import { EdgeFetchFunction, EdgeFetchOptions, EdgeFetchResponse } from 'edge-core-js'
import { asInfoRollup, InfoRollup } from 'edge-info-server'
import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'

import { config } from '../theme/appConfig'
import { asyncWaterfall, getOsVersion, shuffleArray } from './utils'
const INFO_SERVERS = ['https://info1.edge.app', 'https://info2.edge.app']
const RATES_SERVERS = ['https://rates1.edge.app', 'https://rates2.edge.app']

const INFO_FETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export async function fetchWaterfall(
  servers: string[],
  path: string,
  options?: EdgeFetchOptions,
  timeout: number = 5000,
  doFetch: EdgeFetchFunction = fetch
): Promise<EdgeFetchResponse> {
  const funcs = servers.map(server => async () => {
    const result = await doFetch(server + '/' + path, options)
    if (typeof result !== 'object') {
      const msg = `Invalid return value ${path} in ${server}`
      console.log(msg)
      throw new Error(msg)
    }
    return result
  })
  return await asyncWaterfall(funcs, timeout)
}

export async function cleanMultiFetch<T>(
  cleaner: Cleaner<T>,
  servers: string[],
  path: string,
  options?: EdgeFetchOptions,
  timeout: number = 5000,
  doFetch?: EdgeFetchFunction
): Promise<T> {
  const response = await fetchWaterfall(shuffleArray(servers), path, options, timeout, doFetch)
  if (!response.ok) {
    const text = await response.text()
    console.error(text)
    throw new Error(`Error fetching ${path}: ${text}`)
  }
  const responseJson = await response.json()
  const out = cleaner(responseJson)
  return out
}

async function multiFetch(
  servers: string[],
  path: string,
  options?: EdgeFetchOptions,
  timeout: number = 5000,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> {
  return await fetchWaterfall(shuffleArray(servers), path, options, timeout, doFetch)
}

export const fetchInfo = async (path: string, options?: EdgeFetchOptions, timeout?: number, doFetch?: EdgeFetchFunction): Promise<EdgeFetchResponse> => {
  return await multiFetch(INFO_SERVERS, path, options, timeout, doFetch)
}
export const fetchRates = async (path: string, options?: EdgeFetchOptions, timeout?: number, doFetch?: EdgeFetchFunction): Promise<EdgeFetchResponse> => {
  return await multiFetch(RATES_SERVERS, path, options, timeout, doFetch)
}
export const fetchReferral = async (path: string, options?: EdgeFetchOptions, timeout?: number, doFetch?: EdgeFetchFunction): Promise<EdgeFetchResponse> => {
  return await multiFetch(config.referralServers ?? [], path, options, timeout, doFetch)
}
export const fetchPush = async (path: string, options?: EdgeFetchOptions, timeout?: number, doFetch?: EdgeFetchFunction): Promise<EdgeFetchResponse> => {
  return await multiFetch(config.notificationServers, path, options, timeout, doFetch)
}

export const infoServerData: { rollup?: InfoRollup } = {}

export const initInfoServer = async () => {
  const osType = Platform.OS.toLowerCase()
  const osVersion = getOsVersion()
  const version = getVersion()

  const queryInfo = async () => {
    try {
      const response = await fetchInfo(`v1/inforollup/${config.appId ?? 'edge'}?os=${osType}&osVersion=${osVersion}&appVersion=${version}`)
      if (!response.ok) {
        console.warn(`initInfoServer error ${response.status}: ${await response.text()}`)
      } else {
        const infoData = await response.json()
        infoServerData.rollup = asInfoRollup(infoData)
      }
    } catch (e) {
      console.warn('initInfoServer: Failed to ping info server')
    }
  }

  await queryInfo()
  setInterval(queryInfo, INFO_FETCH_INTERVAL)
}
