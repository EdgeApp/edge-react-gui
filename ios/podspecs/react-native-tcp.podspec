require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = 'todo'
  s.homepage     = 'todo'
  s.license      = 'todo'
  s.authors      = 'todo'
  s.platform     = :ios, "8.0"
  s.requires_arc = true
  s.source       = { :git => "https://github.com/EdgeApp/edge-react-gui.git" }
  s.source_files = "ios/**/*.{h,m}"

  s.dependency "React"
end
