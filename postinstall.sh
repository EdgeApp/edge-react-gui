#!/bin/bash

rn-nodeify --hack
rm -rf ./node_modules/bcoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/bcoin/.babelrc
rm -rf ./node_modules/bccoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/bccoin/.babelrc
rm -rf ./node_modules/lcoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/lcoin/.babelrc

# Fix rn-nodify's hack of fs -> react-native-level-fs for mymonero-core-js. Use react-native-fs instead
sed "s/react-native-level-fs/react-native-fs/g" ./node_modules/mymonero-core-js/package.json > ./node_modules/mymonero-core-js/package.json.fix
mv ./node_modules/mymonero-core-js/package.json.fix ./node_modules/mymonero-core-js/package.json

node postinstall.js
mkdir -p temp

# Remove inclusion of c++_shared.so library since we are using jsc-android which already includes it
sed "s/\,[[:space:]]'-DANDROID_STL=c++_shared'//g" ./node_modules/react-native-fast-crypto/android/build.gradle > temp/build.gradle
mv temp/build.gradle ./node_modules/react-native-fast-crypto/android/build.gradle

# Force xcode build script to out map files
sed "s/--reset-cache/--reset-cache --sourcemap-output ios-release.bundle.map/g" node_modules/react-native/scripts/react-native-xcode.sh > temp/react-native-xcode.sh
mv temp/react-native-xcode.sh node_modules/react-native/scripts/react-native-xcode.sh
chmod 755 node_modules/react-native/scripts/react-native-xcode.sh

# Force rand to exist for miller-rabin library
sed "s/function MillerRabin(rand)/function MillerRabin(rand = 'NoRandFunction')/g" node_modules/miller-rabin/lib/mr.js > temp/mr.js
mv temp/mr.js node_modules/miller-rabin/lib/mr.js
chmod 755 node_modules/miller-rabin/lib/mr.js

# Remove fetch polyfill from eosjs-api
sed "s/require('isomorphic-fetch');//g" node_modules/eosjs-api/lib/apigen.js > temp/apigen.js
mv temp/apigen.js node_modules/eosjs-api/lib/apigen.js
chmod 755 node_modules/eosjs-api/lib/apigen.js

node ./copy-plugin.js

# Disable minification
# Macs don't have `sed -i`, so we use a temporary file for the sed output:
#sed -e 's/minify:.*,/minify: false,/' ./node_modules/react-native/local-cli/bundle/buildBundle.js > buildBundle.js
#mv buildBundle.js ./node_modules/react-native/local-cli/bundle/buildBundle.js

# TODO: Remove the minification hack once the CLI accepts a --minify parameter.
# See: https://github.com/facebook/react-native/pull/16456

# Copy edge-core-js WebView contents:
mkdir -p ios/edge-core
cat >ios/edge-core/index.html <<HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script src="edge-core.js"></script>
    <script>
      let loading = 0

      function load (path) {
        ++loading

        const script = document.createElement('script')
        script.charset = 'utf-8'
        script.async = true
        function scriptDone () {
          document.head.removeChild(script)
          if (--loading === 0) {
            window.lockEdgeCorePlugins()
          }
        }
        script.addEventListener('error', scriptDone)
        script.addEventListener('load', scriptDone)
        script.src = path
        document.head.appendChild(script)
      }

      setTimeout(function () {
        load('edge-currency-accountbased.js')
        load('edge-currency-bitcoin.js')
        load('edge-currency-monero.js')
        load('edge-exchange-plugins.js')
      }, 200)
    </script>
  </body>
</html>
HTML
cp ./node_modules/edge-core-js/lib/react-native/edge-core.js ./ios/edge-core
cp ./node_modules/edge-currency-accountbased/lib/react-native/edge-currency-accountbased.js ./ios/edge-core
cp ./node_modules/edge-currency-bitcoin/lib/react-native/edge-currency-bitcoin.js ./ios/edge-core
cp ./node_modules/edge-currency-monero/lib/react-native/edge-currency-monero.js ./ios/edge-core
cp ./node_modules/edge-exchange-plugins/lib/react-native/edge-exchange-plugins.js ./ios/edge-core
cp -r ./ios/edge-core ./android/app/src/main/assets/

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
