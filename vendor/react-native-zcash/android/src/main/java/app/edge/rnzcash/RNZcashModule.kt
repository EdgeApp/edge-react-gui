package app.edge.rnzcash

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import uniffi.zcash.Poll
import java.io.File

class RNZcashModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    private val moduleScope: CoroutineScope = CoroutineScope(Dispatchers.IO)

    override fun getName() = "RNZcash"

    init {
        System.setProperty("uniffi.component.zcash.libraryOverride", "zcash")
        val dir = File(reactContext.filesDir, "native/zcash")
        dir.mkdirs()
        uniffi.zcash.setDocumentDirectory(dir.absolutePath)
    }

    private inline fun Promise.wrap(block: () -> Any?) {
        try {
            resolve(block())
        } catch (t: Throwable) {
            reject("Err", t)
        }
    }

    private fun pollMap(snap: Poll): WritableMap {
        val balances = Arguments.createMap()
        balances.putString("transparentAvailableZatoshi", snap.balances.transparentAvailableZatoshi)
        balances.putString("transparentTotalZatoshi", snap.balances.transparentTotalZatoshi)
        balances.putString("saplingAvailableZatoshi", snap.balances.saplingAvailableZatoshi)
        balances.putString("saplingTotalZatoshi", snap.balances.saplingTotalZatoshi)
        balances.putString("orchardAvailableZatoshi", snap.balances.orchardAvailableZatoshi)
        balances.putString("orchardTotalZatoshi", snap.balances.orchardTotalZatoshi)
        balances.putString("ironwoodAvailableZatoshi", snap.balances.ironwoodAvailableZatoshi)
        balances.putString("ironwoodTotalZatoshi", snap.balances.ironwoodTotalZatoshi)

        val transactions = Arguments.createArray()
        snap.transactions.forEach { tx ->
            val map = Arguments.createMap()
            map.putString("rawTransactionId", tx.rawTransactionId)
            map.putInt("blockTimeInSeconds", tx.blockTimeInSeconds.toInt())
            map.putInt("minedHeight", tx.minedHeight.toInt())
            map.putString("value", tx.value)
            tx.fee?.let { map.putString("fee", it) }
            tx.toAddress?.let { map.putString("toAddress", it) }
            map.putBoolean("isShielding", tx.isShielding)
            map.putBoolean("isExpired", tx.isExpired)
            map.putArray("memos", Arguments.fromList(tx.memos))
            transactions.pushMap(map)
        }

        val out = Arguments.createMap()
        out.putString("alias", snap.alias)
        out.putString("status", snap.status)
        out.putDouble("scanProgress", snap.scanProgress)
        out.putInt("networkBlockHeight", snap.networkBlockHeight.toInt())
        out.putMap("balances", balances)
        out.putArray("transactions", transactions)
        return out
    }

    @ReactMethod
    fun initialize(
        seed: String,
        birthdayHeight: Int,
        alias: String,
        networkName: String,
        defaultHost: String,
        defaultPort: Int,
        newWallet: Boolean,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.zcash.initialize(
                    seed,
                    birthdayHeight.toUInt(),
                    alias,
                    networkName,
                    defaultHost,
                    defaultPort.toUInt(),
                    newWallet,
                )
                null
            }
        }
    }

    @ReactMethod
    fun stop(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.stop(alias) }
        }
    }

    @ReactMethod
    fun rescan(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.zcash.rescan(alias)
                null
            }
        }
    }

    @ReactMethod
    fun deriveViewingKey(
        seed: String,
        network: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.deriveViewingKey(seed, network) }
        }
    }

    @ReactMethod
    fun getLatestNetworkHeight(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.getLatestNetworkHeight(alias).toInt() }
        }
    }

    @ReactMethod
    fun getBirthdayHeight(
        host: String,
        port: Int,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.getBirthdayHeight(host, port.toUInt()).toInt() }
        }
    }

    @ReactMethod
    fun proposeTransfer(
        alias: String,
        zatoshi: String,
        toAddress: String,
        memo: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.zcash.proposeTransfer(
                    alias,
                    zatoshi,
                    toAddress,
                    memo.ifEmpty { null },
                )
            }
        }
    }

    @ReactMethod
    fun proposeFulfillingPaymentURI(
        alias: String,
        paymentUri: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.proposeFulfillingPaymentUri(alias, paymentUri) }
        }
    }

    @ReactMethod
    fun createTransfer(
        alias: String,
        proposalBase64: String,
        seed: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.createTransfer(alias, proposalBase64, seed) }
        }
    }

    @ReactMethod
    fun shieldFunds(
        alias: String,
        seed: String,
        memo: String,
        threshold: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.shieldFunds(alias, seed, memo, threshold) }
        }
    }

    @ReactMethod
    fun deriveUnifiedAddress(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                val addresses = uniffi.zcash.deriveUnifiedAddress(alias)
                val map = Arguments.createMap()
                map.putString("unifiedAddress", addresses.unifiedAddress)
                map.putString("saplingAddress", addresses.saplingAddress)
                map.putString("transparentAddress", addresses.transparentAddress)
                map
            }
        }
    }

    @ReactMethod
    fun isValidAddress(
        address: String,
        network: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.isValidAddress(address, network) }
        }
    }

    @ReactMethod
    fun emitExistingTransactions(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.zcash.emitExistingTransactions(alias)
                null
            }
        }
    }

    @ReactMethod
    fun ironwoodActivationHeight(
        networkName: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.zcash.ironwoodActivationHeight(networkName)?.toInt()
            }
        }
    }

    @ReactMethod
    fun proposeOrchardToIronwoodMigration(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.zcash.proposeOrchardToIronwoodMigration(alias) }
        }
    }

    @ReactMethod
    fun poll(
        alias: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { pollMap(uniffi.zcash.poll(alias)) }
        }
    }
}
