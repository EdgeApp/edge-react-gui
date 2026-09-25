pipeline {
  agent { label 'koolaid' }

  options {
    timestamps()
    skipDefaultCheckout true
    disableConcurrentBuilds()
  }

  stages {
    stage('Export Edge Develop for Mac') {
      steps {
        sh '''#!/bin/bash
set -euo pipefail
set +x
if [ -z "${KEYCHAIN_PASSWORD:-}" ]; then
  echo 'Missing Jenkins keychain credential'
  exit 1
fi
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$HOME/Library/Keychains/login.keychain"
security set-keychain-settings -l "$HOME/Library/Keychains/login.keychain"
xcodebuild -exportArchive \
  -archivePath /tmp/edge-mac-export/source.xcarchive \
  -exportPath /tmp/edge-mac-export/output-jenkins \
  -exportOptionsPlist /tmp/edge-mac-export/ExportOptions.plist \
  > /tmp/edge-mac-export/jenkins-export.log 2>&1
mkdir -p "$WORKSPACE/mac-export"
cp /tmp/edge-mac-export/output-jenkins/*.ipa "$WORKSPACE/mac-export/"
'''
        archiveArtifacts artifacts: 'mac-export/*.ipa', fingerprint: true
      }
    }
  }
}
