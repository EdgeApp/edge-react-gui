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
      pluginId: 'com.libertyx',
      pluginURL: 'https://libertyx.com/a/',
      name: 'LibertyX',
      subtitle: 'Buy Bitcoin with cash at US merchants\nBTC\nFee: 3-8% / Settlement: instant',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/05/libertyXlogo.png',
      environment: {},
      permissions: ['location']
    },
    {
      pluginId: 'io.moonpay.buy',
      pluginURL: 'https://buy.moonpay.io?apiKey=pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy',
      name: 'MoonPay',
      subtitle: 'Buy crypto in Europe with credit card or Apple Pay\nBTC, ETH, BCH\nFee: 5.5% / Settlement: 10 mins',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/05/icon_black_small.png',
      environment: {}
    },
    {
      pluginId: 'io.safello',
      pluginURL: 'https://safello.com/edge/',
      name: 'Safello',
      subtitle: 'BTC, ETH, XRP, BCH\nSettlement - Instant \n3 seconds after confirmed payment',
      provider: 'Edge Wallet',
      iconUrl: 'https://edge.app/wp-content/uploads/2019/06/Safello-Logo-Green-background.png',
      environment: {}
    }
  ],
  spend: []
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
