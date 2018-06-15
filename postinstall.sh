#!/bin/bash

rn-nodeify --hack
rm -rf ./node_modules/bcoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/bcoin/.babelrc
rm -rf ./node_modules/bccoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/bccoin/.babelrc
rm -rf ./node_modules/lcoin/.babelrc ./node_modules/edge-currency-bitcoin/node_modules/lcoin/.babelrc

# Fix rn-nodify's hack of fs -> react-native-level-fs for mymonero-core-js. Use react-native-fs instead
sed "s/react-native-level-fs/react-native-fs/g" ./node_modules/mymonero-core-js/package.json > ./node_modules/mymonero-core-js/package.json.fix
mv ./node_modules/mymonero-core-js/package.json.fix ./node_modules/mymonero-core-js/package.json

node postinstall.js

# Remove inclusion of c++_shared.so library since we are using jsc-android which already includes it
sed "s/\,[[:space:]]'-DANDROID_STL=c++_shared'//g" ./node_modules/react-native-fast-crypto/android/build.gradle > build.gradle
mv build.gradle ./node_modules/react-native-fast-crypto/android/build.gradle

node ./copy-plugin.js

# Disable minification
# Macs don't have `sed -i`, so we use a temporary file for the sed output:
#sed -e 's/minify:.*,/minify: false,/' ./node_modules/react-native/local-cli/bundle/buildBundle.js > buildBundle.js
#mv buildBundle.js ./node_modules/react-native/local-cli/bundle/buildBundle.js

# TODO: Remove the minification hack once the CLI accepts a --minify parameter.
# See: https://github.com/facebook/react-native/pull/16456
