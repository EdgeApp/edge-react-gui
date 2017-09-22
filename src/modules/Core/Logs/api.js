export const sendLogs = (logs) =>
  new Promise((resolve, reject) => {
    console.log('====== SENDING LOGS REQUEST ======', logs.length)
    console.log(logs)
    global.fetch('http://localhost:8087/v1/addLogs/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: logs
      })
    }).then((response) => {
      console.log('SUCCESS RESPONSE',response)
    })
      .catch((error) => {
        console.log('ERROR RESPONSE',error)
      })
    setTimeout(() => {
      const value = Math.random()
      if (value > 0.5) {
        resolve(value)
        console.log('====== SENDING LOGS SUCCESS ======')
      } else {
        reject(value)
        console.log('====== SENDING LOGS FAILURE ======')
      }
    }, 2000)
  })