# Edge React GUI — R8 / ProGuard keep rules
# Enabled when minifyEnabled=true in android/app/build.gradle.
# These rules aim to keep reflection / JNI entry points used by React Native,
# Hermes, Firebase, Sentry, and the Zcash / Pirate native SDKs.

# ---- React Native / Hermes / JNI ----
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
    void set*(***);
    *** get*();
}
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * {
    native <methods>;
}
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.intl.** { *; }

# ---- OkHttp / Okio (RN networking) ----
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ---- Firebase / Google Play Services ----
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ---- Sentry ----
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# ---- Zcash / Pirate protobuf + gRPC (reflection-heavy) ----
-keep class cash.z.** { *; }
-keep class co.electriccoin.** { *; }
-keep class pirate.** { *; }
-keep class com.google.protobuf.** { *; }
-keep class io.grpc.** { *; }
-dontwarn com.google.protobuf.**
-dontwarn io.grpc.**
-dontwarn com.google.common.**

# ---- Guava (pulled by Zcash / work-runtime) ----
-dontwarn com.google.common.**
-keep class com.google.common.** { *; }

# ---- Pirate SDK optional kotlinx.datetime refs (not on classpath) ----
-dontwarn kotlinx.datetime.Clock$System
-dontwarn kotlinx.datetime.Clock
-dontwarn kotlinx.datetime.Instant

# ---- Expo modules ----
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# ---- Vision Camera / ML Kit ----
-keep class com.mrousavy.camera.** { *; }
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# ---- Reanimated / Gesture Handler ----
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# ---- Keep line numbers for crash reports ----
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
