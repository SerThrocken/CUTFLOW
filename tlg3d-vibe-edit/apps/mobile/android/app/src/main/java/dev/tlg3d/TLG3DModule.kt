// CutFlow Android Native Module
// TLG3DModule.kt — bridges native Android capabilities to React Native
// Handles: RCS/SMS, FCM push, MediaStore, share intent, biometrics,
//          local network discovery (NSD), file transfer to desktop

package dev.tlg3d.cutflow

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Build
import android.provider.MediaStore
import android.telephony.SmsManager
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.*
import java.net.InetSocketAddress
import java.net.Socket
import java.util.concurrent.Executors

class TLG3DModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    private var nsdManager: NsdManager? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null

    override fun getName(): String = "TLG3DModule"

    // ── Send event to JS ─────────────────────────────────────

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // ── SMS Sending ──────────────────────────────────────────

    @ReactMethod
    fun sendSMS(
        recipients: ReadableArray,
        body: String,
        promise: Promise
    ) {
        try {
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                reactContext.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            for (i in 0 until recipients.size()) {
                val number = recipients.getString(i)
                smsManager.sendTextMessage(number, null, body, null, null)
            }

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putInt("count", recipients.size())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message)
        }
    }

    // ── Native Share Intent ──────────────────────────────────

    @ReactMethod
    fun shareFile(
        filePath: String,
        mimeType: String,
        title: String,
        promise: Promise
    ) {
        try {
            val file = java.io.File(filePath)
            val uri  = androidx.core.content.FileProvider.getUriForFile(
                reactContext,
                "${reactContext.packageName}.provider",
                file
            )

            val intent = Intent(Intent.ACTION_SEND).apply {
                type  = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, title)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(intent, "Share via")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(chooser)

            promise.resolve(Arguments.createMap().apply { putBoolean("shared", true) })
        } catch (e: Exception) {
            promise.reject("SHARE_ERROR", e.message)
        }
    }

    // ── Save Video to MediaStore ─────────────────────────────

    @ReactMethod
    fun saveVideoToGallery(
        filePath: String,
        videoTitle: String,
        promise: Promise
    ) {
        try {
            val resolver = reactContext.contentResolver
            val srcFile  = java.io.File(filePath)

            val contentValues = android.content.ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, videoTitle)
                put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/CutFlow")
            }

            val uri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)
                ?: throw IOException("Failed to create MediaStore entry")

            resolver.openOutputStream(uri)?.use { out ->
                FileInputStream(srcFile).use { input ->
                    input.copyTo(out)
                }
            }

            promise.resolve(Arguments.createMap().apply {
                putBoolean("saved", true)
                putString("uri", uri.toString())
            })
        } catch (e: Exception) {
            promise.reject("GALLERY_ERROR", e.message)
        }
    }

    // ── Biometric Authentication ─────────────────────────────

    @ReactMethod
    fun authenticateWithBiometrics(reason: String, promise: Promise) {
        val activity = currentActivity as? FragmentActivity
            ?: return promise.reject("NO_ACTIVITY", "No activity available")

        val biometricManager = BiometricManager.from(reactContext)
        val canAuthenticate  = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.DEVICE_CREDENTIAL
        )

        if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
            promise.reject("BIO_UNAVAILABLE", "Biometrics not available on this device")
            return
        }

        val executor = ContextCompat.getMainExecutor(reactContext)
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                promise.resolve(Arguments.createMap().apply { putBoolean("authenticated", true) })
            }
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                promise.reject("BIO_ERROR", errString.toString())
            }
            override fun onAuthenticationFailed() {
                promise.reject("BIO_FAILED", "Authentication failed")
            }
        }

        activity.runOnUiThread {
            val prompt = BiometricPrompt(activity, executor, callback)
            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("CutFlow Authentication")
                .setSubtitle(reason)
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.DEVICE_CREDENTIAL
                )
                .build()
            prompt.authenticate(promptInfo)
        }
    }

    // ── NSD / Desktop Discovery ──────────────────────────────

    @ReactMethod
    fun startDesktopDiscovery(promise: Promise) {
        nsdManager = reactContext.getSystemService(NsdManager::class.java)

        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                promise.reject("DISCOVERY_FAILED", "Error code: $errorCode")
            }
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
            override fun onDiscoveryStarted(serviceType: String) {
                promise.resolve(Arguments.createMap().apply { putBoolean("discovering", true) })
            }
            override fun onDiscoveryStopped(serviceType: String) {}

            override fun onServiceFound(service: NsdServiceInfo) {
                val params = Arguments.createMap().apply {
                    putString("name", service.serviceName)
                    putString("type", service.serviceType)
                }
                sendEvent("onDesktopDiscovered", params)
            }

            override fun onServiceLost(service: NsdServiceInfo) {
                val params = Arguments.createMap().apply {
                    putString("name", service.serviceName)
                }
                sendEvent("onDesktopLost", params)
            }
        }

        nsdManager?.discoverServices("_cutflow._tcp.", NsdManager.PROTOCOL_DNS_SD, discoveryListener)
    }

    @ReactMethod
    fun stopDesktopDiscovery(promise: Promise) {
        discoveryListener?.let { nsdManager?.stopServiceDiscovery(it) }
        promise.resolve(true)
    }

    // ── File Transfer to Desktop (TCP) ───────────────────────

    @ReactMethod
    fun sendFileToDesktop(
        filePath: String,
        desktopHost: String,
        desktopPort: Int,
        metadataJson: String,
        promise: Promise
    ) {
        Executors.newSingleThreadExecutor().execute {
            try {
                val file       = java.io.File(filePath)
                val fileBytes  = file.readBytes()

                // 256-byte header
                val header     = ByteArray(256)
                val jsonBytes  = metadataJson.toByteArray(Charsets.UTF_8)
                System.arraycopy(jsonBytes, 0, header, 0, minOf(jsonBytes.size, 256))

                val payload = header + fileBytes

                Socket().use { socket ->
                    socket.connect(InetSocketAddress(desktopHost, desktopPort), 10_000)
                    socket.getOutputStream().also {
                        it.write(payload)
                        it.flush()
                    }
                }

                val result = Arguments.createMap().apply {
                    putBoolean("sent", true)
                    putInt("bytes", payload.size)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("TRANSFER_ERROR", e.message)
            }
        }
    }

    // ── FCM Push Token ───────────────────────────────────────

    @ReactMethod
    fun getFCMToken(promise: Promise) {
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    promise.resolve(task.result)
                } else {
                    promise.reject("FCM_ERROR", task.exception?.message)
                }
            }
    }

    // ── Device Info ──────────────────────────────────────────

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        promise.resolve(Arguments.createMap().apply {
            putString("model",        Build.MODEL)
            putString("manufacturer", Build.MANUFACTURER)
            putString("os",           "android")
            putString("osVersion",    Build.VERSION.RELEASE)
            putInt("sdkVersion",      Build.VERSION.SDK_INT)
        })
    }
}
