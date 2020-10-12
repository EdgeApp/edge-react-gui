// @flow

const fs = require('fs')
const os = require('os')
const express = require('express')
const bodyParser = require('body-parser')

const ifaces = os.networkInterfaces()
const PORT = 8080
const envFile = './env.json'
let address = ''
let envJSON = { LOG_SERVER: {} }

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
  envJSON.LOG_SERVER = {
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

app.post('/log', function (req, res) {
  if (req.body && req.body.data) console.log(req.body.data.toString())
  res.sendStatus(200)
})

app.listen(PORT)
