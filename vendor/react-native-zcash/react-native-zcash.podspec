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
    :git => "https://github.com/EdgeApp/react-native-zcash.git",
    :tag => "v#{s.version}"
  }
  s.source_files =
    "ios/react-native-zcash-Bridging-Header.h",
    "ios/RNZcash.m",
    "ios/RNZcash.swift",
    "ios/EdgeZcashClient.swift",
    "ios/zcash.swift",
    "ios/zcashFFI.h"
  s.vendored_frameworks = "ios/libzcash.xcframework"
  s.pod_target_xcconfig = {
    'SWIFT_INCLUDE_PATHS' => '$(PODS_TARGET_SRCROOT)/ios',
    'OTHER_LDFLAGS' => '-lc++'
  }
  s.libraries = "c++"

  s.dependency "React-Core"
end
