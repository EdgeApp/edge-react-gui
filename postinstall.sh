#!/bin/bash

# The `usb` module doesn't properly install on some boxes:
mkdir -p node_modules/usb
touch node_modules/usb/index.js

# Set up CocoaPods on iOS:
unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then
  (cd ios; pod repo update; pod install)
fi

node ./scripts/makeNativeHeaders.js
