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
  companion object {
    // Stable alias: the key is enrolled once via attestation and then reused
    // to sign challenges (see signChallenge). Cleared only on clearKey or
    // when re-enrollment is needed.
    private const val KEY_ALIAS = "edge_attestation_key"
  }

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
      val keyAlias = KEY_ALIAS
      try {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
          promise.reject(
            "unsupported",
            "Key attestation requires Android 7.0 (API 24) or later"
          )
          return@Thread
        }

        // getAttestation is only called when (re-)enrollment is required, so a
        // leftover key under the stable alias is stale; delete it first.
        try {
          val existing = KeyStore.getInstance("AndroidKeyStore")
          existing.load(null)
          existing.deleteEntry(keyAlias)
        } catch (ignored: Exception) {
          // Best effort.
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
        // A failed enrollment should not leave a half-created key behind. The
        // key is intentionally NOT deleted on success — it survives so
        // signChallenge can reuse it for token refreshes.
        try {
          val keyStore = KeyStore.getInstance("AndroidKeyStore")
          keyStore.load(null)
          keyStore.deleteEntry(keyAlias)
        } catch (ignored: Exception) {
          // Best effort cleanup.
        }
        promise.reject("attestation_error", e.message, e)
      }
    }.start()
  }

  @ReactMethod
  fun signChallenge(
    challenge: String,
    promise: Promise
  ) {
    Thread {
      try {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)
        val entry =
          keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.PrivateKeyEntry
        if (entry == null) {
          promise.reject("noKey", "No attested key is stored")
          return@Thread
        }
        // keyId = base64url(SHA-256(leaf SPKI)), matching the server's
        // derivation.
        val spki = keyStore.getCertificate(KEY_ALIAS).publicKey.encoded
        val keyId =
          Base64.encodeToString(
            java.security.MessageDigest
              .getInstance("SHA-256")
              .digest(spki),
            Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP
          )
        val signer = java.security.Signature.getInstance("SHA256withECDSA")
        signer.initSign(entry.privateKey)
        signer.update(challenge.toByteArray(Charsets.UTF_8))
        val signature = Base64.encodeToString(signer.sign(), Base64.NO_WRAP)

        val result = Arguments.createMap()
        result.putString("keyId", keyId)
        result.putString("signature", signature)
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("signChallenge", e.message, e)
      }
    }.start()
  }

  @ReactMethod
  fun clearKey(promise: Promise) {
    // Best-effort: force re-enrollment when the server rejects an assertion
    // (unknown key, revoked serial, disabled app). Resolve regardless.
    try {
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      keyStore.deleteEntry(KEY_ALIAS)
    } catch (ignored: Exception) {
      // Best effort.
    }
    promise.resolve(null)
  }
}
