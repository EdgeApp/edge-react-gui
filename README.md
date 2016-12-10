# airbitz-react-native-ui
React Native UI for Airbitz

### Global NPM dependencies (requires sudo sometimes):
`npm install -g snazzy standard react-native-cli@latest`

#### Node v6.x recommended. >4 should be working.
### Android
You need Android SDK 25 and platform-tools 25.0.1 as well as the *Android support library* and *Android support repository*. All of that can installed using the Android SDK Manager

Make sure you set ANDROID_HOME environment variable. If you're using bash and it's not already working, create ~/.bash_profile
```
export ANDROID_HOME=/home/youruser/PathToAndroid/Sdk
export PATH=${PATH}:/home/youruser/PathToAndroid/Sdk/platform-tools:/home/bojack/Android/Sdk/tools
```
If for some reason you still get errors it means you need to run `source ~/.bash_profile` 
But you can also run this with zsh (put it in .zshprofile instead)

### Build and Run: 
`npm install`
### run the packager and leave it in its own tab
#### Mac users seem to be find without this step.
`npm start`
### install the android app (also runs the packager for Mac users)
`npm run droid`

### Troubleshooting
- Whenever you need to install a new npm module, you'll need to restart the app daemon afterwards in order for your bundle to pick it up.
- If you're having inexplicable persistent problems, it sometimes helps to clean the project. `cd android && ./gradlew clean && rm -rf build && cd ..`
- If you get 'airbitz has stopped' from your android device, and you're running a dev build, this means your environment has a problem, NOT the app. Run `adb logcat *:D` and reproduce the error, it should give you some stack information, which MIGHT help.

### Test production build
It's required at the moment to set up some gradle properties in your local environment. This will be fixed in a future release, but it takes 30 seconds, so...
Edit the file ~/.gradle/gradle.properties and add this
```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=123456
MYAPP_RELEASE_KEY_PASSWORD=123456
```
