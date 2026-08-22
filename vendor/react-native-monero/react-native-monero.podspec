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
  s.requires_arc = true
  s.source = {
    :git => "https://github.com/EdgeApp/react-native-monero.git",
    :tag => "v#{s.version}"
  }
  s.source_files =
    "ios/MoneroModule.h",
    "ios/MoneroModule.mm",
    "src/monero-wrapper/monero-methods.hpp"
  s.vendored_frameworks = "ios/MoneroModule.xcframework"
  s.libraries = "c++"

  s.dependency "React-Core"
  s.frameworks = 'Security'
end
