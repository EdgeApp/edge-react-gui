import CryptoKit
import DeviceCheck
import Foundation
import React

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
        resolve([
          "keyId": keyId,
          "attestation": attestation.base64EncodedString(),
          "bundleId": Bundle.main.bundleIdentifier ?? ""
        ])
      }
    }
  }
}
