# Edge

[![Build Status](https://travis-ci.com/EdgeApp/edge-react-gui.svg?branch=develop)](https://travis-ci.com/EdgeApp/edge-react-gui)

## A multi-currency mobile wallet for Bitcoin, Ethereum, Monero, Dash, Litecoin, Bitcoin Cash, Ripple/XRP, Polkadot, Tron, Solana, Stellar, Fantom, Algorand, Optimism, Zcash, Pirate Chain, and many others

![Edge Screenshots](./docs/images/readme-cover-photo.png)

Edge is:

- simple
- secure
- private
- decentralized
- multi-currency
- cross-platform
- mobile first
- open source

---

## Getting Started

### Prepare React Native Development Tools

The React Native documentation contains [detailed instructions on how to prepare your computer for React Native development](https://reactnative.dev/docs/0.67/environment-setup). Follow the instructions in the "React Native CLI Quickstart" for your specific platform.

If you are using a Mac, follow both the iOS and Android target instructions. Otherwise, you only need the Android target instructions.

### Install Yarn

This project uses Yarn to manage Javascript dependencies:

    https://yarnpkg.com

Do not use NPM to install dependencies, since that will not work.

### Checkout develop branch & install node_modules

    cd edge-react-gui
    yarn
    yarn prepare

### Run the bundler

    yarn start

This bundler process needs to run in the background, so feel free to run this in its own terminal window.

### Add API key in env.json

A public API key is built into the edge-core-js which can be used to build and test the Edge app. This key is severely rate limited and should not be used for production. For production use, get an API key by emailing info@edge.app.

Change the `AIRBITZ_API_KEY` in `env.json` to the API key you received from Edge. To use the public API key, leave `AIRBITZ_API_KEY` blank.

### Run the app in debug mode

#### iOS

- Run `yarn prepare.ios` to generate the CocoaPods files. You will need to do this after the first install, and any time Xcode produces a `The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.` error.
- Open `edge-react-gui/ios/edge.xcworkspace` in Xcode
- Choose a target device or simulator and tap the Play button on the top nav bar

#### Android

To build, install, and start the app on a simulator or physical phone with USB debugging, run:

    yarn android

Otherwise, to get an APK, do:

    cd android
    ./gradlew assembleDebug

- The resulting APK will be in `./app/build/outputs/apk/debug/app-debug.apk`
- Copy the APK to a simulator like Genymotion or a real device via Email or messaging app

### Build release version of app

#### iOS

- Open `edge-react-gui/ios/edge.xcworkspace` in Xcode
- Hold [ option/alt ] and click on the Edge button on the top bar to the right of the Play and Stop icons.
- Change 'Build Configuration' to Release
- Uncheck 'Debug Executable'
- Close window
- Choose a device and hit Play

#### Android

    cd android
    ./gradlew assembleRelease

- The resulting APK will be in `./app/build/outputs/apk/release/app-release.apk`
- Copy the APK to a simulator like Genymotion or a real device via Email or messaging app

---

## Deploying (MacOS Only)

This repo includes several utility scripts that can be used in a CI/CD
environment to build and deploy a release version of the app. The
included `Jenkinsfile` utilizes all the scripts but you are free to
use them in your own CI environment.

### Update the version file

Set `BUILD_REPO_URL` to the URL of an empty Git repo that will hold a version
file that will be auto updated to increment the version and build number. Then
run the following to update a local `release-version.json` file

    yarn gitVersionFile

Update the project files based on the version in `release-version.json`

    yarn updateVersion

### Build, sign, and deploy

The included `deploy.ts` is a script to automate building, signing, and deploying release builds of Edge. It provides the following:

- Auto sign Android APK with Android keystore files
- Auto sign iOS IPA with provisioning profiles
- Build release version of iOS and Android
- Upload iOS IPA and Android APK files to AppCenter for developer testing

### To Use

- Set the env var KEYCHAIN_PASSWORD to the keychain password of the current user
- Copy the `deploy-config.sample.json` to `deploy-config.json` and edit the parameters accordingly. You'll need a HockeyApp account to get ids and keys
- Download a copy of the Google Bundle tool (https://github.com/google/bundletool/releases)
- Set the `bundleToolPath` in `deploy-config.json` to the path to the bundle tool `.jar` file
- Put any Android keystore files into `edge-react-gui/keystores/`
- If using Firebase, put your account's `google-services.json` and `GoogleService-Info.plist` into `edge-react-gui/`
- Install xcpretty `sudo gem install xcpretty`

Run deploy

```sh
yarn deploy edge ios master
yarn deploy edge android master
```

## Fastlane support

This repo supports utilizing Fastlane to automate updates to iOS Provisioning
Profiles. To use Fastlane, set the following environment variables and run
`yarn deploy` as mentioned above

    BUILD_REPO_URL          // Git repo used to store encrypted provisioning
                            // keys.
                            // Will be shared with the gitVersionFile.ts script
    FASTLANE_USER           // Apple ID email
    FASTLANE_PASSWORD       // Apple ID password
    GITHUB_SSH_KEY          // (Optional) SSH Key file to use when accessing
                            // BUILD_REPO_URL
    MATCH_KEYCHAIN_PASSWORD // Password to unlock the current users keychain
    MATCH_PASSWORD          // Password used to encrypt profile information
                            // before being saved to the BUILD_REPO_URL

---

## Debugging

As with any modern React Native app, [Flipper](https://fbflipper.com/) is the officially-supported debugging app. Use the "React Native Hermes Debugger" to debug Javascript running in the UI.

If you want to inspect Redux, you can install the [redux-debugger](https://github.com/jk-gan/flipper-plugin-redux-debugger) plugin for Flipper, which this app supports.

## Suggested Agentic Coding Rules

The following rules are suggested to reduce friction during agentic development and align with Edge's coding best practices. Some which are specific to this repo are already included in Cursor-specific `.mdc` files, and most are appropriate to set as global rules (Cursor "User Rules," AGENTS.md, etc) across all Edge organization repositories.

### Code and TypeScript rules

- JSX props shouldn't use inline arrow functions. Create handlers appropriately.
- Use ?? instead of || for default values. ?? only treats null/undefined as missing, || treats all falsy values as missing:
❌ value || defaultValue → ✅ value ?? defaultValue
❌ config.timeout || 5000 → ✅ config.timeout ?? 5000 (preserves 0)
❌ user.name || 'Anonymous' → ✅ user.name ?? 'Anonymous' (preserves '')
❌ settings.enabled || true → ✅ settings.enabled ?? true (preserves false)"
- NEVER use optional chaining results directly in conditions:
❌ `if (obj?.prop)` → ✅ `if (obj?.prop != null)`
❌ `if (obj?.arr?.length > 0)` → ✅ `if (obj?.arr != null && obj.arr.length > 0)`
❌ `if (response?.data)` → ✅ `if (response?.data != null)`
- Component exports for any modified files should follow the form: `export const Component: React.FC<Props> = (props: Props) => {`
- String literals should always be defined in and referenced from @en_us.ts

### Workflow and execution

- Background tasks (yarn dev, yarn start, etc) should be checked if running before attempting to start. Don't run these types of background tasks unless explicitly asked to do so.
- After completing code changes, run `yarn tsc` and fix any errors. Once those are addressed, run `files=($(git diff HEAD --name-only -- '*.ts' '*.tsx')); if (( ${#files} )); then ./node_modules/.bin/eslint --fix "${files[@]}"; else echo "No TS/TSX changes since HEAD."; fi` after your changes, and manually fix any non-deprecation warnings that cannot be automatically fixed, if necessary. It is not necessary to fix any lint warnings/errors on files that you did not modify yourself.
- Multi-phase plans should always be done one phase at a time before stopping and asking for feedback.
- Never start work when I mention "Come up with a plan" or similar. Such a request is literally to come back with a textual plan.
- Before using any code editing tools (edit_file, search_replace, etc.), scan my entire message for questions (?). If ANY exist, you MUST answer all questions first without making code changes. Only proceed with implementation after I permit you to in a follow-up message.

### Research and external dependencies

- Before installing a package, read the npm or github page first to check if there is anything suspicious: first publish date, I in place of L, number of stars, etc. Respond with a link to the package first, and wait for user confirmation to install.
- RESEARCH FIRST: Before implementing external APIs or libraries, you MUST either quote provided documentation or actively search for official documentation using available tools. Always explicitly state 'According to [source]...' when making implementation decisions. If documentation searches are incomplete or missing critical details: 1. STOP implementation immediately 2. ASK: 'I found [what I found] but need [specific missing details]. Would you like me to search more thoroughly, or can you provide the documentation?' 3. WAIT for user guidance before proceeding"

### Communication

- ALWAYS respond with a neutral tone, without fluff like "Certainly!" or "Perfect." NEVER apologize, but state your understanding of mistakes.
- CRITICAL: User is human and prone to mistakes. 1. Suggest better approaches if you can think of them before implementing prompted suboptimal solutions. Bring these up as suggestions to yes/no confirm by the user before actually implementing them. 2. Ask for clarification when prompt/question/task is unclear or ambiguous 3. Notify user: if technical inaccuracies present, better alternative approaches/patterns exist, best practices contradicted, edge cases missed, or inconsistencies are found against the code base.

### Documentation

- Update the CHANGELOG with at most a few new entries for the changes made in the current branch, if requested. Entries should ONLY describe the final state of all the current branch changes, NOT the journey or internal conversations, and follow the existing patterns for length and formatting (including no word wrapping).
- Code comments should ONLY describe the final state of the branch changes, NOT the journey or internal conversations

## Contributing

Please follow the coding conventions defined in [Edge Conventions](https://github.com/Airbitz/edge-conventions)
