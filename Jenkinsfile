def build (platform) {
  // Copy the previous build num
  catchError {
    sh "cp ./buildnum/${platform}.json ./${platform}/buildnum.json"
  }
  sh "node ./deploy.js edge ${platform} ${BRANCH_NAME}"
  // Save the build num after a successful build
  sh 'mkdir -p buildnum'
  sh "cp ./${platform}/buildnum.json ./buildnum/${platform}.json"
}

pipeline {
  agent any
  tools {
    nodejs "v8.9.3"
  }
  options {
    timestamps()
    skipDefaultCheckout true
  }
  
  stages {
    stage("Setup the workspace and checkout source") {
      steps {
        deleteDir()
        checkout scm
      }
    }

    stage ("Set version") {
      steps {
        script {
          // The "master" and "develop" branches are handled in the deploy script so the rest are handled here
          if (BRANCH_NAME != "master" && BRANCH_NAME != "develop") {
            def packageJson = readJSON file: "./package.json"
            packageJson.version = "${package.version}-${BRANCH_NAME}"
            writeJSON file: "./package.json", json: packageJson
          }
        }
      }
    }

    stage ("Load configuration files") {
      steps {
        // Import the buildnums from previous build
        copyArtifacts projectName: "${JOB_NAME}", selector: lastCompleted(), optional: true
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
    
    stage ("install dependencies") {
      steps {
        sh "yarn"
      }
    }

    stage ("test") {
      steps {
        sh "npm test"
      }
    }

    stage ("Build") {
      parallel {
        stage("ios") {
          steps {
            build("ios")
          }
        }
        stage("android") {
          steps {
            build("android")
          }
        }
      }
    }
  }
  
  post {
    always {
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