/* eslint-disable flowtype/require-valid-file-annotation */

const API_PREFIX = 'https://info1.edgesecure.co:8444/v1/'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

const request = (name, path, method, data) => {
  console.log(`====== ${name} REQUEST ======`, (data && data.length) || data)

  return global
    .fetch(`${API_PREFIX}${path}`, {
      method,
      headers,
      body: JSON.stringify({ data })
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

export const sendLogs = logs => request('SENDING LOGS', 'addLogs/', 'POST', logs)
