import CryptoKit
import DeviceCheck
import Foundation
import React
import Security

/// Native bridge for iOS App Attest (app-level attestation).
///
/// Exposes to JS:
///   - isSupported(): resolves true only on real devices that support App Attest
///   - getAttestation(challenge): attests an App Attest key against
///     SHA256(challenge) and resolves { keyId, attestation }, where attestation
///     is the base64-encoded CBOR attestation object
///   - generateAssertion(challenge): refreshes using the attested key
///   - clearKey(): discards the stored key so the next handshake re-attests
@objc(EdgeAttestation)
class EdgeAttestation: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // Serializes all key operations. The JS engine normally single-flights
  // handshakes, but its 90s watchdog can release the lock and start a second
  // handshake while an older native call is still running. Without this queue,
  // overlapping getAttestation / generateAssertion / clearKey calls could race
  // on the stored key id and leave assertions out of sync with the cached JWT.
  // Each async App Attest operation holds the queue (via a semaphore) until it
  // completes, so the operations never interleave.
  private static let serialQueue = DispatchQueue(
    label: "co.edgesecure.app.appattest.serial"
  )

  // Keychain persistence for App Attest key ids. App Attest private keys live
  // in the Secure Enclave keyed by this id; Apple recommends storing the id in
  // the Keychain so it survives across launches.
  //
  // `keyId` holds a successfully attested key, reused for assertions so later
  // handshakes never re-attest. `pendingKeyId` holds a key that was generated
  // but not yet attested, kept only across failures Apple says to retry (see
  // getAttestation) so a transient outage does not burn a new key per attempt.
  private static let keychainService = "co.edgesecure.app.appattest"
  private static let keychainAccount = "keyId"
  private static let keychainPendingAccount = "pendingKeyId"

  private func storeAccount(_ account: String, value: String) {
    clearAccount(account)
    guard let data = value.data(using: .utf8) else { return }
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: EdgeAttestation.keychainService,
      kSecAttrAccount as String: account,
      kSecValueData as String: data
    ]
    SecItemAdd(query as CFDictionary, nil)
  }

  private func loadAccount(_ account: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: EdgeAttestation.keychainService,
      kSecAttrAccount as String: account,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let data = item as? Data else { return nil }
    return String(data: data, encoding: .utf8)
  }

  private func clearAccount(_ account: String) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: EdgeAttestation.keychainService,
      kSecAttrAccount as String: account
    ]
    SecItemDelete(query as CFDictionary)
  }

  private func storeKeyId(_ keyId: String) {
    storeAccount(EdgeAttestation.keychainAccount, value: keyId)
  }

  private func loadKeyId() -> String? {
    return loadAccount(EdgeAttestation.keychainAccount)
  }

  private func clearKeyId() {
    clearAccount(EdgeAttestation.keychainAccount)
  }

  private func storePendingKeyId(_ keyId: String) {
    storeAccount(EdgeAttestation.keychainPendingAccount, value: keyId)
  }

  private func loadPendingKeyId() -> String? {
    return loadAccount(EdgeAttestation.keychainPendingAccount)
  }

  private func clearPendingKeyId() {
    clearAccount(EdgeAttestation.keychainPendingAccount)
  }

  @objc(isSupported:rejecter:)
  func isSupported(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 14.0, *) {
      resolve(DCAppAttestService.shared.isSupported)
    } else {
      resolve(false)
    }
  }

  @objc(getAttestation:resolver:rejecter:)
  func getAttestation(
    _ challenge: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 14.0, *) else {
      reject("unsupported", "App Attest requires iOS 14 or later", nil)
      return
    }
    let service = DCAppAttestService.shared
    guard service.isSupported else {
      reject("unsupported", "App Attest is not supported on this device", nil)
      return
    }

    // Serialize against other key operations; hold the queue until the async
    // attest completes.
    EdgeAttestation.serialQueue.async {
      let done = DispatchSemaphore(value: 0)

      // The client data is the challenge's UTF-8 bytes; the server recomputes
      // SHA256(challenge) to validate the attestation nonce.
      let attest: (String) -> Void = { keyId in
        let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))

        service.attestKey(keyId, clientDataHash: clientDataHash) { attestation, error in
          defer { done.signal() }
          if let error = error {
            // Apple's guidance is to retry a serverUnavailable attestation
            // later with the same key, because generating keys is a limited
            // resource. Any other failure may be permanent for this key, so
            // discard it rather than retrying a dead key on every handshake
            // for the life of the install.
            let isRetryable = (error as? DCError)?.code == .serverUnavailable
            if !isRetryable { self.clearPendingKeyId() }
            reject("attestKey", error.localizedDescription, error)
            return
          }
          guard let attestation = attestation else {
            self.clearPendingKeyId()
            reject("attestKey", "Failed to produce an attestation object", nil)
            return
          }
          // Persist the key id so subsequent handshakes refresh via assertions
          // instead of a full (rate-limited) attestation.
          self.storeKeyId(keyId)
          self.clearPendingKeyId()
          resolve([
            "keyId": keyId,
            "attestation": attestation.base64EncodedString(),
            "bundleId": Bundle.main.bundleIdentifier ?? ""
          ])
        }
      }

      // A key may only be attested once, so a successful handshake always
      // needs a new one - but a key whose attestation failed was never
      // consumed. Retry that one before asking for another.
      if let pendingKeyId = self.loadPendingKeyId() {
        attest(pendingKeyId)
      } else {
        service.generateKey { keyId, error in
          if let error = error {
            reject("generateKey", error.localizedDescription, error)
            done.signal()
            return
          }
          guard let keyId = keyId else {
            reject("generateKey", "Failed to generate an App Attest key", nil)
            done.signal()
            return
          }
          // Record the key before attesting it: a crash or a transient
          // attestKey failure between here and the callback would otherwise
          // orphan a Secure Enclave key.
          self.storePendingKeyId(keyId)
          attest(keyId)
        }
      }

      done.wait()
    }
  }

  @objc(generateAssertion:resolver:rejecter:)
  func generateAssertion(
    _ challenge: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 14.0, *), DCAppAttestService.shared.isSupported else {
      reject("unsupported", "App Attest is not supported on this device", nil)
      return
    }

    EdgeAttestation.serialQueue.async {
      guard let keyId = self.loadKeyId() else {
        reject("noKey", "No attested App Attest key is stored", nil)
        return
      }
      let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))
      let done = DispatchSemaphore(value: 0)
      DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: clientDataHash) { assertion, error in
        defer { done.signal() }
        if let error = error as? DCError, error.code == .invalidKey {
          // The key no longer exists (reinstall/restore); force re-attestation.
          self.clearKeyId()
          reject("invalidKey", "Stored App Attest key is invalid", error)
          return
        }
        if let error = error {
          reject("generateAssertion", error.localizedDescription, error)
          return
        }
        guard let assertion = assertion else {
          reject("generateAssertion", "Failed to produce an assertion", nil)
          return
        }
        resolve([
          "keyId": keyId,
          "assertion": assertion.base64EncodedString(),
          "bundleId": Bundle.main.bundleIdentifier ?? ""
        ])
      }
      done.wait()
    }
  }

  @objc(clearKey:rejecter:)
  func clearKey(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    EdgeAttestation.serialQueue.async {
      self.clearKeyId()
      self.clearPendingKeyId()
      resolve(nil)
    }
  }
}
