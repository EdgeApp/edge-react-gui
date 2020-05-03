require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-zcoin-sigma"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-zcoin-sigma
                   DESC
  s.homepage     = "https://github.com/github_account/react-native-zcoin-sigma"
  s.license      = "MIT"
  # s.license    = { :type => "MIT", :file => "FILE_LICENSE" }
  s.authors      = { "Your Name" => "yourname@email.com" }
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/github_account/react-native-zcoin-sigma.git", :tag => "#{s.version}" }

  s.source_files = ["ios/*.{h,m,mm,hpp,cpp,swift}", "ios/libsigma/src/*.{h,c,hpp,cpp}",
                    "ios/libsigma/secp256k1/include/*.{h,hpp}", "ios/libsigma/bitcoin/**/*.{h,c,hpp,cpp}"]
  s.requires_arc = true

  s.xcconfig = { 'USER_HEADER_SEARCH_PATHS' => '"$(SRCROOT)/../../node_modules/react-native-zcoin-sigma/ios"/**',
                  'ALWAYS_SEARCH_USER_PATHS' => 'YES',
                  'LIBRARY_SEARCH_PATHS' => '$(SRCROOT)/../node_modules/react-native-zcoin-sigma/ios' }
  s.library = 'secp'
  s.vendored_libraries = 'secp.a'

  s.dependency "React"
  # ...
  # s.dependency "..."
end

