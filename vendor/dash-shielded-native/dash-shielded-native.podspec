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
    :git => "https://github.com/EdgeApp/dash-shielded-native.git",
    :tag => "v#{s.version}"
  }
  s.source_files =
    "ios/dash-shielded-native-Bridging-Header.h",
    "ios/RNDashShielded.m",
    "ios/RNDashShielded.swift",
    "ios/EdgeDashClient.swift"
  s.vendored_frameworks = "ios/libdashshielded.xcframework"
  s.pod_target_xcconfig = {
    'SWIFT_INCLUDE_PATHS' => '"${PODS_XCFRAMEWORKS_BUILD_DIR}/dash-shielded-native/Headers"',
    'OTHER_LDFLAGS' => '-lc++'
  }
  s.libraries = "c++"

  s.dependency "React-Core"
end
