// @flow

const childProcess = require('child_process')

const argv = process.argv

main()

function pad (num, size) {
  let s = num + ''
  while (s.length < size) {
    s = '0' + s
  }
  return s
}

async function main () {
  let code = 0
  try {
    if (argv.length === 4) {
      code = await callAsync(argv[2], argv[3])
    } else if (argv.length === 3) {
      code = await callAsync(argv[2])
    }
  } catch (e) {
    console.log(e)
  }
  process.exit(code)
}

async function callAsync (cmdString, pipeCmd = '') {
  return new Promise((resolve, reject) => {
    const cmdArray = cmdString.split(' ')
    const pipeArray = pipeCmd.split(' ')
    let outCmd
    let inCmd
    if (pipeCmd) {
      inCmd = childProcess.spawn(cmdArray[0], cmdArray.slice(1))
      outCmd = childProcess.spawn(pipeArray[0], pipeArray.slice(1))
    } else {
      outCmd = childProcess.spawn(cmdArray[0], cmdArray.slice(1))
    }
    let timeoutId

    const resetT = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        const date = new Date(Date.now())
        const year = date.getFullYear()
        const month = pad(date.getMonth() + 1, 2)
        const day = pad(date.getDate(), 2)
        const hour = pad(date.getHours(), 2)
        const mins = pad(date.getMinutes(), 2)

        console.log(`${year}-${month}-${day}-${hour}:${mins} Waiting...`)
        resetT()
      }, 60000)
    }

    if (inCmd) {
      inCmd.stdout.on('data', data => {
        outCmd && outCmd.stdin.write(data)
      })
      inCmd.stderr.on('data', data => {
        console.log(data.toString())
      })
      inCmd.on('close', code => {
        if (code === 0) {
          console.log(`process exited with code ${code}`)
          outCmd && outCmd.stdin.end()
        } else {
          resolve(code)
        }
      })
    }

    outCmd.stdout.on('data', data => {
      console.log(data.toString())
      resetT()
    })

    outCmd.stderr.on('data', data => {
      console.log(data.toString())
      resetT()
    })

    outCmd.on('close', code => {
      if (code === 0) {
        console.log(`process exited with code ${code}`)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        resolve(code)
      } else {
        resolve(code)
      }
    })
    resetT()
  })
}
