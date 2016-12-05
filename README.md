# airbitz-react-native-ui
React Native UI for Airbitz

### Global NPM dependencies (requires sudo sometimes):
`npm install -g snazzy standard`

### Android
You need Android SDK 25 and platform-tools 25.0.1 as well as the *Android support library* and *Android support repository*. All of that can installed using the Android SDK Manager

Make sure you set ANDROID_HOME environment variable. If you're using bash the best way is to create ~/.bash_profile
```
export ANDROID_HOME=/home/youruser/PathToAndroid/Sdk
export PATH=${PATH}:/home/youruser/PathToAndroid/Sdk/platform-tools:/home/bojack/Android/Sdk/tools
```
If for some reason you still get errors it means you need to run `source ~/.bash_profile` 
But you can also run this with zsh (put it in .zshprofile instead)

### Build and Run: 
`npm install`
# open the bundle daemon, leave it to go in its own tab
`npm start`
# install the android app 
`npm run droid`
# 
react-native run-android (for android),
react-native run-ios (for ios)

### Test production build
You might never need to do this but in case you want to send the build somewhere it won't need the bundle daemon running ( a production test build ), here:
Edit the file ~/.gradle/gradle.properties and add this
```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=123456
MYAPP_RELEASE_KEY_PASSWORD=123456
```
