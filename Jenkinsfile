pipeline {
  agent any
  tools {
    nodejs "stable"
  }
  options {
    timestamps()
    skipDefaultCheckout true
    overrideIndexTriggers false
    buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '7', numToKeepStr: '10')
    disableConcurrentBuilds()
  }
  triggers {
    pollSCM("H/5 * * * *")
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
    stage("Clean the workspace and checkout source") {
      steps {
        deleteDir()
        checkout scm
      }
    }

    stage ("Install dependencies") {
      steps {
        sh "yarn"
      }
    }

    stage ("Get secret files") {
      steps {
        // Import the settings files
        withCredentials([
          file(credentialsId: "githubSshKey", variable: "id_github"),
        ]) {
          sh "cp ${id_github} ./id_github"
        }

        sh "node -r sucrase/register ./scripts/secretFiles.ts ${BRANCH_NAME} ${SECRET_FILES}"
      }
    }

    stage ("Patch files") {
      steps {
        sh "node -r sucrase/register ./scripts/patchFiles.ts edge ${BRANCH_NAME}"
      }
    }

    stage ("Get build number and version") {
      steps {
        // Pick the new build number and version from git:
        sh "node -r sucrase/register ./scripts/gitVersionFile.ts ${BRANCH_NAME}"

        // Update our description:
        script {
          def versionFile = readJSON file: "./release-version.json"
          currentBuild.description = "version: ${versionFile.version} (${versionFile.build})"
        }
      }
    }

    stage ("Pre-build") {
      steps {
        sh "yarn prepare"
      }
    }

    stage ("Test") {
      steps {
        sh "JEST_JENKINS=1 yarn cover --ci"
      }
    }

    stage ("Build") {
      when {
        anyOf {
          branch 'develop'
          branch 'staging'
          branch 'master'
          branch 'beta'
          branch 'test-cheddar'
          branch 'test-feta'
          branch 'test-gouda'
          branch 'test-halloumi'
          branch 'test-paneer'
          branch 'test'
          branch 'yolo'
          branch 'coinhub'
        }
      }
      stages {
        stage("ios") {
          when { equals expected: true, actual: params.IOS_BUILD }
          steps {
            sh "npm run prepare.ios"
            sh "node -r sucrase/register ./scripts/deploy.ts edge ios ${BRANCH_NAME}"
          }
        }
        stage("android") {
          when { equals expected: true, actual: params.ANDROID_BUILD }
          steps {
            sh "node -r sucrase/register ./scripts/deploy.ts edge android ${BRANCH_NAME}"
          }
        }
      }
    }
  }

  post {
    always {
      echo 'Trying to publish the test report'
      junit healthScaleFactor: 100.0, testResults: '**/coverage/junit.xml', allowEmptyResults: true
      echo 'Trying to publish the code coverage report'
      cobertura(
        coberturaReportFile: '**/coverage/cobertura-coverage.xml',
        failUnhealthy: false,
        failNoReports: false,
        failUnstable: false,
        onlyStable: false,
        zoomCoverageChart: false,
        conditionalCoverageTargets: '70, 0, 0',
        lineCoverageTargets: '70, 0, 0',
        methodCoverageTargets: '70, 0, 0',
        maxNumberOfBuilds: 0,
        sourceEncoding: 'ASCII'
      )
    }
    success {
      echo "The force is strong with this one"
      deleteDir()
    }
    unstable {
      echo "Do or do not there is no try"
    }
    failure {
      echo "The dark side I sense in you."
    }
  }
}
