import childProcess from 'child_process'
import fs from 'fs'
import { join } from 'path'
import { sprintf } from 'sprintf-js'

const LATEST_TEST_FILE = 'latestTestFile.json'
const argv = process.argv
const mylog = console.log

const _rootProjectDir = join(__dirname, '../')
const githubSshKey = process.env.GITHUB_SSH_KEY ?? join(_rootProjectDir, 'id_github')

let _currentPath = __dirname
const baseDir = join(_currentPath, '..')

/**
 * Things we expect to be set in the config file:
 */
interface BuildConfigFile {
  // Common build options:
  envJson: { [repoBranch: string]: object }

  // Android build options:
  androidKeyStore: string
  androidKeyStoreAlias: string
  androidKeyStorePassword: string
  androidTask: string

  // iOS build options:
  appleDeveloperTeamId: string
  appleDeveloperTeamName: string
  xcodeScheme: string
  xcodeWorkspace: string
  bundleId: string

  // Upload options:
  appCenterApiToken: string
  appCenterAppName: string
  appCenterDistroGroup: string
  appCenterGroupName: string
  bugsnagApiKey: string
  hockeyAppId: string
  hockeyAppTags: string
  hockeyAppToken: string
  productName: string
  projectName: string
  rsyncLocation?: string
  testRepoUrl?: string
}

/**
 * These are basically global variables:
 */
interface BuildObj extends BuildConfigFile {
  // Set in makeCommonPre:
  guiDir: string
  guiPlatformDir: string
  platformType: string // 'android' | 'ios'
  simBuild: boolean
  repoBranch: string // 'develop' | 'master' | 'test'
  tmpDir: string
  buildArchivesDir: string
  bundleToolPath: string
  productNameClean: string

  // Set in makeCommonPost:
  buildNum: string
  bundleMapFile: string
  bundlePath: string
  bundleUrl: string
  guiHash: string
  version: string

  // Set in build steps:
  dSymFile: string
  dSymZip: string
  ipaFile: string // Also APK
}

interface LatestTestFile {
  platformType: string
  branch: string
  buildNum: string
  version: string
  filePath: string
  gitHash: string
}

main()

function main() {
  if (argv.length < 4) {
    mylog('Usage: node -r sucrase/register deploy.ts [project] [platform] [branch]')
    mylog('  project options: edge')
    mylog('  platform options: ios, android, ios-sim')
    mylog('  branch options: master, develop')
  }

  const buildObj: BuildObj = {} as any

  makeCommonPre(argv, buildObj)
  makeProject(buildObj)
  makeCommonPost(buildObj)

  // buildCommonPre()
  if (buildObj.platformType === 'ios') {
    if (buildObj.simBuild) {
      buildIosSim(buildObj)
    } else {
      buildIos(buildObj)
    }
  } else if (buildObj.platformType === 'android') {
    buildAndroid(buildObj)
  }
  buildCommonPost(buildObj)
}

function makeCommonPre(argv: string[], buildObj: BuildObj) {
  buildObj.guiDir = _rootProjectDir
  buildObj.repoBranch = argv[4] // master or develop
  buildObj.platformType = argv[3] === 'ios-sim' ? 'ios' : argv[3] // ios or android
  buildObj.simBuild = argv[3] === 'ios-sim'
  buildObj.projectName = argv[2]
  buildObj.guiPlatformDir = buildObj.guiDir + buildObj.platformType
  buildObj.tmpDir = `${buildObj.guiDir}temp`
  buildObj.buildArchivesDir = '/Users/jenkins/buildArchives'
}

function makeProject(buildObj: BuildObj) {
  const project = buildObj.projectName
  const config = JSON.parse(fs.readFileSync(`${buildObj.guiDir}/deploy-config.json`, 'utf8'))

  Object.assign(buildObj, config[project])
  Object.assign(buildObj, config[project][buildObj.platformType])
  Object.assign(buildObj, config[project][buildObj.platformType][buildObj.repoBranch])

  console.log(buildObj)
}

function makeCommonPost(buildObj: BuildObj) {
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
  buildObj.productNameClean = buildObj.productName.replace(' ', '')
}

// function buildCommonPre() {
//   call('npm install -g appcenter-cli')
// }

function buildIos(buildObj: BuildObj) {
  chdir(buildObj.guiDir)
  if (
    process.env.BUILD_REPO_URL &&
    process.env.FASTLANE_USER != null &&
    process.env.FASTLANE_PASSWORD != null &&
    // process.env.GITHUB_SSH_KEY != null &&
    process.env.HOME != null &&
    process.env.MATCH_KEYCHAIN_PASSWORD != null &&
    process.env.MATCH_PASSWORD != null
  ) {
    call(`security unlock-keychain -p '${process.env.KEYCHAIN_PASSWORD ?? ''}' "${process.env.HOME ?? ''}/Library/Keychains/login.keychain"`)
    call(`security set-keychain-settings -l ${process.env.HOME ?? ''}/Library/Keychains/login.keychain`)

    mylog('Using Fastlane for provisioning profiles')
    const matchFileLoc = join(buildObj.guiDir, '.fastlane', 'Matchfile')
    let matchFile = fs.readFileSync(matchFileLoc, { encoding: 'utf8' })
    matchFile = matchFile.replace('BUILD_REPO_URL', process.env.BUILD_REPO_URL)
    fs.writeFileSync(matchFileLoc, matchFile, { encoding: 'utf8' })
    const profileDir = join(process.env.HOME, 'Library', 'MobileDevice', 'Provisioning Profiles')
    call(`rm -rf ${escapePath(profileDir)}`)
    call(
      `GIT_SSH_COMMAND="ssh -i ${githubSshKey}" fastlane match adhoc --git_branch="${buildObj.appleDeveloperTeamName}" -a ${buildObj.bundleId} --team_id ${buildObj.appleDeveloperTeamId}`
    )
    call(
      `GIT_SSH_COMMAND="ssh -i ${githubSshKey}" fastlane match development --git_branch="${buildObj.appleDeveloperTeamName}" -a ${buildObj.bundleId} --team_id ${buildObj.appleDeveloperTeamId}`
    )
    call(
      `GIT_SSH_COMMAND="ssh -i ${githubSshKey}" fastlane match appstore --git_branch="${buildObj.appleDeveloperTeamName}" -a ${buildObj.bundleId} --team_id ${buildObj.appleDeveloperTeamId}`
    )
  } else {
    mylog('Missing or incomplete Fastlane params. Not using Fastlane')
  }

  const patchDir = getPatchDir(buildObj)
  if (fs.existsSync(join(patchDir, 'GoogleService-Info.plist'))) {
    call(`cp -a ${join(patchDir, 'GoogleService-Info.plist')} ios/edge/`)
  } else if (fs.existsSync(`${buildObj.guiDir}/GoogleService-Info.plist`)) {
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

  cmdStr = `security unlock-keychain -p '${process.env.KEYCHAIN_PASSWORD ?? ''}' "${process.env.HOME ?? ''}/Library/Keychains/login.keychain"`
  call(cmdStr)

  call(`security set-keychain-settings -l ${process.env.HOME ?? ''}/Library/Keychains/login.keychain`)

  cmdStr = `xcodebuild -allowProvisioningUpdates -workspace ${buildObj.xcodeWorkspace} -scheme ${buildObj.xcodeScheme} archive`
  if (process.env.DISABLE_XCPRETTY === 'false') cmdStr = cmdStr + ' | xcpretty'
  cmdStr = cmdStr + ' && exit ${PIPE' + 'STATUS[0]}'
  call(cmdStr)

  const buildDate = builddate()
  const buildDir = `${process.env.HOME || ''}/Library/Developer/Xcode/Archives/${buildDate}`

  chdir(buildDir)
  let archiveDir = cmd('ls -t')
  const archiveDirArray = archiveDir.split('\n')
  archiveDir = archiveDirArray[0]

  buildObj.dSymFile = escapePath(`${buildDir}/${archiveDir}/dSYMs/${buildObj.productName}.app.dSYM`)
  // const appFile = sprintf('%s/%s/Products/Applications/%s.app', buildDir, archiveDir, buildObj.xcodeScheme)
  buildObj.dSymZip = escapePath(
    `${buildObj.tmpDir}/${buildObj.productNameClean}-${buildObj.repoBranch}-${buildObj.buildNum}-${buildObj.guiHash.slice(0, 8)}.dSYM.zip`
  )
  buildObj.ipaFile = escapePath(
    `${buildObj.tmpDir}/${buildObj.productNameClean}-${buildObj.repoBranch}-${buildObj.buildNum}-${buildObj.guiHash.slice(0, 8)}.ipa`
  )

  if (fs.existsSync(buildObj.ipaFile)) {
    call('rm ' + buildObj.ipaFile)
  }

  if (fs.existsSync(buildObj.dSymZip)) {
    call('rm ' + buildObj.dSymZip)
  }

  mylog('Creating IPA for ' + buildObj.xcodeScheme)
  chdir(buildObj.guiPlatformDir)

  // Replace TeamID in exportOptions.plist
  let plist = fs.readFileSync(buildObj.guiPlatformDir + '/exportOptions.plist', { encoding: 'utf8' })
  plist = plist.replace('Your10CharacterTeamId', buildObj.appleDeveloperTeamId)
  fs.writeFileSync(buildObj.guiPlatformDir + '/exportOptions.plist', plist)

  cmdStr = `security unlock-keychain -p '${process.env.KEYCHAIN_PASSWORD ?? ''}'  "${process.env.HOME ?? ''}/Library/Keychains/login.keychain"`
  call(cmdStr)

  call(`security set-keychain-settings -l ${process.env.HOME ?? ''}/Library/Keychains/login.keychain`)

  cmdStr = `xcodebuild -allowProvisioningUpdates -exportArchive -archivePath "${buildDir}/${archiveDir}" -exportPath ${buildObj.tmpDir}/ -exportOptionsPlist ./exportOptions.plist`
  call(cmdStr)

  mylog('Zipping dSYM for ' + buildObj.xcodeScheme)
  cmdStr = `/usr/bin/zip -r ${buildObj.dSymZip} ${buildObj.dSymFile}`
  call(cmdStr)

  mylog(`Renaming IPA file to ${buildObj.ipaFile}`)
  const buildOutputIpaFile = `${buildObj.tmpDir}/${buildObj.productName}.ipa`
  fs.renameSync(buildOutputIpaFile, buildObj.ipaFile)

  cmdStr = `cp -a "${buildDir}/${archiveDir}/Products/Applications/${buildObj.productName}.app/main.jsbundle" ${buildObj.guiPlatformDir}/`
  call(cmdStr)

  // Do not update the testRepo for production iOS builds. Only simulator builds are usable for testing
  buildObj.testRepoUrl = undefined
}

function buildIosSim(buildObj: BuildObj) {
  const { buildNum, guiDir, guiHash, guiPlatformDir, productName, productNameClean, repoBranch, tmpDir, xcodeScheme, xcodeWorkspace } = buildObj

  chdir(guiDir)

  const patchDir = getPatchDir(buildObj)
  if (fs.existsSync(join(patchDir, 'GoogleService-Info.plist'))) {
    call(`cp -a ${join(patchDir, 'GoogleService-Info.plist')} ios/edge/`)
  } else if (fs.existsSync(`${guiDir}/GoogleService-Info.plist`)) {
    call(`cp -a ${guiDir}/GoogleService-Info.plist ${guiPlatformDir}/edge/`)
  }
  const buildDir = `${tmpDir}/derivedData`

  chdir(guiPlatformDir)

  let cmdStr
  cmdStr = `xcodebuild -workspace ${xcodeWorkspace} -scheme ${xcodeScheme} -sdk iphonesimulator -configuration Release -derivedDataPath ${buildDir}`
  if (process.env.DISABLE_XCPRETTY === 'false') cmdStr = cmdStr + ' | xcpretty'
  cmdStr = cmdStr + ' && exit ${PIPE' + 'STATUS[0]}'
  call(cmdStr)

  const appFile = escapePath(`${productName}.app`)
  const appFileDir = escapePath(`${buildDir}/Build/Products/Release-iphonesimulator/`)

  buildObj.ipaFile = escapePath(`${tmpDir}/${productNameClean}-${repoBranch}-${buildNum}-${guiHash.slice(0, 8)}.zip`)
  if (fs.existsSync(buildObj.ipaFile)) {
    call('rm ' + buildObj.ipaFile)
  }

  mylog('Creating Zipped .app for ' + xcodeScheme)
  chdir(appFileDir)
  cmdStr = `/usr/bin/zip -r ${buildObj.ipaFile} ./${appFile}`
  call(cmdStr)
}

function buildAndroid(buildObj: BuildObj) {
  const {
    buildArchivesDir,
    buildNum,
    platformType,
    repoBranch,
    guiPlatformDir,
    bundleToolPath,
    androidKeyStore,
    androidKeyStoreAlias,
    androidKeyStorePassword
  } = buildObj

  const keyStoreFile = join('/', _rootProjectDir, 'keystores', androidKeyStore)
  const patchDir = getPatchDir(buildObj)

  if (fs.existsSync(join(patchDir, 'google-services.json'))) {
    call(`cp -a ${join(patchDir, 'google-services.json')} android/app/`)
  } else if (fs.existsSync(`${buildObj.guiDir}/google-services.json`)) {
    call(`cp -a ${buildObj.guiDir}/google-services.json ${buildObj.guiPlatformDir}/app/`)
  }

  chdir(buildObj.guiDir)

  process.env.ORG_GRADLE_PROJECT_storeFile = keyStoreFile
  process.env.ORG_GRADLE_PROJECT_storePassword = buildObj.androidKeyStorePassword
  process.env.ORG_GRADLE_PROJECT_keyAlias = buildObj.androidKeyStoreAlias
  process.env.ORG_GRADLE_PROJECT_keyPassword = buildObj.androidKeyStorePassword

  chdir(buildObj.guiPlatformDir)
  call('./gradlew clean')
  call('./gradlew signingReport')
  call(sprintf('./gradlew %s', buildObj.androidTask))

  // Process the AAB files created into APK format and place in archive directory
  const outfile = `${buildObj.productNameClean}-${buildObj.repoBranch}-${buildObj.buildNum}`
  const archiveDir = join(buildArchivesDir, repoBranch, platformType, String(buildNum))
  fs.mkdirSync(archiveDir, { recursive: true })
  const aabPath = join(archiveDir, `${outfile}.aab`)
  const apksPath = join(archiveDir, `${outfile}.apks`)
  const apkPathDir = join(archiveDir, `${outfile}_apk_container`)
  fs.copyFileSync(join(guiPlatformDir, '/app/build/outputs/bundle/release/app-release.aab'), aabPath)

  call(
    `java -jar ${bundleToolPath} build-apks --overwrite --mode=universal --bundle=${aabPath} --output=${apksPath} --ks=${keyStoreFile} --ks-key-alias=${androidKeyStoreAlias} --ks-pass=pass:${androidKeyStorePassword}`
  )
  call(`unzip ${apksPath} -d ${apkPathDir}`)

  const universalApk = join(apkPathDir, 'universal.apk')
  buildObj.ipaFile = join(apkPathDir, `${outfile}.apk`)
  fs.renameSync(universalApk, buildObj.ipaFile)
}

function buildCommonPost(buildObj: BuildObj) {
  const { simBuild } = buildObj
  let curl
  const notes = `${buildObj.productName} ${buildObj.version} (${buildObj.buildNum}) branch: ${buildObj.repoBranch} #${buildObj.guiHash}`

  if (buildObj.hockeyAppToken && buildObj.hockeyAppId && !simBuild) {
    mylog('\n\nUploading to HockeyApp')
    mylog('**********************\n')
    const url = sprintf('https://rink.hockeyapp.net/api/2/apps/%s/app_versions/upload', buildObj.hockeyAppId)

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

  if (buildObj.bugsnagApiKey && buildObj.dSymFile && !simBuild) {
    mylog('\n\nUploading to Bugsnag')
    mylog('*********************\n')

    const cpa = `cp -a ${buildObj.dSymFile}/Contents/Resources/DWARF/${escapePath(buildObj.productName)} ${buildObj.tmpDir}/`
    call(cpa)
    curl =
      '/usr/bin/curl https://upload.bugsnag.com/ ' +
      `-F dsym=@${buildObj.tmpDir}/${escapePath(buildObj.productName)} ` +
      `-F projectRoot=${buildObj.guiPlatformDir}`
    call(curl)
  }

  if (buildObj.appCenterApiToken && buildObj.appCenterAppName && buildObj.appCenterGroupName && !simBuild) {
    mylog('\n\nUploading to App Center')
    mylog('***********************\n')

    call(
      `npx appcenter distribute release --app ${buildObj.appCenterGroupName}/${buildObj.appCenterAppName} --file ${buildObj.ipaFile} --token ${
        buildObj.appCenterApiToken
      } -g ${buildObj.appCenterDistroGroup} -r ${JSON.stringify(notes)}`
    )
    mylog('\n*** Upload to App Center Complete ***')
  }

  if (buildObj.rsyncLocation != null) {
    const { buildNum, guiHash, platformType, productNameClean, repoBranch, testRepoUrl, version } = buildObj

    mylog(`\n\nUploading to rsyncLocation ${buildObj.rsyncLocation}`)
    mylog('***********************************************************************\n')

    const datePrefix = new Date().toISOString().slice(2, 19).replace(/:/gi, '').replace(/-/gi, '')
    const [fileExtension] = buildObj.ipaFile.split('.').reverse()
    const rsyncFile = escapePath(`${datePrefix}--${productNameClean}--${platformType}--${repoBranch}--${buildNum}--${guiHash.slice(0, 8)}.${fileExtension}`)

    const rsyncFilePath = join(buildObj.rsyncLocation, rsyncFile)
    call(`rsync -avz -e "ssh -i ${githubSshKey}" ${buildObj.ipaFile} ${rsyncFilePath}`)
    mylog('\n*** Upload to rsyncLocation Complete ***')

    if (testRepoUrl != null) {
      mylog(`\n\nUpdating test repo ${buildObj.testRepoUrl}`)
      mylog('***********************************************************\n')

      const pathTemp = testRepoUrl.split('/')
      const repo = pathTemp[pathTemp.length - 1].replace('.git', '')
      const repoPath = join(baseDir, repo)
      const testFilePath = join(repoPath, LATEST_TEST_FILE)

      let retries = 10
      let success = false
      while (--retries > 0) {
        if (fs.existsSync(repoPath)) {
          call(`rm -rf ${repoPath}`)
        }

        chdir(baseDir)
        call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git clone ${testRepoUrl}`)

        const latestTestFileObj: LatestTestFile = {
          platformType,
          branch: repoBranch,
          buildNum,
          version,
          filePath: rsyncFilePath,
          gitHash: guiHash
        }

        const platformBranch = `${repoBranch}/${platformType}`
        chdir(repoPath)
        try {
          call(`git checkout -b ${platformBranch} origin/${platformBranch}`)
        } catch (e) {
          call(`git checkout -b ${platformBranch}`)
        }

        const latestTestFileString = JSON.stringify(latestTestFileObj, null, 2)
        fs.writeFileSync(testFilePath, latestTestFileString, { encoding: 'utf8' })

        call(`git add ${LATEST_TEST_FILE}`)
        call(`git commit -m "latestTestFile. ${buildNum} ${version} ${guiHash} ${platformBranch}"`)
        try {
          call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git push -u origin ${platformBranch}`)
          success = true
          break
        } catch (e: any) {
          console.log('Error pushing version file...')
        }
      }
      if (success) {
        mylog('\n*** Updating test repo Complete ***')
      } else {
        mylog('\n*** Updating test repo FAILED ***')
        throw new Error('Updating test repo FAILED')
      }
    }
  }
}

function builddate() {
  const date = new Date()

  const dateStr = sprintf('%d-%02d-%02d', date.getFullYear(), date.getMonth() + 1, date.getDate())
  return dateStr
}

function rmNewline(text: string) {
  return text.replace(/(\r\n|\n|\r)/gm, '')
}

function chdir(path: string) {
  console.log('chdir: ' + path)
  _currentPath = path
}

function call(cmdstring: string) {
  console.log('call: ' + cmdstring)
  childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    stdio: 'inherit',
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  })
}

function cmd(cmdstring: string) {
  console.log('cmd: ' + cmdstring)
  const r = childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  })
  return r
}

function getPatchDir(buildObj: BuildObj): string {
  const { projectName, guiDir, repoBranch } = buildObj
  return join(guiDir, 'deployPatches', projectName, repoBranch)
}

function escapePath(path: string): string {
  return path.replace(/(\s+)/g, '\\$1')
}
