/* eslint-disable flowtype/require-valid-file-annotation */

const fs = require('fs')
const path = require('path')
const { plugins } = require('./package.json')

const pluginsFile = './src/assets/plugins.json'
const androidDir = './android/app/src/main/assets/plugins/'
const iosDir = './ios/plugins/'

const platforms = [androidDir, iosDir]
const pluginManifests = {
  buysell: [
    {
      pluginId: 'co.edgesecure.libertyx',
      pluginURL: 'https://libertyx.com/a/',
      name: 'LibertyX',
      subtitle: 'Buy bitcoin instantly at trusted stores near you.',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/05/libertyXlogo.png',
      environment: {}
    },
    {
      pluginId: 'co.edgesecure.bitaccess',
      pluginURL: 'https://bitaccessbtm.com',
      name: 'bitaccess',
      subtitle: 'Buy And Sell Bitcoin Instantly.',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/05/bitaccess-symbol.png',
      environment: {}
    },
    {
      pluginId: 'co.edgesecure.moonpay',
      pluginURL: 'https://buy.moonpay.io',
      name: 'MoonPay',
      subtitle: 'Buy Crypto Instantly.',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/05/icon_black_small.png',
      environment: {}
    }
  ],
  spend: [
    {
      pluginId: 'co.edgesecure.bitaccess',
      pluginURL: 'https://bitaccessbtm.com',
      name: 'bitaccess',
      subtitle: 'Buy And Sell Bitcoin Instantly.',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/05/bitaccess-symbol.png',
      environment: {}
    }
  ]
}

platforms.forEach(platform => {
  if (!fs.existsSync(platform)) {
    fs.mkdirSync(platform)
  }
})

function copyAssets (plugin) {
  const manifest = require(`./node_modules/${plugin}/manifest.json`)
  platforms.forEach(platformDir => {
    const pluginDir = path.join(platformDir, manifest.pluginId)
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir)
    }
    fs.copyFile(`./node_modules/${plugin}/target/index.html`, `${pluginDir}/index.html`, () => {})
  })
  return manifest
}

if (plugins.buysell) {
  plugins.buysell.forEach(function (plugin) {
    const manifest = copyAssets(plugin)
    pluginManifests.buysell.push(manifest)
  })
}

if (plugins.spend) {
  plugins.spend.forEach(function (plugin) {
    const manifest = copyAssets(plugin)
    pluginManifests.spend.push(manifest)
  })
}

fs.writeFileSync(pluginsFile, JSON.stringify(pluginManifests, null, 2))
