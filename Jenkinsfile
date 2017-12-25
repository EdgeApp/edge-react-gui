node {
  stage ('Set Clean Environment') {
    deleteDir()    
  }
  
  stage ('checkout') {
    checkout scm
    sh 'rm ./package-lock.json'
  }

  stage ('Get env.json file') {
    withCredentials([file(credentialsId: 'e8032027-1c74-4a4e-a4e0-26f0ff67fc1d', variable: 'file')]) {
      sh 'cp ${file} ./env.json'
    }
  }
  // General Settings
  def repoBranch = env.BRANCH_NAME
  def props = readJSON file: './package.json'
  def version = props.version
  def productName = 'Edge Wallet'

  // Hockey App Settings
  def hockeyAppToken = ''
  def hockeyAppTags = ''
  withCredentials([string(credentialsId: 'hockeyAppToken', variable: 'token')]) {
    hockeyAppToken = token
  }
  withCredentials([string(credentialsId: 'hockeyAppTags', variable: 'token')]) {
    hockeyAppTags = token
  }
  
  // ios settings
  def xcodeProject = 'edge.xcodeproj'
  def xcodeScheme = 'edge'
  def hockeyAppIdIos = ''
  withCredentials([string(credentialsId: 'hockeyAppIdIos', variable: 'token')]) {
    hockeyAppIdIos = token
  }
  def guiPlatformDirIos = './ios'

  // android settings
  def androidTask = 'assembleRelease'
  def androidKeyStore = 'edge-release-keystore.jks'
  def androidKeyStoreAlias = 'edge'
  def androidKeyStorePassword = ''
  withCredentials([string(credentialsId: 'androidKeyStorePassword', variable: 'token')]) {
    androidKeyStorePassword = token
  }
  def hockeyAppIdAndroid = ''
  withCredentials([string(credentialsId: 'hockeyAppIdAndroid', variable: 'token')]) {
    hockeyAppIdAndroid = token
  }
  def guiPlatformDirAndroid = './android'
  
  // External modules directory settings
  def coreBuildDir = '/../../airbitz-core-js-develop'
  def pluginsDir = '/../../airbitz-plugins-develop'

  // Change settings for develop branch
  if (repoBranch == 'develop') {
    androidTask = 'assembleDevelopRelease'
    coreBuildDir = '/../../airbitz-core-js-develop'
    pluginsDir = '/../../airbitz-plugins-develop'
  }

  try {    
    stage ('install dependencies') {
      sh 'npm i'
    }

    // stage ('test') {
    //   sh 'npm test'
    // }
    
    stage('build') {
      parallel(
        ios: {
          echo 'Building IOS'
          // echo 'Bug fixes for React Native 0.46'
          // sh('mkdir -p node_modules/react-native/scripts/')
          // sh('mkdir -p node_modules/react-native/packager/')
          // sh('cp -a node_modules/react-native/scripts/* node_modules/react-native/packager/')
          // sh('cp -a node_modules/react-native/packager/* node_modules/react-native/scripts/')
          // sh('cp -a ../third-party node_modules/react-native/')
          // chdir(buildObj.guiDir + '/node_modules/react-native/third-party/glog-0.3.4')
          // sh('../../scripts/ios-configure-glog.sh')
        },
        android: {
          echo 'Building Android'
          sh 'react-native bundle --dev false --entry-file index.android.js --bundle-output android/main.jsbundle --platform android'
          sh './android/gradlew clean'
          // sh './gradlew signingReport'
          sh "./android/gradlew ${androidTask}"
        }
      )
    }

    stage ('Cleanup') {
      deleteDir()    
      currentBuild.result = "SUCCESS"
    }
  }
  catch(err) {
    // Do not add a stage here.
    // When 'stage' commands are run in a different order than the previous run
    // the history is hidden since the rendering plugin assumes that the system has changed and
    // that the old runs are irrelevant. As such adding a stage at this point will trigger a
    // 'change of the system' each time a run fails.
    println 'Something went wrong!'
    println err
    currentBuild.result = "FAILURE"
  }
  finally {
    println 'Fin'
  }
}