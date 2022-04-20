// @flow

import ENV from '../../env.json'
import { config } from '../theme/appConfig.js'
import { fetchWaterfall } from '../util/utils'

class NotifServer {
  version: number
  apiKey: string

  constructor(version: number) {
    this.version = version
    this.apiKey = ENV.AIRBITZ_API_KEY
  }

  async get(path: string) {
    return this.request(path, 'GET')
  }

  async post(path: string, body?: Object) {
    return this.request(path, 'POST', body)
  }

  async put(path: string, body?: Object) {
    return this.request(path, 'PUT', body)
  }

  async request(path: string, method: string, body?: Object, headers: Object = {}) {
    const response = await fetchWaterfall(config.notificationServers, `v${this.version}/${path}`, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey
      },
      body: JSON.stringify(body)
    })
    if (response != null && response.ok) {
      const result = await response.json()
      return result
    } else {
      throw new Error('Error accessing notification server ')
    }
  }
}

export const notif1 = new NotifServer(1)
