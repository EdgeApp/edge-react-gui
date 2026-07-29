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
import java.security.MessageDigest
import java.security.spec.ECGenParameterSpec
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock

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

    // Serializes all AndroidKeyStore access to KEY_ALIAS. getAttestation,
    // signChallenge and clearKey each mutate/read the single shared alias; the
    // JS engine's watchdog can release its in-flight lock and start a new
    // handshake while an older native Thread is still running, so without this
    // lock two overlapping getAttestation calls could delete/regenerate the key
    // out from under each other and return cross-wired certificate chains.
    private val keystoreLock = ReentrantLock()

    // Caps how long an operation waits for keystoreLock. Keystore work is local
    // and synchronous, so a wedged generateKeyPair or sign cannot be interrupted
    // - but the operations queued behind it can refuse to wait forever, which is
    // what stops one wedge from taking down every later attestation, refresh and
    // clear for the life of the process. Well above a slow-but-healthy attested
    // key generation, and below the JS watchdog so JS gets a real rejection
    // instead of timing out blind.
    private const val LOCK_TIMEOUT_SECONDS = 60L
  }

  override fun getName(): String = "EdgeAttestation"

  /**
   * Runs [body] holding [keystoreLock], rejecting with `timeout` if the lock
   * cannot be acquired within [LOCK_TIMEOUT_SECONDS].
   *
   * That rejection code matters: the JS engine reads `timeout` as saying nothing
   * about whether the enrolled key can sign, so it retries the cheap refresh path
   * instead of escalating to a full attestation.
   */
  private fun withKeystoreLock(
    promise: Promise,
    body: () -> Unit
  ) {
    if (!keystoreLock.tryLock(LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
      promise.reject("timeout", "Timed out waiting for the Keystore lock")
      return
    }
    try {
      body()
    } finally {
      keystoreLock.unlock()
    }
  }

  /**
   * `keyId = base64url(SHA-256(leaf SPKI))` for the enrolled key, matching the
   * server's derivation. Null when no key is enrolled.
   */
  private fun currentKeyId(keyStore: KeyStore): String? {
    val cert = keyStore.getCertificate(KEY_ALIAS) ?: return null
    return Base64.encodeToString(
      MessageDigest.getInstance("SHA-256").digest(cert.publicKey.encoded),
      Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP
    )
  }

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
    // Key generation can be slow; run off the JS thread. Serialize all Keystore
    // access so an overlapping handshake cannot corrupt the shared alias.
    Thread {
      withKeystoreLock(promise) {
        val keyAlias = KEY_ALIAS
        try {
          if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            promise.reject(
              "unsupported",
              "Key attestation requires Android 7.0 (API 24) or later"
            )
            return@withKeystoreLock
          }

          // getAttestation is only called when (re-)enrollment is required, so
          // a leftover key under the stable alias is stale; delete it first.
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
          // The challenge's UTF-8 bytes are bound into the attestation
          // extension; the server compares them against the challenge it
          // issued. Builds the spec, optionally requesting a StrongBox-backed
          // key. A StrongBox (dedicated secure element, e.g. Pixel Titan M) key
          // attests at `attestationSecurityLevel = strongBox`, which the info
          // server maps to `secureElement`; a plain TEE key attests as
          // `trustedEnvironment` -> `hardware`.
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
            // Throw so the catch below deletes the half-created key rather than
            // leaving it enrolled with an attestation never returned to JS.
            throw IllegalStateException("Empty attestation certificate chain")
          }

          val certChain = Arguments.createArray()
          for (cert in chain) {
            certChain.pushString(
              Base64.encodeToString(cert.encoded, Base64.NO_WRAP)
            )
          }

          val result = Arguments.createMap()
          result.putArray("certChain", certChain)
          promise.resolve(result)
        } catch (e: Exception) {
          // A failed enrollment should not leave a half-created key behind. The
          // key is intentionally NOT deleted on success: it survives so
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
      }
    }.start()
  }

  @ReactMethod
  fun signChallenge(
    challenge: String,
    promise: Promise
  ) {
    Thread {
      withKeystoreLock(promise) {
        try {
          val keyStore = KeyStore.getInstance("AndroidKeyStore")
          keyStore.load(null)
          val entry =
            keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.PrivateKeyEntry
          if (entry == null) {
            promise.reject("noKey", "No attested key is stored")
            return@withKeystoreLock
          }
          val keyId = currentKeyId(keyStore)
          if (keyId == null) {
            promise.reject("noKey", "No attested key is stored")
            return@withKeystoreLock
          }
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
      }
    }.start()
  }

  @ReactMethod
  fun clearKey(
    keyId: String?,
    promise: Promise
  ) {
    // Off the caller's thread like the other two methods. This runs on the
    // shared native-modules thread, and keystoreLock can be held for seconds by
    // an in-progress getAttestation - attested EC key generation is slow, more
    // so for StrongBox. Waiting for it here would stall every native module in
    // the app, and JS calls this exactly when a handshake is already in flight.
    Thread {
      // Best-effort: force re-enrollment when the server rejects an assertion
      // (unknown key, revoked serial, disabled app). Resolve regardless.
      try {
        withKeystoreLock(promise) {
          val keyStore = KeyStore.getInstance("AndroidKeyStore")
          keyStore.load(null)
          // Only the key JS named. Waiting for the lock can take a while, and a
          // newer handshake may have enrolled a replacement in the meantime -
          // deleting that one would discard a working key over a verdict about
          // its predecessor. A null id means discard whatever is stored.
          if (keyId != null && currentKeyId(keyStore) != keyId) {
            promise.resolve(null)
            return@withKeystoreLock
          }
          keyStore.deleteEntry(KEY_ALIAS)
          promise.resolve(null)
        }
      } catch (ignored: Exception) {
        // Best effort.
        promise.resolve(null)
      }
    }.start()
  }
}
