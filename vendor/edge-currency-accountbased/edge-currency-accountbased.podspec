require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platform     = :ios, "9.0"
  s.requires_arc = true
  s.source = {
    :git => "https://github.com/EdgeApp/edge-currency-accountbased.git",
    :tag => "v#{s.version}"
  }
  s.source_files =
    "ios/EdgeCurrencyAccountbasedModule.swift",
    "ios/EdgeCurrencyAccountbasedModule.m"

  s.resource_bundles = {
    "edge-currency-accountbased" => "android/src/main/assets/edge-currency-accountbased/*.js"
  }

  s.dependency "React-Core"
end
