// @flow
import { getEdgeServers } from '../../util/servers.js'
import { shuffleArray } from '../../util/utils.js'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

const request = (name, path, method, data) => {
  console.log(`====== ${name} REQUEST ======`, (data && data.length) || data)
  const servers = getEdgeServers().infoServers
  const server = shuffleArray(servers)[0] + '/v1/'
  const isoDate = new Date().toISOString()
  const uniqueId = (Math.random() * 100000000).toString().slice(0, 8)

  return global
    .fetch(`${server}${path}`, {
      method,
      headers,
      body: JSON.stringify({ isoDate, uniqueId, data })
    })
    .then(response => {
      console.log(`====== ${name} SUCCESS ======`, response)
      return response
    })
    .catch(error => {
      console.log(`====== ${name} FAILURE ======`, error)
      throw error
    })
}

// $FlowFixMe
export const sendLogs = logs => request('SENDING LOGS', 'addLogs/', 'POST', logs)
