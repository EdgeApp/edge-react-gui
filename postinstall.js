// @flow

const fs = require('fs')
const jsonFormat = require('json-format')

const fixModules = ['eosjs', 'eosjs-ecc', 'eosjs-api', 'fcbuffer', 'edge-ripple-lib', 'edge-currency-accountbased/node_modules/edge-ripple-lib']

const falseModules = ['https-proxy-agent', 'tls', 'isomorphic-fetch']

const jsonConfig = {
  type: 'space',
  size: 2
}

for (const lib of fixModules) {
  const path = `./node_modules/${lib}/package.json`
  if (fs.existsSync(path)) {
    // $FlowFixMe
    const packageJson = require(path)
    if (!packageJson['react-native']) {
      packageJson['react-native'] = {}
    }
    for (const fm of falseModules) {
      packageJson['react-native'][fm] = false
    }
    if (packageJson.babel) {
      packageJson.babel = undefined
    }
    // console.log(`---------- ${path} --------------`)
    const out = jsonFormat(packageJson, jsonConfig)
    // console.log(out)
    // fs.writeFileSync('./packageJson.txt', out)
    fs.writeFileSync(path, out)
  }
}
