def build (platform) {
  sh "mkdir -p buildnum temp"
  // Copy the previous build num
  try {
    sh "cp ./buildnum/${platform}.json ./${platform}/buildnum.json"
  } catch(err) {
    println err
  }
  sh "node ./deploy.js edge ${platform} ${BRANCH_NAME}"
  // Save the build num after a successful build
  sh "cp ./${platform}/buildnum.json ./buildnum/${platform}.json"
  // Add the build num and the platform to the description
  def buildnum = readJSON file: "./buildnum/${platform}.json"
  currentBuild.description += "\n${platform}-${buildnum.buildNum}"
}

pipeline {
  agent any
  tools {
    nodejs "stable"
  }
  options {
    timestamps()
    skipDefaultCheckout true
  }
  triggers {
    pollSCM("H/5 * * * *")
  }
  parameters {
    booleanParam(name: 'ANDROID_BUILD', defaultValue: true, description: 'Build an Android version')
    booleanParam(name: 'IOS_BUILD', defaultValue: true, description: 'Build an iOS version')
  }
  environment {
    LC_CTYPE = 'en_US.UTF-8'
  }

  stages {
    stage("Clean the workspace and checkout source") {
      steps {
        deleteDir()
        checkout scm
      }
    }

    stage ("Get version and build number") {
      steps {
        // Import the buildnums from previous build
        copyArtifacts projectName: "${JOB_NAME}", selector: lastCompleted(), optional: true

        // Fix version for branchs that are not "master" or "develop"
        script {
          def packageJson = readJSON file: "./package.json"
          if (
            BRANCH_NAME != "develop" &&
            BRANCH_NAME != "master" &&
            BRANCH_NAME != "test-feta" &&
            BRANCH_NAME != "test-gouda" &&
            BRANCH_NAME != "test-paneer" &&
            BRANCH_NAME != "test" &&
            BRANCH_NAME != "yolo"
          ) {
            def cleanBranch = BRANCH_NAME.replaceAll('/', '-')
            packageJson.version = "${packageJson.version}-${cleanBranch}".inspect()
            writeJSON file: "./package.json", json: packageJson
          }
          def description = "[version] ${packageJson.version}"
          if (BRANCH_NAME == "develop") description += "-d"
          currentBuild.description = description
        }
      }
    }

    stage ("Load credentials") {
      steps {
        // Import the settings files
        withCredentials([
          file(credentialsId: "bfcc847f-213a-4de5-86a5-29b62b34c79d", variable: "deploy_config"),
          file(credentialsId: "94c9f265-a991-432c-9bc4-b74a311f4063", variable: "GoogleService_Info"),
          file(credentialsId: "f1ebd0b2-4e79-4bd4-a290-a3001604c1fc", variable: "google_services"),
          file(credentialsId: "2b938625-9c20-4b64-8c24-ce27543402b6", variable: "edge_release_keystore"),
          file(credentialsId: "05926db4-40f8-42ac-a761-be4e1186ec7a", variable: "env_json"),
        ]) {
          sh "cp ${deploy_config} ./deploy-config.json"
          sh "cp ${GoogleService_Info} ./GoogleService-Info.plist"
          sh "cp ${google_services} ./google-services.json"
          sh "mkdir -p ./keystores"
          sh "cp ${edge_release_keystore} ./keystores/edge-release-keystore.jks"
          sh "cp ${env_json} ./env.json"
        }
      }
    }

    stage ("Install dependencies") {
      steps {
        sh "yarn"
      }
    }

    stage ("Test") {
      steps {
        sh "npm run cover"
      }
    }

    stage ("Build") {
      when {
        anyOf {
          branch 'develop'
          branch 'master'
          branch 'test-feta'
          branch 'test-gouda'
          branch 'test-paneer'
          branch 'test'
          branch 'yolo'
        }
      }
      stages {
        stage("ios") {
          when { equals expected: true, actual: params.IOS_BUILD }
          steps {
            build("ios")
          }
        }
        stage("android") {
          when { equals expected: true, actual: params.ANDROID_BUILD }
          steps {
            build("android")
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
      // Archiving the buildnums for future builds
      archiveArtifacts artifacts: "buildnum/", allowEmptyArchive: true
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
