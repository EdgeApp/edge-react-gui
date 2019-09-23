#!/bin/bash

mkdir -p temp

# Remove inclusion of c++_shared.so library since we are using jsc-android which already includes it
sed "s/\,[[:space:]]'-DANDROID_STL=c++_shared'//g" ./node_modules/react-native-fast-crypto/android/build.gradle > temp/build.gradle
mv temp/build.gradle ./node_modules/react-native-fast-crypto/android/build.gradle

# Force xcode build script to out map files
sed "s/--reset-cache/--reset-cache --sourcemap-output ios-release.bundle.map/g" node_modules/react-native/scripts/react-native-xcode.sh > temp/react-native-xcode.sh
mv temp/react-native-xcode.sh node_modules/react-native/scripts/react-native-xcode.sh
chmod 755 node_modules/react-native/scripts/react-native-xcode.sh

node ./copy-plugin.js

# Disable minification
# Macs don't have `sed -i`, so we use a temporary file for the sed output:
#sed -e 's/minify:.*,/minify: false,/' ./node_modules/react-native/local-cli/bundle/buildBundle.js > buildBundle.js
#mv buildBundle.js ./node_modules/react-native/local-cli/bundle/buildBundle.js

# TODO: Remove the minification hack once the CLI accepts a --minify parameter.
# See: https://github.com/facebook/react-native/pull/16456

# Copy edge-core-js WebView contents:
core_assets="./android/app/src/main/assets/edge-core"
if [ -d "$core_assets" ]; then
  rm -r "$core_assets"
fi
mkdir -p "$core_assets"
cp ./node_modules/edge-core-js/lib/react-native/edge-core.js "$core_assets"

# Write out an edge-core-js index.html file:
cat >"$core_assets/index.html" <<HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script src="edge-core.js"></script>
    <script>
      function load() {
        var script = document.createElement('script')
        script.charset = 'utf-8'
        script.async = true
        script.addEventListener('error', window.lockEdgeCorePlugins)
        script.addEventListener('load', window.lockEdgeCorePlugins)
        script.src = 'plugin-bundle.js'
        document.head.appendChild(script)
      }
      setTimeout(load, 200)
    </script>
  </body>
</html>
HTML

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
