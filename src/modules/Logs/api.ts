const API_PREFIX = 'https://logs1.edge.app/v1/'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

// @ts-expect-error
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.status)
  }
  return response
}

// @ts-expect-error
const request = async (name, path, method, data) => {
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

// @ts-expect-error
export const sendLogs = async logs => request('SENDING LOGS', 'log/', 'PUT', logs)
