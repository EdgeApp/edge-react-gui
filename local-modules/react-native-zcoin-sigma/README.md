
# react-native-zcoin-sigma

## Getting started

`$ npm install react-native-zcoin-sigma --save`

### Mostly automatic installation

`$ react-native link react-native-zcoin-sigma`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-zcoin-sigma` and add `RNZcoinSigma.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNZcoinSigma.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNZcoinSigmaPackage;` to the imports at the top of the file
  - Add `new RNZcoinSigmaPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-zcoin-sigma'
  	project(':react-native-zcoin-sigma').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-zcoin-sigma/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-zcoin-sigma')
  	```

#### Windows
[Read it! :D](https://github.com/ReactWindows/react-native)

1. In Visual Studio add the `RNZcoinSigma.sln` in `node_modules/react-native-zcoin-sigma/windows/RNZcoinSigma.sln` folder to their solution, reference from their app.
2. Open up your `MainPage.cs` app
  - Add `using Zcoin.Sigma.RNZcoinSigma;` to the usings at the top of the file
  - Add `new RNZcoinSigmaPackage()` to the `List<IReactPackage>` returned by the `Packages` method


## Usage
```javascript
import RNZcoinSigma from 'react-native-zcoin-sigma';

// TODO: What to do with the module?
RNZcoinSigma;
```
  