# Android — proguard-rules.pro
# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep CutFlow native module
-keep class dev.tlg3d.cutflow.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# AndroidX Biometric
-keep class androidx.biometric.** { *; }

# Prevent obfuscation of serialized classes
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
