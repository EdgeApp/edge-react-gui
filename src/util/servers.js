// @flow

import { asArray, asObject, asString } from 'cleaners'
import { makeReactNativeDisklet } from 'disklet'

const SERVERS_FILE = 'edgeServers.json'
const disklet = makeReactNativeDisklet()

export const asEdgeServers = asObject({
  infoServers: asArray(asString),
  referralServers: asArray(asString),
  ratesServers: asArray(asString),
  logsServers: asArray(asString)
})

let edgeServers = asEdgeServers({
  infoServers: ['https://info1.edge.app'],
  referralServers: ['https://referral1.edge.app'],
  ratesServers: ['https://rates1.edge.app'],
  logsServers: ['https://logs1.edge.app']
})

let timeout

export const getEdgeServers = () => edgeServers

export const startServerUpdate = () => {
  timeout = setInterval(async () => {
    try {
      // Load local cache first
      const txt = await disklet.getText(SERVERS_FILE)
      edgeServers = asEdgeServers(JSON.parse(txt))

      // Update from the network
      const result = await fetch(edgeServers.infoServers[0] + '/v1/edgeServers')
      const newEdgeServers = asEdgeServers(await result.json())

      const newEdgeServersJson = JSON.stringify(newEdgeServers)
      if (newEdgeServersJson !== JSON.stringify(edgeServers)) {
        edgeServers = newEdgeServers
        await disklet.setText(SERVERS_FILE, newEdgeServersJson)
      }
    } catch (e) {}

    startServerUpdate()
  }, 60000)
}

export const stopServerUpdate = () => {
  clearInterval(timeout)
}
