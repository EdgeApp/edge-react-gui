cmake_minimum_required(VERSION 3.18.1)

# React Native's application setup, included at the end, names its library
# after the top-level project, and the new architecture loads it as
# libappmodules.so:
project(appmodules)

set(NATIVE_SIGNER_DIR "${CMAKE_SOURCE_DIR}/../../../../../native/edge-api-signer")

add_library(
  edge_api_signer
  SHARED
  edge_api_secret.c
  edge_api_signer_jni.c
  "${NATIVE_SIGNER_DIR}/edge_hmac.c"
)

target_include_directories(
  edge_api_signer
  PRIVATE
  ${CMAKE_SOURCE_DIR}
  ${NATIVE_SIGNER_DIR}
)

target_compile_options(edge_api_signer PRIVATE -fvisibility=hidden -O2)

# Pixel / Android 15+: 16 KB page-size ELF alignment
target_link_options(edge_api_signer PRIVATE "-Wl,-z,max-page-size=16384")

find_library(log-lib log)
target_link_libraries(edge_api_signer ${log-lib})

# Providing this file replaces the React Native Gradle plugin's default
# CMakeLists.txt, which is what builds libappmodules.so, the library that
# registers the autolinked native modules and components. Without it the new
# architecture cannot find even core modules such as PlatformConstants, and
# the app crashes on launch. Including it after the signer keeps the settings
# it turns on, such as link-time optimization, off the signer:
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
