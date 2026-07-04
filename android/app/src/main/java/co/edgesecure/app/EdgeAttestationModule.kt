package co.edgesecure.app

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.security.keystore.StrongBoxUnavailableException
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.spec.ECGenParameterSpec

/**
 * Native bridge for Android Keystore hardware key attestation (device-level
 * attestation). Generates a fresh EC key in the AndroidKeyStore with the given
 * attestation challenge and returns the resulting X.509 certificate chain, which
 * the info server verifies against Google's hardware attestation roots.
 *
 * This stays fully open source: it uses only the platform KeyStore APIs, not the
 * closed-source Play Integrity / SafetyNet SDKs.
 */
class EdgeAttestationModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "EdgeAttestation"

  @ReactMethod
  fun isSupported(promise: Promise) {
    // Key attestation (setAttestationChallenge) requires API 24+.
    promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.N)
  }

  @ReactMethod
  fun getAttestation(
    challenge: String,
    promise: Promise
  ) {
    // Key generation can be slow; run off the JS thread.
    Thread {
      val keyAlias = "edge_attestation_" + System.currentTimeMillis()
      try {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
          promise.reject(
            "unsupported",
            "Key attestation requires Android 7.0 (API 24) or later"
          )
          return@Thread
        }

        val generator =
          KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            "AndroidKeyStore"
          )
        // The challenge's UTF-8 bytes are bound into the attestation extension;
        // the server compares them against the challenge it issued.
        // Builds the spec, optionally requesting a StrongBox-backed key. A
        // StrongBox (dedicated secure element, e.g. Pixel Titan M) key attests
        // at `attestationSecurityLevel = strongBox`, which the info server maps
        // to `secureElement`; a plain TEE key attests as `trustedEnvironment`
        // -> `hardware`.
        fun buildSpec(strongBox: Boolean): KeyGenParameterSpec {
          val builder =
            KeyGenParameterSpec
              .Builder(
                keyAlias,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
              ).setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
              .setDigests(KeyProperties.DIGEST_SHA256)
              .setAttestationChallenge(challenge.toByteArray(Charsets.UTF_8))
          if (strongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            builder.setIsStrongBoxBacked(true)
          }
          return builder.build()
        }

        // Prefer the highest assurance (StrongBox / secure element) and fall
        // back to the TEE only when this device has no StrongBox.
        val wantStrongBox = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
        try {
          generator.initialize(buildSpec(wantStrongBox))
          generator.generateKeyPair()
        } catch (e: StrongBoxUnavailableException) {
          // No StrongBox on this device; fall back to the TEE (hardware).
          generator.initialize(buildSpec(false))
          generator.generateKeyPair()
        }

        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)
        val chain = keyStore.getCertificateChain(keyAlias)
        if (chain == null || chain.isEmpty()) {
          promise.reject("attestation_error", "Empty attestation certificate chain")
          return@Thread
        }

        val certChain = Arguments.createArray()
        for (cert in chain) {
          certChain.pushString(Base64.encodeToString(cert.encoded, Base64.NO_WRAP))
        }

        val result = Arguments.createMap()
        result.putArray("certChain", certChain)
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("attestation_error", e.message, e)
      } finally {
        // Don't accumulate one-shot attestation keys in the keystore.
        try {
          val keyStore = KeyStore.getInstance("AndroidKeyStore")
          keyStore.load(null)
          keyStore.deleteEntry(keyAlias)
        } catch (ignored: Exception) {
          // Best effort cleanup.
        }
      }
    }.start()
  }
}
