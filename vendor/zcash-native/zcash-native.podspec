require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platform     = :ios, "13.0"
  s.source = {
    :git => "https://github.com/EdgeApp/zcash-native.git",
    :tag => "v#{s.version}"
  }
  s.source_files =
    "ios/react-native-zcash-Bridging-Header.h",
    "ios/RNZcash.m",
    "ios/RNZcash.swift",
    "ios/EdgeZcashClient.swift",
    "ios/zcash.swift"
  s.vendored_frameworks = "ios/libzcash.xcframework"
  s.pod_target_xcconfig = {
    # CocoaPods copies the active xcframework slice here. Do not point at
    # ios/ or the raw xcframework: both slices define module zcashFFI.
    'SWIFT_INCLUDE_PATHS' => '"${PODS_XCFRAMEWORKS_BUILD_DIR}/zcash-native/Headers"',
    'OTHER_LDFLAGS' => '-lc++'
  }
  s.libraries = "c++"

  s.dependency "React-Core"
end
