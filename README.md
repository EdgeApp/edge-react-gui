# airbitz-react-native-ui
React Native UI for Airbitz


## OS X
### install homebrew, run `brew doctor` `brew update` and `brew install watchman`. 
#### On Android genymotion emulator, just click the menu icon from the right toolbar, or if all else fails, type `adb shell input keyevent KEYCODE_MENU`


### Debugging on device and getting `E/unknown:React: Exception in native call from JS
                 com.facebook.react.devsupport.JSException: Could not get BatchedBridge, make sure your bundle is packaged correctly`
### Or 500 error, cannot connect to development server
This means your dev app cannot access your workstation to download the app bundle files. To fix this, follow these steps:
- Check USB connection to your computer from the device
- Make sure your packager is running `npm start` in your project directory 
- Re-run the command to create a network bridge `adb -s 64315443 reverse tcp:8081 tcp:8081` replacing 64315443 with your device ID (get your device ID from running `adb devices`)
### Unsigned production build
#### `react-native run-android --configuration release`. Uninstall the dev version of the app from the target device first or it will fail.
### Test SIGNED production build
It's *required* at the moment to set up some gradle properties in your local environment. This will be fixed in a future release, but it takes 30 seconds, so...
Edit the file ~/.gradle/gradle.properties and add this
```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=123456
MYAPP_RELEASE_KEY_PASSWORD=123456
```
### Android 6.0 permissions issue
A known issue with permissions in Android version 23+ (6.0) means you'll need to add this app manually to "Apps That Can Draw". To get to this screen, you'll just need to try to run the app, and it will crash, yielding the correct screen where you  need to add the permission. We are working on getting this to happen automatically

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
### run android logcat in a separate tab so you can see OS related messages and other errors
`adb logcat *:E`

### Troubleshooting
- `npm run android:logcat` is your friend. Check package.json for the raw command if you need to run it while multiple android devices are bridged.
- Whenever you need to install a new npm module, you'll need to restart the app daemon afterwards in order for your bundle to pick it up.
- If you're having inexplicable persistent problems, it sometimes helps to clean the project.  delete the app from your phone, run `cd android && ./gradlew clean && rm -rf build && cd .. && npm run droid` and then reset the packager like so: `npm start -- --reset-cache`
- If you get 'airbitz has stopped' from your android device, and you're running a dev build, this means your environment has a problem, NOT the app. Run `adb logcat *:E` and reproduce the error, it should give you some stack information, which MIGHT help.
- If you keep having problems, uninstall the app, restart your phone, `run npm droid` and `npm start -- --reset-cache`.
- Be aware that the Android build uses multiple versions of the Android SDK, so if you are getting errors related to missing Android SDK versions, that you may need to download and install them (through Android Studio, Homebrew, etc)
