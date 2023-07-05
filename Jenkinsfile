def preBuildStages(String stageName) {
  stage("${stageName}: preBuildStages") {
    deleteDir()
    checkout scm

    sh 'yarn'

    // Import the settings files
    withCredentials([file(credentialsId: 'githubSshKey', variable: 'id_github')]) {
        sh "cp ${id_github} ./id_github"
    }

    sh "node -r sucrase/register ./scripts/secretFiles.ts ${BRANCH_NAME} ${SECRET_FILES}"
    sh "node -r sucrase/register ./scripts/patchFiles.ts edge ${BRANCH_NAME}"

    // Pick the new build number and version from git:
    sh "node -r sucrase/register ./scripts/gitVersionFile.ts ${BRANCH_NAME}"

    // Update our description:
    def versionFile = readJSON file: './release-version.json'
    currentBuild.description = "version: ${versionFile.version} (${versionFile.build})"

    sh 'yarn prepare'
    sh 'yarn test --ci'
  }
}

def buildProduction(String stageName) {
  stage("Build ${stageName}") {
    if (env.BRANCH_NAME in ['develop', 'staging', 'master', 'beta', 'test-cheddar', 'test-feta', 'test-gouda', 'test-halloumi', 'test-paneer', 'test', 'yolo']) {
      if (stageName == 'ios' && params.IOS_BUILD) {
        sh 'npm run prepare.ios'
        sh "node -r sucrase/register ./scripts/deploy.ts edge ios ${BRANCH_NAME}"
      }
      if (stageName == 'android' && params.ANDROID_BUILD) {
        sh "node -r sucrase/register ./scripts/deploy.ts edge android ${BRANCH_NAME}"
      }
    }
  }
  deleteDir()
}

pipeline {
  agent none
  tools {
    nodejs 'stable'
  }
  options {
    timestamps()
    skipDefaultCheckout true
    overrideIndexTriggers false
    buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '7', numToKeepStr: '10')
    disableConcurrentBuilds()
  }
  triggers {
    pollSCM('H/2 * * * *')
  }
  parameters {
    booleanParam(name: 'ANDROID_BUILD', defaultValue: true, description: 'Build an Android version')
    booleanParam(name: 'IOS_BUILD', defaultValue: true, description: 'Build an iOS version')
    booleanParam(name: 'VERBOSE', defaultValue: false, description: 'Complete build log output')
  }
  environment {
    LC_CTYPE = 'en_US.UTF-8'
    DISABLE_XCPRETTY = "${params.VERBOSE}"
  }

  stages {
    stage('Parallel Stage') {
      parallel {
        stage('IOS Build') {
          agent { label 'ios-build' }
          steps {
            script {
              preBuildStages('IOS')
              buildProduction('ios')
            }
          }
        }
        stage('Android Build') {
          agent { label 'android-build' }
          steps {
            script {
              preBuildStages('Android')
              buildProduction('android')
            }
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
