import CryptoKit
import DeviceCheck
import Foundation
import React
import Security

/// Native bridge for iOS App Attest (app-level attestation).
///
/// Exposes two methods to JS:
///   - isSupported(): resolves true only on real devices that support App Attest
///   - getAttestation(challenge): generates a fresh App Attest key, attests it
///     against SHA256(challenge), and resolves { keyId, attestation }, where
///     attestation is the base64-encoded CBOR attestation object.
@objc(EdgeAttestation)
class EdgeAttestation: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // Keychain persistence for the attested App Attest key id. App Attest private
  // keys live in the Secure Enclave keyed by this id; Apple recommends storing
  // the id in the Keychain so it survives across launches and is reused for
  // assertions (no re-attestation).
  private static let keychainService = "co.edgesecure.app.appattest"
  private static let keychainAccount = "keyId"

  private func storeKeyId(_ keyId: String) {
    clearKeyId()
    guard let data = keyId.data(using: .utf8) else { return }
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: EdgeAttestation.keychainService,
      kSecAttrAccount as String: EdgeAttestation.keychainAccount,
      kSecValueData as String: data
    ]
    SecItemAdd(query as CFDictionary, nil)
  }

  private func loadKeyId() -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: EdgeAttestation.keychainService,
      kSecAttrAccount as String: EdgeAttestation.keychainAccount,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let data = item as? Data else { return nil }
    return String(data: data, encoding: .utf8)
  }

  private func clearKeyId() {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: EdgeAttestation.keychainService,
      kSecAttrAccount as String: EdgeAttestation.keychainAccount
    ]
    SecItemDelete(query as CFDictionary)
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

    // A fresh key is generated per handshake: an App Attest key can only be
    // attested once, so reuse would require the assertion flow instead.
    service.generateKey { keyId, error in
      if let error = error {
        reject("generateKey", error.localizedDescription, error)
        return
      }
      guard let keyId = keyId else {
        reject("generateKey", "Failed to generate an App Attest key", nil)
        return
      }

      // The client data is the challenge's UTF-8 bytes; the server recomputes
      // SHA256(challenge) to validate the attestation nonce.
      let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))

      service.attestKey(keyId, clientDataHash: clientDataHash) { attestation, error in
        if let error = error {
          reject("attestKey", error.localizedDescription, error)
          return
        }
        guard let attestation = attestation else {
          reject("attestKey", "Failed to produce an attestation object", nil)
          return
        }
        // Persist the key id so subsequent handshakes refresh via assertions
        // instead of a full (rate-limited) attestation.
        self.storeKeyId(keyId)
        resolve([
          "keyId": keyId,
          "attestation": attestation.base64EncodedString(),
          "bundleId": Bundle.main.bundleIdentifier ?? ""
        ])
      }
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
    guard let keyId = loadKeyId() else {
      reject("noKey", "No attested App Attest key is stored", nil)
      return
    }
    let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))
    DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: clientDataHash) { assertion, error in
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
  }

  @objc(clearKey:rejecter:)
  func clearKey(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    clearKeyId()
    resolve(nil)
  }
}
