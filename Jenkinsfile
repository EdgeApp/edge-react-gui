def global = [:]

def preBuildStages(String stageName, versionFile) {
  stage("${stageName}: preBuildStages") {
    echo "Running on ${env.NODE_NAME}"
    deleteDir()
    checkout scm
    sh 'git fetch origin develop && git checkout --detach 5b8686a48c'

    def versionString = "${versionFile.branch} ${versionFile.version} (${versionFile.build})"
    echo "versionString: ${versionString}"
    writeJSON file: './release-version.json', json: versionFile
    currentBuild.description = versionString

    sh 'npm ci'

    // Import the settings files
    withCredentials([file(credentialsId: 'githubSshKey', variable: 'id_github')]) {
        sh "cp ${id_github} ./id_github"
    }

    sh "node -r sucrase/register ./scripts/secretFiles.ts develop ${SECRET_FILES}"
    sh "node -r sucrase/register ./scripts/patchFiles.ts edge develop"

    // Pick the new build number and version from git:
    sh 'node -r sucrase/register ./scripts/updateVersion.ts'

    sh 'npm run prepare'
  }
}

def preTest(String stageName) {
  stage("${stageName}: preTest") {
    sh 'npm test -- --ci'
  }
}

def buildProduction(String stageName) {
  stage("Build ${stageName}") {
    echo "Running on ${env.NODE_NAME}"
    if (env.BRANCH_NAME in ['develop', 'staging', 'master', 'beta', 'test-cheddar', 'test-feta', 'test-gouda', 'test-halloumi', 'test-paneer', 'test-kraft', 'test-colby', 'test-string', 'test-parm', 'test-swiss', 'test', 'testMaestro', 'yolo']) {
      if (stageName == 'ios' && params.IOS_BUILD) {
        sh 'npm run prepare.ios'
        sh "node -r sucrase/register ./scripts/deploy.ts edge ios ${BRANCH_NAME}"
      }
      if (stageName == 'android' && params.ANDROID_BUILD) {
        sh "node -r sucrase/register ./scripts/deploy.ts edge android ${BRANCH_NAME}"
      }
    }
  }
}

def buildMaestro(String stageName) {
  stage("Build Maestro ${stageName}") {
    if (env.BRANCH_NAME in ['develop', 'staging', 'master', 'beta', 'testMaestro']) {
      if (stageName == 'ios' && params.IOS_BUILD_MAESTRO) {
        echo "Running on ${env.NODE_NAME}"
        sh 'npm run prepare.ios'
        sh "node -r sucrase/register ./scripts/deploy.ts edge ios ${BRANCH_NAME} maestro"
      }
      if (stageName == 'android' && params.ANDROID_BUILD_MAESTRO) {
        echo "Running on ${env.NODE_NAME}"
        sh "node -r sucrase/register ./scripts/deploy.ts edge android ${BRANCH_NAME} maestro"
      }
    }
  }
}

pipeline {
  agent none

  tools {
    jdk '17'
    nodejs '22'
  }
  options {
    timestamps()
    skipDefaultCheckout true
    overrideIndexTriggers true
    buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '7', numToKeepStr: '10')
    disableConcurrentBuilds()
  }
  parameters {
    booleanParam(name: 'ANDROID_BUILD', defaultValue: true, description: 'Build an Android version')
    booleanParam(name: 'ANDROID_BUILD_MAESTRO', defaultValue: true, description: 'Build an Android Maestro version')
    booleanParam(name: 'IOS_BUILD', defaultValue: true, description: 'Build an iOS version')
    booleanParam(name: 'IOS_BUILD_MAESTRO', defaultValue: true, description: 'Build an iOS simulator Maestro version')
    booleanParam(name: 'VERBOSE', defaultValue: false, description: 'Complete build log output')
  }
  environment {
    LC_CTYPE = 'en_US.UTF-8'
    DISABLE_XCPRETTY = "${params.VERBOSE}"
  }

  stages {
    stage('Preparation') {
      agent { label 'ios-build || android-build' }
      steps {
        script {
          echo "Running on ${env.NODE_NAME}"
          deleteDir()
          checkout scm
          sh 'git fetch origin develop && git checkout --detach 5b8686a48c'

          // Import the settings files
          withCredentials([file(credentialsId: 'githubSshKey', variable: 'id_github')]) {
            sh "cp ${id_github} ./id_github"
          }

          // Install Sucrase so gitVersionFile.ts can run before the full npm ci below
          sh 'npm install --save-dev sucrase'
          sh "node -r sucrase/register ./scripts/gitVersionFile.ts ${BRANCH_NAME}"

          def versionFile = readJSON file: './release-version.json'
          global.versionFile = versionFile
          echo "Created version file: ${global.versionFile.branch} ${global.versionFile.version} (${global.versionFile.build})"
        }
      }
    }

    stage('IOS Device Maestro') {
      agent { label 'ios-build' }
      steps {
        script {
          preBuildStages('IOS', global.versionFile)
          preTest('IOS')
          sh '''python3 - <<'PYONE'
import json
from pathlib import Path

config_path = Path('deploy-config.json')
config = json.loads(config_path.read_text())
ios = config['edge']['ios']
develop = ios['develop']
test_maestro = ios['testMaestro']
assert develop['bundleId'] == 'app.edge.develop'
assert test_maestro.get('zealotMaestroChannelKey')
ios['testMaestro'] = {
  **develop,
  'zealotChannelKey': test_maestro['zealotMaestroChannelKey'],
  'zealotMaestroChannelKey': test_maestro['zealotMaestroChannelKey'],
  'rsyncLocation': None,
  'hockeyAppId': None,
  'hockeyAppToken': None
}
config_path.write_text(json.dumps(config))

env_path = Path('env.json')
env = json.loads(env_path.read_text())
env['ENABLE_MAESTRO_BUILD'] = True
env['ENABLE_TEST_SERVERS'] = True
env_path.write_text(json.dumps(env))

deploy_path = Path('scripts/deploy.ts')
deploy = deploy_path.read_text()
needle = '  if (!nukedTypes.has(nukeType)) {'
assert deploy.count(needle) == 1
deploy = deploy.replace(
  needle,
  "  throw new Error('One-off build stopped before certificate revocation')" + chr(10) + needle
)
deploy_path.write_text(deploy)
PYONE'''
          sh 'npm run prepare.ios'
          try {
            sh 'node -r sucrase/register ./scripts/deploy.ts edge ios testMaestro'
          } finally {
            archiveArtifacts artifacts: 'temp/*.ipa', allowEmptyArchive: true, fingerprint: true
          }
        }
      }
    }
  }

  post {
    success {
      echo 'The force is strong with this one'
    }
    unstable {
      echo 'Do or do not there is no try'
    }
    failure {
      echo 'The dark side I sense in you.'
    }
  }
}
