# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# zcash-native binds its Rust library through uniffi over JNA. JNA resolves
# native symbols from the Library interface's method names and reads Structure
# fields by reflection, and its own JNI side looks up com.sun.jna classes by
# name, so none of these may be renamed or stripped:
-keep class com.sun.jna.** { *; }
-keep class * implements com.sun.jna.Library { *; }
-keep class * extends com.sun.jna.Structure { *; }
-keep class * implements com.sun.jna.Callback { *; }
# JNA references AWT types that do not exist on Android:
-dontwarn java.awt.**

# react-native-device-info reaches the Play Install Referrer client through
# reflection (Class.forName + getMethod), so R8 must keep its API by name:
-keep class com.android.installreferrer.api.** { *; }
