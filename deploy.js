#!/usr/bin/env node
/**
 * Created by paul on 6/27/17.
 * @flow
 */
const fs = require('fs')
const childProcess = require('child_process')
const sprintf = require('sprintf-js').sprintf

const argv = process.argv
const mylog = console.log

let _currentPath = __dirname

// type CoreDep = {
//   repoName: string,
//   repoHash: string
// }
// type BuildObj = {
//   guiDir: string,
//   hockeyAppId: string,
//   hockeyAppToken: string,
//   hockeyAppTags: string,
//   coreDeps: {[repo: string]: CoreDep},
//   repoBranch: string,
//   platformType: string,
//   guiPlatformDir: string,
//   productName: string,
//   xcodeProject: string,
//   xcodeScheme: string,
//   teamId: string,
//   provisioningProfile: string,
//   androidKeyStore: string,
//   androidKeyStoreAlias: string,
//   androidKeyStorePassword: string,
//   version: string,
//   buildNum: string,
//   guiDir: string,
//   guiHash: string,
//   xcodeProject: string,
//   xcodeScheme: string,
//   dSymZip: string,
//   ipaFile: string,
//   androidTask: string
// }

main()

function main () {
  if (argv.length < 4) {
    mylog('Usage: node deploy.js [project] [platform] [branch]')
    mylog('  project options: edge')
    mylog('  platform options: ios, android')
    mylog('  network options: master, develop')
  }

  // let buildObj: BuildObj = {
  //   guiDir: '',
  //   hockeyAppId: '',
  //   hockeyAppToken: '',
  //   hockeyAppTags: '',
  //   coreDeps: {},
  //   repoBranch: '',
  //   platformType: '',
  //   guiPlatformDir: '',
  //   productName: '',
  //   xcodeProject: '',
  //   xcodeScheme: '',
  //   teamId: '',
  //   provisioningProfile: '',
  //   androidKeyStore: '',
  //   androidKeyStoreAlias: '',
  //   androidKeyStorePassword: '',
  //   version: '',
  //   buildNum: '',
  //   guiHash: '',
  //   dSymZip: '',
  //   ipaFile: '',
  //   androidTask: ''
  // }

  const buildObj = {}

  makeCommonPre(argv, buildObj)

  makeProject(argv[2], buildObj)

  makeCommonPost(buildObj)

  buildCommon(buildObj)

  if (argv[3] === 'ios') {
    buildIos(buildObj)
  } else if (argv[3] === 'android') {
    buildAndroid(buildObj)
  }
  buildCommonPost(buildObj)
}

function makeCommonPre (argv, buildObj) {
  buildObj.guiDir = __dirname
  buildObj.coreDeps = []
  buildObj.repoBranch = argv[4] // master or develop
  buildObj.platformType = argv[3] // ios or android
  buildObj.guiPlatformDir = buildObj.guiDir + '/' + buildObj.platformType
}

function makeProject (project, buildObj) {
  const config = JSON.parse(fs.readFileSync(`${buildObj.guiDir}/deploy-config.json`, 'utf8'))

  Object.assign(buildObj, config[project])
  Object.assign(buildObj, config[project][buildObj.platformType])
  Object.assign(buildObj, config[project][buildObj.platformType][buildObj.repoBranch])

  console.log(buildObj)
}

function makeCommonPost (buildObj) {
  const packageJson = JSON.parse(fs.readFileSync(buildObj.guiDir + '/package.json', 'utf8'))
  buildObj.version = packageJson.version
  if (buildObj.repoBranch === 'develop') {
    buildObj.version = packageJson.version + '-d'
  } else {
    buildObj.version = packageJson.version
  }

  const buildNumFile = buildObj.guiPlatformDir + '/buildnum.json'
  if (fs.existsSync(buildNumFile)) {
    const buildNumJson = JSON.parse(fs.readFileSync(buildNumFile, 'utf8'))
    buildObj.buildNum = buildnum(buildNumJson.buildNum)
  } else {
    buildObj.buildNum = buildnum()
  }

  const buildNumObj = { buildNum: buildObj.buildNum }
  const json = JSON.stringify(buildNumObj)
  fs.writeFileSync(buildNumFile, json)

  chdir(buildObj.guiDir)
  buildObj.guiHash = rmNewline(cmd('git rev-parse --short HEAD'))

  if (buildObj.platformType === 'android') {
    buildObj.bundlePath = `${buildObj.guiPlatformDir}/app/build/intermediates/assets/release/index.android.bundle`
    buildObj.bundleUrl = 'index.android.bundle'
    buildObj.bundleMapFile = './android-release.bundle.map'
  } else if (buildObj.platformType === 'ios') {
    buildObj.bundlePath = `${buildObj.guiPlatformDir}/main.jsbundle`
    buildObj.bundleUrl = 'main.jsbundle'
    buildObj.bundleMapFile = '../ios-release.bundle.map'
  }
}

function buildCommon (buildObj) {
  // chdir(buildObj.guiDir)
  // call('rm -rf ' + buildObj.guiDir + '/node_modules')
  // call('rm -rf $TMPDIR/*react-*')
  // call('yarn')
  // // buildObj.packageLock = JSON.parse(fs.readFileSync(buildObj.guiDir + '/package-lock.json', 'utf8'))
  //
  // for (const coreDep of buildObj.coreDeps) {
  //   // if (typeof buildObj.packageLock !== 'undefined') {
  //   //   if (typeof buildObj.packageLock.dependencies !== 'undefined') {
  //   //     if (typeof buildObj.packageLock.dependencies[coreDep.repoName] !== 'undefined') {
  //   //       if (typeof buildObj.packageLock.dependencies[coreDep.repoName].version !== 'undefined') {
  //   //         coreDep.repoHash = buildObj.packageLock.dependencies[coreDep.repoName].version
  //   coreDep.repoHash = 'Unknown'
  //
  //   //       }
  //   //     }
  //   //   }
  //   // }
  // }
}

function buildIos (buildObj) {
  chdir(buildObj.guiDir)

  if (fs.existsSync(`${buildObj.guiDir}/GoogleService-Info.plist`)) {
    call(`cp -a ${buildObj.guiDir}/GoogleService-Info.plist ${buildObj.guiPlatformDir}/edge/`)
  }

  // Bug fixes for React Native 0.46
  call('mkdir -p node_modules/react-native/scripts/')
  call('mkdir -p node_modules/react-native/packager/')
  call('cp -a node_modules/react-native/scripts/* node_modules/react-native/packager/')
  call('cp -a node_modules/react-native/packager/* node_modules/react-native/scripts/')
  // call('cp -a ../third-party node_modules/react-native/')
  // chdir(buildObj.guiDir + '/node_modules/react-native/third-party/glog-0.3.4')
  // call('../../scripts/ios-configure-glog.sh')

  // chdir(buildObj.guiDir)
  // call('react-native bundle --dev false --entry-file index.ios.js --bundle-output ios/main.jsbundle --platform ios')

  chdir(buildObj.guiPlatformDir)

  let cmdStr

  cmdStr = `security unlock-keychain -p '${process.env.KEYCHAIN_PASSWORD || ''}' "${process.env.HOME || ''}/Library/Keychains/login.keychain"`
  call(cmdStr)

  call(`security set-keychain-settings -t 7200 -l ${process.env.HOME || ''}/Library/Keychains/login.keychain`)

  call('agvtool new-marketing-version ' + buildObj.version)
  call('agvtool new-version -all ' + buildObj.buildNum)
  call(`xcodebuild -project ${buildObj.xcodeProject} -scheme ${buildObj.xcodeScheme} archive`)

  const buildDate = builddate()
  const buildDir = `${process.env.HOME || ''}/Library/Developer/Xcode/Archives/${buildDate}`

  chdir(buildDir)
  let archiveDir = cmd('ls -t')
  const archiveDirArray = archiveDir.split('\n')
  archiveDir = archiveDirArray[ 0 ]

  buildObj.dSymFile = `${buildDir}/${archiveDir}/dSYMs/${buildObj.xcodeScheme}.app.dSYM`
  // const appFile = sprintf('%s/%s/Products/Applications/%s.app', buildDir, archiveDir, buildObj.xcodeScheme)
  buildObj.dSymZip = `/tmp/${buildObj.xcodeScheme}.dSYM.zip`
  buildObj.ipaFile = `/tmp/${buildObj.xcodeScheme}.ipa`
  const tmpIpaDir = '/tmp/'

  if (fs.existsSync(buildObj.ipaFile)) {
    call('rm ' + buildObj.ipaFile)
  }

  if (fs.existsSync(buildObj.dSymZip)) {
    call('rm ' + buildObj.dSymZip)
  }

  mylog('Creating IPA for ' + buildObj.xcodeScheme)
  chdir(buildObj.guiPlatformDir)

  // Replace TeamID in exportOptions.plist
  let plist = fs.readFileSync(buildObj.guiPlatformDir + '/exportOptions.plist', {encoding: 'utf8'})
  plist = plist.replace('Your10CharacterTeamId', buildObj.appleDeveloperTeamId)
  fs.writeFileSync(buildObj.guiPlatformDir + '/exportOptions.plist', plist)

  cmdStr = `security unlock-keychain -p '${process.env.KEYCHAIN_PASSWORD || ''}'  "${process.env.HOME || ''}/Library/Keychains/login.keychain"`
  call(cmdStr)

  call(`security set-keychain-settings -t 7200 -l ${process.env.HOME || ''}/Library/Keychains/login.keychain`)

  cmdStr = `xcodebuild -exportArchive -allowProvisioningUpdates -archivePath "${buildDir}/${archiveDir}" -exportPath ${tmpIpaDir} -exportOptionsPlist ./exportOptions.plist`
  call(cmdStr)

  mylog('Zipping dSYM for ' + buildObj.xcodeScheme)
  cmdStr = `/usr/bin/zip -r "${buildObj.dSymZip}" "${buildObj.dSymFile}"`
  call(cmdStr)

  cmdStr = `cp -a "${buildDir}/${archiveDir}/Products/Applications/${buildObj.xcodeScheme}.app/main.jsbundle" "${buildObj.guiPlatformDir}/"`
  call(cmdStr)
}

function buildAndroid (buildObj) {
  if (fs.existsSync(`${buildObj.guiDir}/google-services.json`)) {
    call(`cp -a ${buildObj.guiDir}/google-services.json ${buildObj.guiPlatformDir}/app/`)
  }

  chdir(buildObj.guiDir)
  // call('react-native bundle --dev false --entry-file index.android.js --bundle-output android/main.jsbundle --platform android')
  // react-native bundle --dev false --entry-file index.android.js --bundle-output android/app/src/main/assets/index.android.bundle --platform android  --assets-dest android/app/src/main/res/
  // call('sed "s/.*versionCode [0-9]\{{10\}}/        versionCode {0}/" airbitz/build.gradle > /tmp/tmp.gradle'.format(ctx.BUILDNUM_ANDROID))

  let gradle = fs.readFileSync(buildObj.guiPlatformDir + '/app/build.gradle', {encoding: 'utf8'})
  // var mystring = '<img src="[media id=5]" />';
  let regex = /versionCode [0-9]{8}/gm
  let newVer = sprintf('versionCode %s', buildObj.buildNum)
  gradle = gradle.replace(regex, newVer)

  regex = /versionName "99.99.99"/gm
  newVer = sprintf('versionName "%s"', buildObj.version)
  gradle = gradle.replace(regex, newVer)

  fs.writeFileSync(buildObj.guiPlatformDir + '/app/build.gradle', gradle)

  process.env.ORG_GRADLE_PROJECT_storeFile = sprintf('/%s/keystores/%s', __dirname, buildObj.androidKeyStore)
  process.env.ORG_GRADLE_PROJECT_storePassword = buildObj.androidKeyStorePassword
  process.env.ORG_GRADLE_PROJECT_keyAlias = buildObj.androidKeyStoreAlias
  process.env.ORG_GRADLE_PROJECT_keyPassword = buildObj.androidKeyStorePassword

  chdir(buildObj.guiPlatformDir)
  call('./gradlew clean')
  call('./gradlew signingReport')
  call(sprintf('./gradlew %s', buildObj.androidTask))

  // Reset gradle file back
  // call('git reset --hard origin/' + buildObj.repoBranch)
  buildObj.ipaFile = buildObj.guiPlatformDir + '/app/build/outputs/apk/release/app-release.apk'
}

function buildCommonPost (buildObj) {
  mylog('\n\nUploading to HockeyApp')
  mylog('**********************\n')
  const url = sprintf('https://rink.hockeyapp.net/api/2/apps/%s/app_versions/upload', buildObj.hockeyAppId)

  let notes = sprintf('##%s\n\n', buildObj.productName)
  notes += sprintf('%s (%s)\n\n', buildObj.version, buildObj.buildNum)
  notes += sprintf('branch: %s\n', buildObj.repoBranch)
  notes += '### Commits\n'
  notes += sprintf('#### airbitz-react-gui Hash: %s\n', buildObj.guiHash)

  for (const dep of buildObj.coreDeps) {
    notes += sprintf('#### %s Version: %s\n', dep.repoName, dep.repoHash)
  }
  // notes += '#### Plugin Hash: {0}\n'.format(self.PLUGIN_HASH))

  let curl = sprintf('/usr/bin/curl -F ipa=@%s -H "X-HockeyAppToken: %s" -F "notes_type=1" -F "status=2" -F "notify=0" -F "tags=%s" -F "notes=%s" ',
    buildObj.ipaFile, buildObj.hockeyAppToken, buildObj.hockeyAppTags, notes)

  if (buildObj.dSymZip !== undefined) {
    curl += sprintf('-F dsym=@%s ', buildObj.dSymZip)
  }

  curl += url

  call(curl)
  mylog('\nUploaded to HockeyApp')
  mylog('\n\nUploading to Bugsnag')
  mylog('*********************\n')

  curl =
    '/usr/bin/curl https://upload.bugsnag.com/ ' +
    `-F apiKey=${buildObj.bugsnagApiKey} ` +
    `-F appVersion=${buildObj.buildNum} ` +
    `-F sourceMap=@${buildObj.bundleMapFile} ` +
    `-F minifiedUrl=${buildObj.bundleUrl} ` +
    `-F minifiedFile=@${buildObj.bundlePath} ` +
    `-F overwrite=true`
  call(curl)

  if (buildObj.dSymFile) {
    const cpa = `cp -a "${buildObj.dSymFile}/Contents/Resources/DWARF/${buildObj.xcodeScheme}" /tmp/`
    call(cpa)
    curl =
      `/usr/bin/curl https://upload.bugsnag.com/ ` +
      `-F dsym=@/tmp/${buildObj.xcodeScheme} ` +
      `-F projectRoot=${buildObj.guiPlatformDir}`
    call(curl)
  }
}

function builddate () {
  const date = new Date()

  const dateStr = sprintf('%d-%02d-%02d', date.getFullYear(), date.getMonth() + 1, date.getDate())
  return dateStr
}

function buildnum (oldBuild = '') {
  const date = new Date()
  const year = date.getFullYear() - 2000
  const month = date.getMonth() + 1
  const day = date.getDate()
  let num = 1

  if (oldBuild !== '') {
    const oldYear = oldBuild.substr(0, 2)
    const oldMonth = oldBuild.substr(2, 2)
    const oldDay = oldBuild.substr(4, 2)
    const oldNum = oldBuild.substr(6, 2)

    if (year === parseInt(oldYear) &&
      month === parseInt(oldMonth) &&
      day === parseInt(oldDay)) {
      let numInt = parseInt(oldNum)
      numInt++
      num = numInt.toString()
    }
  }

  const buildNum = sprintf('%02d%02d%02d%02d', year, month, day, num)

  return buildNum
}

function rmNewline (text) {
  return text.replace(/(\r\n|\n|\r)/gm, '')
}

function chdir (path) {
  console.log('chdir: ' + path)
  _currentPath = path
}

function call (cmdstring) {
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

function cmd (cmdstring) {
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
