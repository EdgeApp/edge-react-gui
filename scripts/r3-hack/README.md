# Reanimated Hack

Here is the problem:

- iOS: We need to run Reanimated 4 on the new achitecture to get decent performance.
- Android: We cannot use the new architecture yet (there are unsolved performance problems), so we need to use Reanimated 3.

How can we have two versions of a native library at once? Well...

- Require Reanimated 4 normally through package.json.
- Require Reanimated 3 indirectly through this r3-hack shim package.
- Use react-native.config.js to override the native module with Reanimated 3.
- Tell babel.config.js to use the right plugin based on platform.
- Hack metro.config.js to resolve 'react-native-reanimated' to
  this package's exported paths on Android.

Super sketchy, but it works!
