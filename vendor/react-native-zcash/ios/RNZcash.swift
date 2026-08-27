import Foundation

@objc(RNZcash)
class RNZcash: RCTEventEmitter {
  private static var didSetDocumentDirectory = false

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private func ensureDocumentDirectory() throws {
    if RNZcash.didSetDocumentDirectory {
      return
    }
    let root = try FileManager.default.url(
      for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let path = root.appendingPathComponent("native/zcash", isDirectory: true).path
    try EdgeZcashClient.rustSetDocumentDirectory(path: path)
    RNZcash.didSetDocumentDirectory = true
  }

  private func run(
    _ resolve: @escaping RCTPromiseResolveBlock,
    _ reject: @escaping RCTPromiseRejectBlock,
    _ name: String,
    _ body: @escaping () throws -> Any?
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try self.ensureDocumentDirectory()
        let value = try body()
        resolve(value)
      } catch {
        reject(name, error.localizedDescription, error)
      }
    }
  }

  private func pollDictionary(_ snap: Poll) -> NSDictionary {
    let transactions: [NSDictionary] = snap.transactions.map { tx in
      var dict: [String: Any] = [
        "rawTransactionId": tx.rawTransactionId,
        "blockTimeInSeconds": tx.blockTimeInSeconds,
        "minedHeight": tx.minedHeight,
        "value": tx.value,
        "isShielding": tx.isShielding,
        "isExpired": tx.isExpired,
        "memos": tx.memos,
      ]
      if let fee = tx.fee {
        dict["fee"] = fee
      }
      if let toAddress = tx.toAddress {
        dict["toAddress"] = toAddress
      }
      return dict as NSDictionary
    }
    let balances: NSDictionary = [
      "transparentAvailableZatoshi": snap.balances.transparentAvailableZatoshi,
      "transparentTotalZatoshi": snap.balances.transparentTotalZatoshi,
      "saplingAvailableZatoshi": snap.balances.saplingAvailableZatoshi,
      "saplingTotalZatoshi": snap.balances.saplingTotalZatoshi,
      "orchardAvailableZatoshi": snap.balances.orchardAvailableZatoshi,
      "orchardTotalZatoshi": snap.balances.orchardTotalZatoshi,
      "ironwoodAvailableZatoshi": snap.balances.ironwoodAvailableZatoshi,
      "ironwoodTotalZatoshi": snap.balances.ironwoodTotalZatoshi,
    ]
    return [
      "alias": snap.alias,
      "status": snap.status,
      "scanProgress": snap.scanProgress,
      "networkBlockHeight": snap.networkBlockHeight,
      "balances": balances,
      "transactions": transactions,
    ] as NSDictionary
  }

  @objc func initialize(
    _ seed: String, _ birthdayHeight: Int, _ alias: String, _ networkName: String,
    _ defaultHost: String, _ defaultPort: Int, _ newWallet: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "InitializeError") {
      try EdgeZcashClient.rustInitialize(
        mnemonicSeed: seed,
        birthdayHeight: UInt32(birthdayHeight),
        alias: alias,
        networkName: networkName,
        defaultHost: defaultHost,
        defaultPort: UInt32(defaultPort),
        newWallet: newWallet
      )
      return nil
    }
  }

  @objc func stop(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "StopError") {
      try EdgeZcashClient.rustStop(alias: alias)
    }
  }

  @objc func getLatestNetworkHeight(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "getLatestNetworkHeight") {
      try EdgeZcashClient.rustGetLatestNetworkHeight(alias: alias)
    }
  }

  @objc func getBirthdayHeight(
    _ host: String, _ port: Int, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "getBirthdayHeight") {
      try EdgeZcashClient.rustGetBirthdayHeight(host: host, port: UInt32(port))
    }
  }

  @objc func proposeTransfer(
    _ alias: String, _ zatoshi: String, _ toAddress: String, _ memo: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "ProposeTransferError") {
      let memoArg = memo.isEmpty ? nil : memo
      return try EdgeZcashClient.rustProposeTransfer(
        alias: alias, zatoshi: zatoshi, toAddress: toAddress, memo: memoArg)
    }
  }

  @objc func proposeFulfillingPaymentURI(
    _ alias: String, _ paymentUri: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "proposeFulfillingPaymentURI") {
      try EdgeZcashClient.rustProposeFulfillingPaymentUri(
        alias: alias, paymentUri: paymentUri)
    }
  }

  @objc func createTransfer(
    _ alias: String, _ proposalBase64: String, _ seed: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "createTransfer") {
      try EdgeZcashClient.rustCreateTransfer(
        alias: alias, proposalBase64: proposalBase64, mnemonicSeed: seed)
    }
  }

  @objc func broadcastTransfer(
    _ alias: String, _ txid: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "broadcastTransfer") {
      try EdgeZcashClient.rustBroadcastTransfer(alias: alias, txid: txid)
    }
  }

  @objc func shieldFunds(
    _ alias: String, _ seed: String, _ memo: String, _ threshold: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "shieldFunds") {
      try EdgeZcashClient.rustShieldFunds(
        alias: alias, seed: seed, memo: memo, threshold: threshold)
    }
  }

  @objc func emitExistingTransactions(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "emitExistingTransactionsError") {
      try EdgeZcashClient.rustEmitExistingTransactions(alias: alias)
      return nil
    }
  }

  @objc func rescan(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "RescanError") {
      try EdgeZcashClient.rustRescan(alias: alias)
      return nil
    }
  }

  @objc func proposeOrchardToIronwoodMigration(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "proposeOrchardToIronwoodMigration") {
      try EdgeZcashClient.rustProposeOrchardToIronwoodMigration(alias: alias)
    }
  }

  @objc func ironwoodActivationHeight(
    _ networkName: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "ironwoodActivationHeight") {
      EdgeZcashClient.rustIronwoodActivationHeight(network: networkName)
    }
  }

  @objc func deriveViewingKey(
    _ seed: String, _ network: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "DeriveViewingKeyError") {
      try EdgeZcashClient.rustDeriveViewingKey(mnemonicSeed: seed, network: network)
    }
  }

  @objc func deriveUnifiedAddress(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "deriveUnifiedAddress") {
      let addresses = try EdgeZcashClient.rustDeriveUnifiedAddress(alias: alias)
      return [
        "unifiedAddress": addresses.unifiedAddress,
        "saplingAddress": addresses.saplingAddress,
        "transparentAddress": addresses.transparentAddress,
      ] as NSDictionary
    }
  }

  @objc func isValidAddress(
    _ address: String, _ network: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "isValidAddress") {
      EdgeZcashClient.rustIsValidAddress(address: address, network: network)
    }
  }

  @objc func poll(
    _ alias: String, resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    run(resolve, reject, "poll") {
      let snap = try EdgeZcashClient.rustPoll(alias: alias)
      return self.pollDictionary(snap)
    }
  }

  override func supportedEvents() -> [String] {
    return ["BalanceEvent", "ErrorEvent", "StatusEvent", "TransactionEvent", "UpdateEvent"]
  }
}
