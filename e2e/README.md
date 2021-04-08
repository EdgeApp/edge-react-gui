
<img alt="edge" src="https://avatars.githubusercontent.com/u/6613230?s=200&v=4"/>
<img alt="Detox" width=380 src="https://raw.githubusercontent.com/wix/Detox/master/docs/img/DetoxLogo.png"/>

<br>
<br>
<br>

# End to End Testing README

This document provides instructions and information related to running the End to End mobile test automation currently using DETOX.

<br>
<br>

## Install

This assumes you already have completed all install/setup outlined in the README at the top level of the edge-react-gui repository and have verified that the app is running in a simulator/emulator.  

<br>

Global install items
- ??? Detox??? Depending on your workflows with detox, you may want it globally installed
- brew install android-platform-tools

<br>
<br>
<br>
<br>

## Running the Tests

<br>

__NOTE:__ _There are common detox scripts in the ```package.json``` file that are runnable with the yarn command_

<br>
<br>

### __Commonly you will kick off test with...__
```detox test --configuration ${YOUR_PLATFORM_TARGET}```
- ```detox test``` as usual to run the end to end tests
- ```--configuaration``` passed in with a coorespnding configuration found in the ```"detox": {}``` in the ```package.json```

<br>
<br>

### __The test commands rely on some build commands...__

<br>

__Note:__ _The ```detox test``` command, it assumes the ```.app``` or ```.apk``` are in the directory as specified by the ```detox:{}``` in the ```package.json```._ 

<br>

#### iOS
```cd ios && xcodebuild -workspace edge.xcworkspace -scheme edge archive -allowProvisioningUpdates```
- ```cd ios``` in ios directory(???You might not need to do this. Need to verify)
- ```xcodebuild -workspace edge.xcworkspace -scheme edge archive``` is used in common to build the app for release
- ```-allowProvixioningUpdates```(???presummed needed due to build error?) attempts to handle the necessary signing need to run the app as a release. (??? May be more work needed here. Depending on what kind of work is necessary, we may think about scrapping testing with the build generated from this command.)
- The .ipa is output to ```where???```

<br>

#### Android
```cd android && ./gradlew assembleRelease```
- ```cd android``` in android directory
- ```./gradlew assembleRelease``` as usual to build app for release
- The .apk is output to ```where???```

<br>
<br>
<br>
<br>

## Debugging Tests

### Loglevel
- ```--loglevel``` followed by the loglevel value can be used to get more detailed logs. See the docs(https://github.com/wix/Detox/blob/master/docs/APIRef.DetoxCLI.md) for more information. The verbose level will output the heirarchy tree to the log which is commonly used to troubleshoot locator issues. 

### Locator Issues
- It is not recomended that you use _flipper_ or other _reactnative-devtools_ based tools to debug locator related issues. What it sees amy not reflect the final native DOM tree. 
- For iOS: open the project, deploy it to a simulator, attach a debugger by selecting debug -> Attach to process -> select edge -> wait for attachment -> select ["Debug View Heirarchy"](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/debugging_with_xcode/chapters/special_debugging_workflows.html#//apple_ref/doc/uid/TP40015022-CH9-SW2) in the bottom bar menu.

<br>
<br>
<br>
<br>

# Caveats

- The app will not build on my machine with the commonly used build command. I am using the app that is built when you push the play button in xcode with a simulator as your target.