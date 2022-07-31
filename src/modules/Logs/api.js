// @flow

const API_PREFIX = 'https://logs1.edge.app/v1/'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.status)
  }
  return response
}

const request = (name, path, method, data) => {
  console.log(`====== ${name} REQUEST ====== data length: ${data?.length ?? ''}`)

  return global
    .fetch(`${API_PREFIX}${path}`, {
      method,
      headers,
      body: JSON.stringify(data)
    })
    .then(handleErrors)
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
export const sendLogs = logs => request('SENDING LOGS', 'log/', 'PUT', logs)
