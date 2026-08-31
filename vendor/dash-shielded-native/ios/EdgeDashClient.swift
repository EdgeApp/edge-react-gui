import Foundation

/// Thin names over the UniFFI `dash` namespace so RNDashShielded can keep
/// Objective-C selector names without shadowing the Rust functions.
enum EdgeDashClient {
  static func rustSetDocumentDirectory(path: String) throws {
    try setDocumentDirectory(path: path)
  }

  static func rustInitialize(
    mnemonicSeed: String,
    account: UInt32,
    alias: String,
    networkName: String,
    defaultHost: String,
    defaultPort: UInt32
  ) throws {
    try initialize(
      mnemonicSeed: mnemonicSeed,
      account: account,
      alias: alias,
      networkName: networkName,
      defaultHost: defaultHost,
      defaultPort: defaultPort
    )
  }

  static func rustStop(alias: String) throws -> String {
    try stop(alias: alias)
  }

  static func rustStartSync(alias: String) throws {
    try startSync(alias: alias)
  }

  static func rustStopSync(alias: String) throws {
    try stopSync(alias: alias)
  }

  static func rustDeriveShieldedAddress(alias: String) throws -> Addresses {
    try deriveShieldedAddress(alias: alias)
  }

  static func rustIsValidAddress(address: String, network: String) -> Bool {
    isValidAddress(address: address, network: network)
  }

  static func rustDeriveViewingKey(mnemonicSeed: String, network: String) throws -> String {
    try deriveViewingKey(mnemonicSeed: mnemonicSeed, network: network)
  }

  static func rustWarmUpProver() throws {
    try warmUpProver()
  }

  static func rustIsProverReady() -> Bool {
    isProverReady()
  }

  static func rustPoll(alias: String) throws -> Poll {
    try poll(alias: alias)
  }

  static func rustProposeTransfer(
    alias: String, amountCredits: String, toAddress: String, memo: String?
  ) throws -> String {
    try proposeTransfer(
      alias: alias,
      amountCredits: amountCredits,
      toAddress: toAddress,
      memo: memo
    )
  }

  static func rustCreateTransfer(
    alias: String, proposalId: String, mnemonicSeed: String
  ) throws -> String {
    try createTransfer(
      alias: alias, proposalId: proposalId, mnemonicSeed: mnemonicSeed)
  }

  static func rustDeriveShieldedAddressFromSeed(
    mnemonicSeed: String, network: String, account: UInt32
  ) throws -> String {
    try deriveShieldedAddressFromSeed(
      mnemonicSeed: mnemonicSeed, network: network, account: account)
  }
}
