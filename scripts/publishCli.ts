import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface PackageJson {
  dependencies: Record<string, string>
}

const binDir = path.resolve(__dirname, '..', 'lib')
const binFile = path.join(binDir, 'edgeCli.js')

const guiPackageJson = require(path.resolve(
  __dirname,
  '..',
  'package.json'
)) as PackageJson

// Ensure the build artifact exists
if (!fs.existsSync(binFile)) {
  console.error('lib/edgeCli.js not found. Run `yarn build:cli` first.')
  process.exit(1)
}

// CLI-specific dependencies that get shipped with the published package.
// Versions are read from edge-react-gui's package.json so the CLI uses
// the same tested versions.
const cliDeps = [
  'cleaners',
  'disklet',
  'edge-core-js',
  'edge-currency-accountbased',
  'edge-currency-plugins',
  'hash.js',
  'lib-cmdparse',
  'nanocolors',
  'node-getopt',
  'rfc4648',
  'source-map-support',
  'xdg-basedir',
  'yaob'
]

const dependencies: Record<string, string> = {}
for (const dep of cliDeps) {
  const version = guiPackageJson.dependencies[dep]
  if (version == null) {
    console.error(`Missing dependency "${dep}" in edge-react-gui package.json`)
    process.exit(1)
  }
  dependencies[dep] = version
}

// Write a temporary package.json for publishing
const cliPackage = {
  name: 'edge-cli',
  version: '3.0.0',
  description: 'Edge CLI tool',
  homepage: 'https://edge.app',
  repository: {
    type: 'git',
    url: 'git@github.com:EdgeApp/edge-react-gui.git'
  },
  license: 'SEE LICENSE IN LICENSE',
  author: 'Edge, Inc.',
  bin: {
    'edge-cli': './edgeCli.js'
  },
  dependencies
}

const cliPackagePath = path.join(binDir, 'package.json')
fs.writeFileSync(cliPackagePath, JSON.stringify(cliPackage, null, 2) + '\n')
console.log('Generated lib/package.json')

// Publish from the lib/ directory
try {
  execSync('npm publish', { cwd: binDir, stdio: 'inherit' })
  console.log('Published edge-cli successfully')
} finally {
  // Clean up the temporary package.json
  fs.unlinkSync(cliPackagePath)
}
