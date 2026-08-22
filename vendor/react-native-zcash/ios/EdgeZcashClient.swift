import Foundation

/// Thin names over the UniFFI `zcash` namespace so RNZcash can keep the
/// existing Objective-C selector names without shadowing the Rust functions.
enum EdgeZcashClient {
  static func rustSetDocumentDirectory(path: String) throws {
    try setDocumentDirectory(path: path)
  }

  static func rustInitialize(
    mnemonicSeed: String,
    birthdayHeight: UInt32,
    alias: String,
    networkName: String,
    defaultHost: String,
    defaultPort: UInt32,
    newWallet: Bool
  ) throws {
    try initialize(
      mnemonicSeed: mnemonicSeed,
      birthdayHeight: birthdayHeight,
      alias: alias,
      networkName: networkName,
      defaultHost: defaultHost,
      defaultPort: defaultPort,
      newWallet: newWallet
    )
  }

  static func rustStop(alias: String) throws -> String {
    try stop(alias: alias)
  }

  static func rustRescan(alias: String) throws {
    try rescan(alias: alias)
  }

  static func rustDeriveUnifiedAddress(alias: String) throws -> Addresses {
    try deriveUnifiedAddress(alias: alias)
  }

  static func rustGetLatestNetworkHeight(alias: String) throws -> UInt32 {
    try getLatestNetworkHeight(alias: alias)
  }

  static func rustGetBirthdayHeight(host: String, port: UInt32) throws -> UInt32 {
    try getBirthdayHeight(host: host, port: port)
  }

  static func rustIsValidAddress(address: String, network: String) -> Bool {
    isValidAddress(address: address, network: network)
  }

  static func rustDeriveViewingKey(mnemonicSeed: String, network: String) throws -> String {
    try deriveViewingKey(mnemonicSeed: mnemonicSeed, network: network)
  }

  static func rustIronwoodActivationHeight(network: String) -> UInt32? {
    ironwoodActivationHeight(network: network)
  }

  static func rustPoll(alias: String) throws -> Poll {
    try poll(alias: alias)
  }

  static func rustProposeTransfer(
    alias: String, zatoshi: String, toAddress: String, memo: String?
  ) throws -> String {
    try proposeTransfer(
      alias: alias, zatoshi: zatoshi, toAddress: toAddress, memo: memo)
  }

  static func rustCreateTransfer(
    alias: String, proposalBase64: String, mnemonicSeed: String
  ) throws -> String {
    try createTransfer(
      alias: alias, proposalBase64: proposalBase64, mnemonicSeed: mnemonicSeed)
  }

  static func rustShieldFunds(
    alias: String, seed: String, memo: String, threshold: String
  ) throws -> String {
    try shieldFunds(alias: alias, seed: seed, memo: memo, threshold: threshold)
  }

  static func rustProposeOrchardToIronwoodMigration(alias: String) throws -> String {
    try proposeOrchardToIronwoodMigration(alias: alias)
  }

  static func rustProposeFulfillingPaymentUri(alias: String, paymentUri: String) throws -> String {
    try proposeFulfillingPaymentUri(alias: alias, paymentUri: paymentUri)
  }

  static func rustEmitExistingTransactions(alias: String) throws {
    try emitExistingTransactions(alias: alias)
  }
}
