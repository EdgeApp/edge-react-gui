package app.edge.rndashshielded

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import uniffi.dash.Poll
import java.io.File

class RNDashShieldedModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    private val moduleScope: CoroutineScope = CoroutineScope(Dispatchers.IO)

    override fun getName() = "RNDashShielded"

    @Volatile private var documentDirReady = false

    init {
        System.setProperty("uniffi.component.dash.libraryOverride", "dashshielded")
    }

    private fun ensureDocumentDirectory() {
        if (documentDirReady) return
        synchronized(this) {
            if (documentDirReady) return
            val dir = File(reactContext.filesDir, "native/dashshielded")
            dir.mkdirs()
            uniffi.dash.setDocumentDirectory(dir.absolutePath)
            documentDirReady = true
        }
    }

    private inline fun Promise.wrap(block: () -> Any?) {
        try {
            ensureDocumentDirectory()
            resolve(block())
        } catch (t: Throwable) {
            reject("Err", t)
        }
    }

    private fun pollMap(snap: Poll): WritableMap {
        val transactions = Arguments.createArray()
        snap.transactions.forEach { tx ->
            val map = Arguments.createMap()
            map.putString("txid", tx.txid)
            map.putInt("blockTimeInSeconds", tx.blockTimeInSeconds.toInt())
            map.putInt("minedHeight", tx.minedHeight.toInt())
            map.putString("value", tx.value)
            tx.fee?.let { map.putString("fee", it) }
            tx.toAddress?.let { map.putString("toAddress", it) }
            map.putArray("memos", Arguments.fromList(tx.memos))
            transactions.pushMap(map)
        }

        val out = Arguments.createMap()
        out.putString("alias", snap.alias)
        out.putString("status", snap.status)
        out.putDouble("scanProgress", snap.scanProgress)
        out.putInt("networkBlockHeight", snap.networkBlockHeight.toInt())
        out.putString("availableCredits", snap.availableCredits)
        out.putString("totalCredits", snap.totalCredits)
        out.putArray("transactions", transactions)
        return out
    }

    @ReactMethod
    fun initialize(
        seed: String,
        account: Int,
        alias: String,
        networkName: String,
        defaultHost: String,
        defaultPort: Int,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.dash.initialize(
                    seed,
                    account.toUInt(),
                    alias,
                    networkName,
                    defaultHost,
                    defaultPort.toUInt(),
                )
                null
            }
        }
    }

    @ReactMethod
    fun stop(alias: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap { uniffi.dash.stop(alias) }
        }
    }

    @ReactMethod
    fun startSync(alias: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap {
                uniffi.dash.startSync(alias)
                null
            }
        }
    }

    @ReactMethod
    fun stopSync(alias: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap {
                uniffi.dash.stopSync(alias)
                null
            }
        }
    }

    @ReactMethod
    fun deriveShieldedAddress(alias: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap {
                val addresses = uniffi.dash.deriveShieldedAddress(alias)
                val map = Arguments.createMap()
                map.putString("shieldedAddress", addresses.shieldedAddress)
                map
            }
        }
    }

    @ReactMethod
    fun deriveShieldedAddressFromSeed(
        seed: String,
        network: String,
        account: Int,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.dash.deriveShieldedAddressFromSeed(seed, network, account.toUInt())
            }
        }
    }

    @ReactMethod
    fun isValidAddress(address: String, network: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap { uniffi.dash.isValidAddress(address, network) }
        }
    }

    @ReactMethod
    fun deriveViewingKey(seed: String, network: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap { uniffi.dash.deriveViewingKey(seed, network) }
        }
    }

    @ReactMethod
    fun warmUpProver(promise: Promise) {
        moduleScope.launch {
            promise.wrap {
                uniffi.dash.warmUpProver()
                null
            }
        }
    }

    @ReactMethod
    fun isProverReady(promise: Promise) {
        moduleScope.launch {
            promise.wrap { uniffi.dash.isProverReady() }
        }
    }

    @ReactMethod
    fun poll(alias: String, promise: Promise) {
        moduleScope.launch {
            promise.wrap { pollMap(uniffi.dash.poll(alias)) }
        }
    }

    @ReactMethod
    fun proposeTransfer(
        alias: String,
        amountCredits: String,
        toAddress: String,
        memo: String?,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap {
                uniffi.dash.proposeTransfer(alias, amountCredits, toAddress, memo)
            }
        }
    }

    @ReactMethod
    fun createTransfer(
        alias: String,
        proposalId: String,
        seed: String,
        promise: Promise,
    ) {
        moduleScope.launch {
            promise.wrap { uniffi.dash.createTransfer(alias, proposalId, seed) }
        }
    }
}
