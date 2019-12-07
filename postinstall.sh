#!/bin/bash

mkdir -p temp

# Remove inclusion of c++_shared.so library since we are using jsc-android which already includes it
sed "s/\,[[:space:]]'-DANDROID_STL=c++_shared'//g" ./node_modules/react-native-fast-crypto/android/build.gradle > temp/build.gradle
mv temp/build.gradle ./node_modules/react-native-fast-crypto/android/build.gradle

# Force xcode build script to out map files
sed "s/--reset-cache/--reset-cache --sourcemap-output ios-release.bundle.map/g" node_modules/react-native/scripts/react-native-xcode.sh > temp/react-native-xcode.sh
mv temp/react-native-xcode.sh node_modules/react-native/scripts/react-native-xcode.sh
chmod 755 node_modules/react-native/scripts/react-native-xcode.sh

# Disable minification
# Macs don't have `sed -i`, so we use a temporary file for the sed output:
#sed -e 's/minify:.*,/minify: false,/' ./node_modules/react-native/local-cli/bundle/buildBundle.js > buildBundle.js
#mv buildBundle.js ./node_modules/react-native/local-cli/bundle/buildBundle.js

# TODO: Remove the minification hack once the CLI accepts a --minify parameter.
# See: https://github.com/facebook/react-native/pull/16456

# Set up CocoaPods on iOS:
unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
  # Copy missing podspecs:
  for package in $(ls ios/podspecs | sed s/.podspec//); do
    cp ios/podspecs/$package.podspec node_modules/$package/$package.podspec
  done

  # Install the dependencies:
  (cd ios; pod install)
fi

# Apply patches
patch -f ./node_modules/react-native/React/Views/RCTFont.mm ./patches/RCTFont.patch || true

node ./scripts/makeNativeHeaders.js
