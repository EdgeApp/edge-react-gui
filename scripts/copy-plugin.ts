/* eslint-disable @typescript-eslint/no-var-requires */

import fs from 'fs'
import path from 'path'

import packageJson from '../package.json'

const { plugins } = packageJson

const androidDir = './android/app/src/main/assets/plugins/'
const iosDir = './ios/plugins/'

const platforms = [androidDir, iosDir]

platforms.forEach(platform => {
  if (!fs.existsSync(platform)) {
    fs.mkdirSync(platform)
  }
})

function copyAssets(plugin: string) {
  const manifest = require(`../node_modules/${plugin}/manifest.json`)
  platforms.forEach(platformDir => {
    const pluginDir = path.join(platformDir, manifest.pluginId)
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir)
    }
    fs.copyFile(`./node_modules/${plugin}/target/index.html`, `${pluginDir}/index.html`, () => {})
  })
  return manifest
}

if (plugins) {
  plugins.forEach(function (plugin) {
    copyAssets(plugin)
  })
}
