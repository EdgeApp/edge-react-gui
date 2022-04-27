// @flow

const fs = require('fs')
const os = require('os')
const express = require('express')
const bodyParser = require('body-parser')

const ifaces = os.networkInterfaces()
const PORT = 8090
const envFile = './env.json'
const OVERRIDE_THEME_FILE = './overrideTheme.json'
let address = ''
let envJSON = { THEME_SERVER: {} }

function mylog(...args) {
  const now = new Date().toISOString()
  console.log(`${now}:`, ...args)
}

try {
  envJSON = JSON.parse(fs.readFileSync(envFile, 'utf8'))
} catch (e) {
  console.log(e)
}

try {
  // Get Local Host Address
  Object.keys(ifaces).forEach(function (ifname) {
    let found = false

    ifaces[ifname].forEach(function (iface) {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return
      }
      if (found) return
      address = iface.address
      found = true
    })
  })

  // Set env.json with correct path
  envJSON.THEME_SERVER = {
    host: `http://${address}`,
    port: `${PORT}`
  }
  fs.writeFileSync(envFile, JSON.stringify(envJSON, null, 2))
} catch (e) {
  console.log(e)
}

// Run the logging server
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  const method = req?.method ?? 'NO_METHOD'
  const path = req?.path ?? 'NO_PATH'
  mylog(`${method} ${path}`)
  next() // make sure we go to the next routes and don't stop here
})

app.get('/theme', function (req, res) {
  try {
    const theme = JSON.parse(fs.readFileSync(OVERRIDE_THEME_FILE, 'utf8'))
    res.json(theme)
  } catch (e) {
    res.json(e)
  }
})

app.post('/theme', function (req, res) {
  try {
    const jsonString = JSON.stringify(req.body, null, 2)
    mylog('\n' + jsonString)
    fs.writeFileSync(OVERRIDE_THEME_FILE, jsonString)
    res.sendStatus(200)
  } catch (e) {
    res.json(e)
  }
})

app.listen(PORT)

console.log(`Theme server listening on ${address}:${PORT}`)
