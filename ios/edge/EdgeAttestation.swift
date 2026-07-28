import CryptoKit
import DeviceCheck
import Foundation
import React
import Security

/// Native bridge for iOS App Attest (app-level attestation).
///
/// Exposes methods to JS:
///   - isSupported(): resolves true only on real devices that support App Attest
///   - getAttestation(challenge): attests a pending (or freshly generated) App
///     Attest key against SHA256(challenge), and resolves { keyId, attestation },
///     where attestation is the base64-encoded CBOR attestation object
///   - generateAssertion(challenge) / clearKey(): assertion refresh and reset
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
  // `keyId` holds a successfully attested key (reused for assertions).
  // `pendingKeyId` holds a key that was generated but not yet attested — kept
  // across transient `attestKey` failures (e.g. serverUnavailable) so the next
  // handshake retries with the same key instead of calling `generateKey` again.
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
    loadAccount(EdgeAttestation.keychainAccount)
  }

  private func clearKeyId() {
    clearAccount(EdgeAttestation.keychainAccount)
  }

  private func storePendingKeyId(_ keyId: String) {
    storeAccount(EdgeAttestation.keychainPendingAccount, value: keyId)
  }

  private func loadPendingKeyId() -> String? {
    loadAccount(EdgeAttestation.keychainPendingAccount)
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

      // Attest `keyId` against SHA256(challenge). On success, promote the key
      // from pending → attested so assertions can reuse it. On invalidKey,
      // discard the pending id so the next call generates a fresh key. On
      // other errors (notably serverUnavailable), leave the pending id so the
      // next handshake retries attestKey with the same key — Apple's guidance.
      let attestPending: (String) -> Void = { keyId in
        let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))
        service.attestKey(keyId, clientDataHash: clientDataHash) { attestation, error in
          defer { done.signal() }
          if let error = error as? DCError, error.code == .invalidKey {
            self.clearPendingKeyId()
            reject("invalidKey", "App Attest key is invalid", error)
            return
          }
          if let error = error {
            reject("attestKey", error.localizedDescription, error)
            return
          }
          guard let attestation = attestation else {
            reject("attestKey", "Failed to produce an attestation object", nil)
            return
          }
          self.storeKeyId(keyId)
          self.clearPendingKeyId()
          resolve([
            "keyId": keyId,
            "attestation": attestation.base64EncodedString(),
            "bundleId": Bundle.main.bundleIdentifier ?? ""
          ])
        }
      }

      // Retry a previously generated but unattested key when present; otherwise
      // generate a new one and persist it before attestKey so a transient
      // failure does not orphan the Secure Enclave key.
      if let pendingKeyId = self.loadPendingKeyId() {
        attestPending(pendingKeyId)
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
          self.storePendingKeyId(keyId)
          attestPending(keyId)
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
