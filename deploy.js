#!/usr/bin/env node
/* eslint-disable flowtype/require-valid-file-annotation */

const fs = require('fs')
const childProcess = require('child_process')
const sprintf = require('sprintf-js').sprintf

const argv = process.argv
const mylog = console.log

let _currentPath = __dirname

/**
 * Things we expect to be set in the config file:
 */
// type BuildConfigFile = {
//   // Common build options:
//   envJson: { [repoBranch: string]: Object },

//   // Android build options:
//   androidKeyStore: string,
//   androidKeyStoreAlias: string,
//   androidKeyStorePassword: string,
//   androidTask: string,

//   // iOS build options:
//   appleDeveloperTeamId: string,
//   xcodeScheme: string,
//   xcodeWorkspace: string,

//   // Upload options:
//   appCenterApiToken: string,
//   appCenterAppName: string,
//   appCenterDistroGroup: string,
//   appCenterGroupName: string,
//   bugsnagApiKey: string,
//   hockeyAppId: string,
//   hockeyAppTags: string,
//   hockeyAppToken: string,
//   productName: string
// }

/**
 * These are basically global variables:
 */
// type BuildObj = BuildConfigFile & {
//   // Set in makeCommonPre:
//   guiDir: string,
//   guiPlatformDir: string,
//   platformType: string, // 'android' | 'ios'
//   repoBranch: string, // 'develop' | 'master' | 'test'
//   tmpDir: string,

//   // Set in makeCommonPost:
//   buildNum: string,
//   bundleMapFile: string,
//   bundlePath: string,
//   bundleUrl: string,
//   guiHash: string,
//   version: string,

//   // Set in build steps:
//   dSymFile: string,
//   dSymZip: string,
//   ipaFile: string // Also APK
// }

main()

function main() {
  if (argv.length < 4) {
    mylog('Usage: node deploy.js [project] [platform] [branch]')
    mylog('  project options: edge')
    mylog('  platform options: ios, android')
    mylog('  network options: master, develop')
  }

  const buildObj = {} // BuildObj

  makeCommonPre(argv, buildObj)
  makeProject(argv[2], buildObj)
  makeCommonPost(buildObj)

  // buildCommonPre()
  if (argv[3] === 'ios') {
    buildIos(buildObj)
  } else if (argv[3] === 'android') {
    buildAndroid(buildObj)
  }
  buildCommonPost(buildObj)
}

function makeCommonPre(argv, buildObj) {
  buildObj.guiDir = __dirname
  buildObj.repoBranch = argv[4] // master or develop
  buildObj.platformType = argv[3] // ios or android
  buildObj.guiPlatformDir = buildObj.guiDir + '/' + buildObj.platformType
  buildObj.tmpDir = `${buildObj.guiDir}/temp`
}

function makeProject(project, buildObj) {
  const config = JSON.parse(
    fs.readFileSync(`${buildObj.guiDir}/deploy-config.json`, 'utf8')
  )

  Object.assign(buildObj, config[project])
  Object.assign(buildObj, config[project][buildObj.platformType])
  Object.assign(
    buildObj,
    config[project][buildObj.platformType][buildObj.repoBranch]
  )

  console.log(buildObj)
}

function makeCommonPost(buildObj) {
  if (buildObj.envJson != null) {
    const envJsonPath = buildObj.guiDir + '/env.json'
    let envJson = {}
    if (fs.existsSync(envJsonPath)) {
      envJson = JSON.parse(fs.readFileSync(envJsonPath, 'utf8'))
    }
    envJson = { ...envJson, ...buildObj.envJson[buildObj.repoBranch] }
    fs.chmodSync(envJsonPath, 0o600)
    fs.writeFileSync(envJsonPath, JSON.stringify(envJson, null, 2))
  }

  const buildVersionFile = buildObj.guiDir + '/release-version.json'
  const buildVersionJson = JSON.parse(fs.readFileSync(buildVersionFile, 'utf8'))
  buildObj.buildNum = buildVersionJson.build
  buildObj.version = buildVersionJson.version

  chdir(buildObj.guiDir)
  buildObj.guiHash = rmNewline(cmd('git rev-parse --short HEAD'))

  if (buildObj.platformType === 'android') {
    buildObj.bundlePath = `${buildObj.guiPlatformDir}/app/build/intermediates/assets/release/index.android.bundle`
    buildObj.bundleUrl = 'index.android.bundle'
    buildObj.bundleMapFile = '../android-release.bundle.map'
  } else if (buildObj.platformType === 'ios') {
    buildObj.bundlePath = `${buildObj.guiPlatformDir}/main.jsbundle`
    buildObj.bundleUrl = 'main.jsbundle'
    buildObj.bundleMapFile = '../ios-release.bundle.map'
  }
}

// function buildCommonPre() {
//   call('npm install -g appcenter-cli')
// }

function buildIos(buildObj) {
  chdir(buildObj.guiDir)

  if (fs.existsSync(`${buildObj.guiDir}/GoogleService-Info.plist`)) {
    call(
      `cp -a ${buildObj.guiDir}/GoogleService-Info.plist ${buildObj.guiPlatformDir}/edge/`
    )
  }

  // Bug fixes for React Native 0.46
  call('mkdir -p node_modules/react-native/scripts/')
  call('mkdir -p node_modules/react-native/packager/')
  call(
    'cp -a node_modules/react-native/scripts/* node_modules/react-native/packager/'
  )
  call(
    'cp -a node_modules/react-native/packager/* node_modules/react-native/scripts/'
  )
  // call('cp -a ../third-party node_modules/react-native/')
  // chdir(buildObj.guiDir + '/node_modules/react-native/third-party/glog-0.3.4')
  // call('../../scripts/ios-configure-glog.sh')

  // chdir(buildObj.guiDir)
  // call('react-native bundle --dev false --entry-file index.ios.js --bundle-output ios/main.jsbundle --platform ios')

  chdir(buildObj.guiPlatformDir)

  let cmdStr

  cmdStr = `security unlock-keychain -p '${
    process.env.KEYCHAIN_PASSWORD || ''
  }' "${process.env.HOME || ''}/Library/Keychains/login.keychain"`
  call(cmdStr)

  call(
    `security set-keychain-settings -l ${
      process.env.HOME || ''
    }/Library/Keychains/login.keychain`
  )

  cmdStr = `xcodebuild -workspace ${buildObj.xcodeWorkspace} -scheme ${buildObj.xcodeScheme} archive`
  if (process.env.DISABLE_XCPRETTY === 'false') cmdStr = cmdStr + ' | xcpretty'
  cmdStr = cmdStr + ' && exit ${PIPE' + 'STATUS[0]}'
  call(cmdStr)

  const buildDate = builddate()
  const buildDir = `${
    process.env.HOME || ''
  }/Library/Developer/Xcode/Archives/${buildDate}`

  chdir(buildDir)
  let archiveDir = cmd('ls -t')
  const archiveDirArray = archiveDir.split('\n')
  archiveDir = archiveDirArray[0]

  buildObj.dSymFile = `${buildDir}/${archiveDir}/dSYMs/${buildObj.xcodeScheme}.app.dSYM`
  // const appFile = sprintf('%s/%s/Products/Applications/%s.app', buildDir, archiveDir, buildObj.xcodeScheme)
  buildObj.dSymZip = `${buildObj.tmpDir}/${buildObj.xcodeScheme}.dSYM.zip`
  buildObj.ipaFile = `${buildObj.tmpDir}/${buildObj.xcodeScheme}.ipa`

  if (fs.existsSync(buildObj.ipaFile)) {
    call('rm ' + buildObj.ipaFile)
  }

  if (fs.existsSync(buildObj.dSymZip)) {
    call('rm ' + buildObj.dSymZip)
  }

  mylog('Creating IPA for ' + buildObj.xcodeScheme)
  chdir(buildObj.guiPlatformDir)

  // Replace TeamID in exportOptions.plist
  let plist = fs.readFileSync(
    buildObj.guiPlatformDir + '/exportOptions.plist',
    { encoding: 'utf8' }
  )
  plist = plist.replace('Your10CharacterTeamId', buildObj.appleDeveloperTeamId)
  fs.writeFileSync(buildObj.guiPlatformDir + '/exportOptions.plist', plist)

  cmdStr = `security unlock-keychain -p '${
    process.env.KEYCHAIN_PASSWORD || ''
  }'  "${process.env.HOME || ''}/Library/Keychains/login.keychain"`
  call(cmdStr)

  call(
    `security set-keychain-settings -l ${
      process.env.HOME || ''
    }/Library/Keychains/login.keychain`
  )

  cmdStr = `xcodebuild -exportArchive -archivePath "${buildDir}/${archiveDir}" -exportPath ${buildObj.tmpDir}/ -exportOptionsPlist ./exportOptions.plist`
  call(cmdStr)

  mylog('Zipping dSYM for ' + buildObj.xcodeScheme)
  cmdStr = `/usr/bin/zip -r "${buildObj.dSymZip}" "${buildObj.dSymFile}"`
  call(cmdStr)

  cmdStr = `cp -a "${buildDir}/${archiveDir}/Products/Applications/${buildObj.xcodeScheme}.app/main.jsbundle" "${buildObj.guiPlatformDir}/"`
  call(cmdStr)
}

function buildAndroid(buildObj) {
  if (fs.existsSync(`${buildObj.guiDir}/google-services.json`)) {
    call(
      `cp -a ${buildObj.guiDir}/google-services.json ${buildObj.guiPlatformDir}/app/`
    )
  }

  chdir(buildObj.guiDir)

  process.env.ORG_GRADLE_PROJECT_storeFile = sprintf(
    '/%s/keystores/%s',
    __dirname,
    buildObj.androidKeyStore
  )
  process.env.ORG_GRADLE_PROJECT_storePassword =
    buildObj.androidKeyStorePassword
  process.env.ORG_GRADLE_PROJECT_keyAlias = buildObj.androidKeyStoreAlias
  process.env.ORG_GRADLE_PROJECT_keyPassword = buildObj.androidKeyStorePassword

  chdir(buildObj.guiPlatformDir)
  call('./gradlew clean')
  call('./gradlew signingReport')
  call(sprintf('./gradlew %s', buildObj.androidTask))

  // Reset gradle file back
  // call('git reset --hard origin/' + buildObj.repoBranch)
  buildObj.ipaFile =
    buildObj.guiPlatformDir + '/app/build/outputs/apk/release/app-release.apk'
}

function buildCommonPost(buildObj) {
  let curl
  const notes = `${buildObj.productName} ${buildObj.version} (${buildObj.buildNum}) branch: ${buildObj.repoBranch} #${buildObj.guiHash}`

  if (buildObj.hockeyAppToken && buildObj.hockeyAppId) {
    mylog('\n\nUploading to HockeyApp')
    mylog('**********************\n')
    const url = sprintf(
      'https://rink.hockeyapp.net/api/2/apps/%s/app_versions/upload',
      buildObj.hockeyAppId
    )

    curl = sprintf(
      '/usr/bin/curl -F ipa=@%s -H "X-HockeyAppToken: %s" -F "notes_type=1" -F "status=2" -F "notify=0" -F "tags=%s" -F "notes=%s" ',
      buildObj.ipaFile,
      buildObj.hockeyAppToken,
      buildObj.hockeyAppTags,
      notes
    )

    if (buildObj.dSymZip !== undefined) {
      curl += sprintf('-F dsym=@%s ', buildObj.dSymZip)
    }

    curl += url

    call(curl)
    mylog('\nUploaded to HockeyApp')
  }

  if (buildObj.bugsnagApiKey && buildObj.dSymFile) {
    mylog('\n\nUploading to Bugsnag')
    mylog('*********************\n')

    const cpa = `cp -a "${buildObj.dSymFile}/Contents/Resources/DWARF/${buildObj.xcodeScheme}" ${buildObj.tmpDir}/`
    call(cpa)
    curl =
      '/usr/bin/curl https://upload.bugsnag.com/ ' +
      `-F dsym=@${buildObj.tmpDir}/${buildObj.xcodeScheme} ` +
      `-F projectRoot=${buildObj.guiPlatformDir}`
    call(curl)
  }

  if (
    buildObj.appCenterApiToken &&
    buildObj.appCenterAppName &&
    buildObj.appCenterGroupName
  ) {
    mylog('\n\nUploading to App Center')
    mylog('***********************\n')

    call(
      `npx appcenter distribute release --app ${buildObj.appCenterGroupName}/${
        buildObj.appCenterAppName
      } --file ${buildObj.ipaFile} --token ${buildObj.appCenterApiToken} -g ${
        buildObj.appCenterDistroGroup
      } -r ${JSON.stringify(notes)}`
    )
    mylog('\n*** Upload to App Center Complete ***')
  }
}

function builddate() {
  const date = new Date()

  const dateStr = sprintf(
    '%d-%02d-%02d',
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
  return dateStr
}

function rmNewline(text) {
  return text.replace(/(\r\n|\n|\r)/gm, '')
}

function chdir(path) {
  console.log('chdir: ' + path)
  _currentPath = path
}

function call(cmdstring) {
  console.log('call: ' + cmdstring)
  const opts = {
    encoding: 'utf8',
    timeout: 3600000,
    stdio: 'inherit',
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  }
  childProcess.execSync(cmdstring, opts)
}

function cmd(cmdstring) {
  console.log('cmd: ' + cmdstring)
  const opts = {
    encoding: 'utf8',
    timeout: 3600000,
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  }
  const r = childProcess.execSync(cmdstring, opts)
  return r
}
