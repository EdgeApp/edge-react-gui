/* eslint-disable flowtype/require-valid-file-annotation */

const fs = require('fs')
const path = require('path')
const { plugins } = require('./package.json')

const pluginsFile = './src/assets/plugins.json'
const androidDir = './android/app/src/main/assets/plugins/'
const iosDir = './ios/plugins/'

const platforms = [androidDir, iosDir]
const pluginManifests = {
  buysell: [],
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
