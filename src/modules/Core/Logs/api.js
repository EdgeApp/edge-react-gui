export const sendLogs = (logs) =>
  new Promise((resolve, reject) => {
    console.log('====== SENDING LOGS REQUEST ======')
    console.log(logs)
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
