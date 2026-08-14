import bodyParser from 'body-parser'
import express from 'express'
import fs from 'fs'
import os from 'os'

const ifaces = os.networkInterfaces()
const PORT = 8080
const configFile = './config.json'
let address = ''
let configJson = { LOG_SERVER: {} }

try {
  configJson = JSON.parse(fs.readFileSync(configFile, 'utf8'))
} catch (e) {
  console.log(e)
}

try {
  // Get Local Host Address
  Object.keys(ifaces).forEach(function (ifname) {
    let found = false

    const iface = ifaces[ifname] ?? []
    iface.forEach(function (iface) {
      if (iface.family !== 'IPv4' || iface.internal) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return
      }
      if (found) return
      address = iface.address
      found = true
    })
  })

  // Set config.json with correct path
  configJson.LOG_SERVER = {
    host: `http://${address}`,
    port: `${PORT}`
  }
  fs.writeFileSync(configFile, JSON.stringify(configJson, null, 2))
} catch (e) {
  console.log(e)
}

// Run the logging server
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/log', function (req, res) {
  if (req.body?.data != null) console.log(req.body.data.toString())
  res.sendStatus(200)
})

app.listen(PORT)
