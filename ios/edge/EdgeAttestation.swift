import CryptoKit
import DeviceCheck
import Foundation
import React
import Security

/// Guarantees a React Native promise settles exactly once. The operation timeout
/// in `getAttestation` / `generateAssertion` and a late App Attest callback can
/// both reach for the same promise, and settling one twice is a hard error in
/// React Native.
private final class PromiseOnce {
  private let lock = NSLock()
  private var isSettled = false
  private let resolveBlock: RCTPromiseResolveBlock
  private let rejectBlock: RCTPromiseRejectBlock

  init(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    self.resolveBlock = resolve
    self.rejectBlock = reject
  }

  private func claim() -> Bool {
    lock.lock()
    defer { lock.unlock() }
    if isSettled { return false }
    isSettled = true
    return true
  }

  /// Returns whether this call is the one that settled the promise, so a caller
  /// can skip work that only makes sense if JS actually receives the result.
  @discardableResult
  func resolve(_ value: Any?) -> Bool {
    guard claim() else { return false }
    resolveBlock(value)
    return true
  }

  @discardableResult
  func reject(_ code: String, _ message: String, _ error: Error? = nil) -> Bool {
    guard claim() else { return false }
    rejectBlock(code, message, error)
    return true
  }
}

/// Native bridge for iOS App Attest (app-level attestation).
///
/// Exposes to JS:
///   - isSupported(): resolves true only on real devices that support App Attest
///   - getAttestation(challenge): attests an App Attest key against
///     SHA256(challenge) and resolves { keyId, attestation }, where attestation
///     is the base64-encoded CBOR attestation object
///   - generateAssertion(challenge): refreshes using the attested key
///   - clearKey(): discards the attested key so the next handshake re-attests
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

  // Caps how long one operation may hold `serialQueue`. attestKey can fail to
  // call back at all on a bad network, and an unbounded wait would wedge the
  // queue for the life of the process: every later getAttestation,
  // generateAssertion and clearKey would block behind it forever, including the
  // clearKey the JS engine uses to recover. Sized above the JS watchdog so JS
  // still gives up first in the normal case and this only catches the wedge.
  //
  // Giving up releases the queue while the App Attest callback is still
  // outstanding, so that callback can later run alongside a newer operation. Its
  // verdict applies only to the key it was given, which by then may not be the
  // stored one - hence the `ifMatches` clears below.
  private static let operationTimeout: DispatchTimeInterval = .seconds(120)

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

  /// Clears the stored id only while it is still the one the caller was working
  /// on.
  ///
  /// An App Attest callback can arrive after `operationTimeout` released the
  /// queue, by which point a newer handshake may have generated or enrolled a
  /// different key. An unconditional delete would then throw away that newer
  /// key on the strength of a verdict about an older one - costing a fresh
  /// `generateKey`, or worse, a full rate-limited attestation to replace an
  /// enrolled key that was working fine.
  ///
  /// Read-then-delete is not atomic, so a callback racing an operation that is
  /// mid-write can still clear the newer id. That window is microseconds against
  /// the two-minute one it closes, and it costs a retry rather than corrupting
  /// anything.
  private func clearAccount(_ account: String, ifMatches keyId: String) {
    guard loadAccount(account) == keyId else { return }
    clearAccount(account)
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

  private func clearKeyId(ifMatches keyId: String) {
    clearAccount(EdgeAttestation.keychainAccount, ifMatches: keyId)
  }

  private func storePendingKeyId(_ keyId: String) {
    storeAccount(EdgeAttestation.keychainPendingAccount, value: keyId)
  }

  private func loadPendingKeyId() -> String? {
    return loadAccount(EdgeAttestation.keychainPendingAccount)
  }

  private func clearPendingKeyId(ifMatches keyId: String) {
    clearAccount(EdgeAttestation.keychainPendingAccount, ifMatches: keyId)
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
    // attest completes or `operationTimeout` gives up on it.
    let promise = PromiseOnce(resolve: resolve, reject: reject)
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
            if !isRetryable { self.clearPendingKeyId(ifMatches: keyId) }
            promise.reject("attestKey", error.localizedDescription, error)
            return
          }
          guard let attestation = attestation else {
            self.clearPendingKeyId(ifMatches: keyId)
            promise.reject("attestKey", "Failed to produce an attestation object")
            return
          }
          // Persist the key id so subsequent handshakes refresh via assertions
          // instead of a full (rate-limited) attestation - but only once we know
          // JS is actually receiving this attestation. A callback that loses the
          // race arrives after the timeout below already failed the handshake,
          // which discarded the attestation object with it, so the server will
          // never have verified this key. Enrolling it anyway would cost the next
          // handshake a pointless assertion round trip before it re-attests.
          if promise.resolve([
            "keyId": keyId,
            "attestation": attestation.base64EncodedString(),
            "bundleId": Bundle.main.bundleIdentifier ?? ""
          ]) {
            self.storeKeyId(keyId)
          }
          // Either way the key is spent: attestKey succeeded, so it can never be
          // attested again and must not be retried as a pending key.
          self.clearPendingKeyId(ifMatches: keyId)
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
            promise.reject("generateKey", error.localizedDescription, error)
            done.signal()
            return
          }
          guard let keyId = keyId else {
            promise.reject("generateKey", "Failed to generate an App Attest key")
            done.signal()
            return
          }
          // Record the key before attesting it, so an attestKey failure Apple
          // wants retried can reuse it instead of burning a new one.
          self.storePendingKeyId(keyId)
          attest(keyId)
        }
      }

      if done.wait(timeout: .now() + EdgeAttestation.operationTimeout) == .timedOut {
        // Leave the pending key id in place: the attestation never completed, so
        // the key was never consumed and the next attempt should reuse it.
        promise.reject("timeout", "App Attest attestation timed out")
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

    let promise = PromiseOnce(resolve: resolve, reject: reject)
    EdgeAttestation.serialQueue.async {
      guard let keyId = self.loadKeyId() else {
        promise.reject("noKey", "No attested App Attest key is stored")
        return
      }
      let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))
      let done = DispatchSemaphore(value: 0)
      DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: clientDataHash) { assertion, error in
        defer { done.signal() }
        if let error = error as? DCError, error.code == .invalidKey {
          // The key no longer exists (reinstall/restore); force re-attestation.
          // Only if it is still the enrolled one: a callback that arrives after
          // the timeout below may be condemning a key a newer handshake has
          // already replaced, and deleting that replacement would spend a full
          // attestation to enrol a key we just had.
          self.clearKeyId(ifMatches: keyId)
          promise.reject("invalidKey", "Stored App Attest key is invalid", error)
          return
        }
        if let error = error {
          promise.reject("generateAssertion", error.localizedDescription, error)
          return
        }
        guard let assertion = assertion else {
          promise.reject("generateAssertion", "Failed to produce an assertion")
          return
        }
        promise.resolve([
          "keyId": keyId,
          "assertion": assertion.base64EncodedString(),
          "bundleId": Bundle.main.bundleIdentifier ?? ""
        ])
      }
      if done.wait(timeout: .now() + EdgeAttestation.operationTimeout) == .timedOut {
        promise.reject("timeout", "App Attest assertion timed out")
      }
    }
  }

  @objc(clearKey:resolver:rejecter:)
  func clearKey(
    _ keyId: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    EdgeAttestation.serialQueue.async {
      // Only the attested key. JS calls this when the *server* rejects an
      // assertion, which says nothing about a pending key the server has never
      // seen - and discarding that one would throw away the retry it is held for.
      //
      // Scoped to the key JS named. This block can wait a long time for the
      // queue, and running on "whatever is enrolled now" would let a verdict
      // about a rejected key delete the replacement a newer handshake enrolled
      // in the meantime - costing a full attestation to re-enrol a key that
      // worked. A nil id means the caller really does want whatever is stored.
      if let keyId = keyId {
        self.clearKeyId(ifMatches: keyId)
      } else {
        self.clearKeyId()
      }
      resolve(nil)
    }
  }
}
