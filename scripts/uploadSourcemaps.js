#!/usr/bin/env node -r sucrase/register
// @flow
// This script builds & uploads Javascript sourcemaps to Bugsnag.
//
// Run it as `./scripts/uploadSourcemaps.js <platform>`

import childProcess from 'child_process'
import { makeNodeDisklet } from 'disklet'
import path from 'path'

import { asReleaseConfigFile, asVersionFile } from './cleaners.js'

async function main() {
  const cwd = path.join(__dirname, '..')
  const disklet = makeNodeDisklet(cwd)
  const [platform = 'android', project = 'edge'] = process.argv.slice(2)

  // Load config files:
  const versionFile = asVersionFile(await disklet.getText('release-version.json'))
  const configFile = asReleaseConfigFile(await disklet.getText('deploy-config.json'))
  const { bugsnagApiKey } = configFile[project]
  if (bugsnagApiKey == null) {
    throw new Error('No BugSnag API key')
  }

  // Prepare for launch:
  const opts = { cwd, stdio: 'inherit' }
  const bundle = `${platform}-release.bundle`
  const map = `${platform}-release.bundle.map`

  console.log(`Generating ${map}`)
  childProcess.execSync(
    `react-native bundle \
  --platform ${platform} \
  --dev false \
  --entry-file index.js \
  --bundle-output ${bundle} \
  --sourcemap-output ${map}`,
    opts
  )

  console.log(`Uploading ${map}`)
  childProcess.execSync(
    `curl --http1.1 https://upload.bugsnag.com/react-native-source-map \
  -F apiKey=${bugsnagApiKey} \
  -F appVersion=${versionFile.version} \
  -F ${platform === 'ios' ? 'appBundleVersion' : 'appVersionCode'}=${versionFile.build} \
  -F dev=false \
  -F platform=${platform} \
  -F sourceMap=@${map} \
  -F bundle=@${bundle} \
  -F projectRoot=${cwd}`,
    opts
  )
}

main().catch(error => console.log(error))
