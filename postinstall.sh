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

unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
    cd ios
    pod install
fi
