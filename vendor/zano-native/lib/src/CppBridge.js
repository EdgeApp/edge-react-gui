'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CppBridge = void 0;
const types_1 = require("./types");
const walletFilePassword_1 = require("./walletFilePassword");
function isWrongPassword(error) {
    return error instanceof types_1.ZanoError && error.code === 'WRONG_PASSWORD';
}
function isAlreadyExists(error) {
    return error instanceof types_1.ZanoError && error.code === 'ALREADY_EXISTS';
}
class CppBridge {
    constructor(zanoModule) {
        // Whether `configurePostponedRun` has succeeded. The native flag it sets
        // is process-wide and sticky, so one success covers every later call:
        this.postponedRunConfigured = false;
        // The native side omits `documentDirectory` when it could not create the
        // wallet directory or exclude it from device backups. That directory
        // holds the seed and spend keys, so a missing value must stop the bridge
        // here rather than let every path below concatenate `undefined` into a
        // storage path the SDK would happily create somewhere unprotected.
        if (zanoModule.documentDirectory == null ||
            zanoModule.documentDirectory === '') {
            throw new types_1.ZanoError('INTERNAL_ERROR', 'Zano native module reported no document directory');
        }
        this.documentDirectory = zanoModule.documentDirectory;
        this.module = zanoModule;
    }
    // -----------------------------------------------------------------------------
    // Raw API
    // -----------------------------------------------------------------------------
    async init(rpcAddress, logLevel) {
        const response = await this.module.callZano('init', [
            rpcAddress,
            this.documentDirectory,
            logLevel.toFixed()
        ]);
        return JSON.parse(response);
    }
    async initWithIpPort(ip, port, logLevel) {
        const response = await this.module.callZano('initWithIpPort', [
            ip,
            port,
            this.documentDirectory,
            logLevel.toFixed()
        ]);
        return JSON.parse(response);
    }
    async reset() {
        const response = await this.module.callZano('reset', []);
        return JSON.parse(response);
    }
    async setLogLevel(logLevel) {
        return await this.module.callZano('setLogLevel', [logLevel.toFixed()]);
    }
    async getVersion() {
        return await this.module.callZano('getVersion', []);
    }
    async getWalletFiles() {
        const files = await this.module.callZano('getWalletFiles', []);
        return JSON.parse(files);
    }
    async getExportPrivateInfo(targetDir) {
        const response = await this.module.callZano('getExportPrivateInfo', [
            targetDir
        ]);
        return JSON.parse(response);
    }
    async deleteWallet(fileName) {
        const response = await this.module.callZano('deleteWallet', [fileName]);
        return JSON.parse(response);
    }
    async getAddressInfo(addr) {
        const response = await this.module.callZano('getAddressInfo', [addr]);
        return JSON.parse(response);
    }
    async getAppconfig(encryptionKey) {
        const response = await this.module.callZano('getAppconfig', [encryptionKey]);
        return JSON.parse(response);
    }
    async setAppconfig(confStr, encryptionKey) {
        const response = await this.module.callZano('setAppconfig', [
            confStr,
            encryptionKey
        ]);
        return JSON.parse(response);
    }
    async generateRandomKey(length) {
        return await this.module.callZano('generateRandomKey', [length.toFixed()]);
    }
    async getLogsBuffer() {
        return await this.module.callZano('getLogsBuffer', []);
    }
    async truncateLog() {
        const response = await this.module.callZano('truncateLog', []);
        return JSON.parse(response);
    }
    async getConnectivityStatus() {
        const response = await this.module.callZano('getConnectivityStatus', []);
        return JSON.parse(response);
    }
    /**
     * Raw native open. Note that once `startWallet` or `generateSeedPhrase`
     * has run, the process-wide postponed-run mode is configured and stays on:
     * a wallet opened here will not sync until `run_wallet` is issued for it
     * (via `syncCall`). Prefer `startWallet`.
     */
    async open(path, password) {
        const response = await this.module.callZano('open', [path, password]);
        return JSON.parse(response);
    }
    /**
     * Raw native restore. Subject to the same postponed-run caveat as `open`:
     * under postponed mode the restored wallet will not sync until
     * `run_wallet` is issued for it.
     */
    async restore(seed, path, password, seedPassword) {
        const response = await this.module.callZano('restore', [
            seed,
            path,
            password,
            seedPassword
        ]);
        return JSON.parse(response);
    }
    /**
     * Raw native generate. Subject to the same postponed-run caveat as `open`:
     * under postponed mode the generated wallet will not sync until
     * `run_wallet` is issued for it.
     */
    async generate(path, password) {
        const response = await this.module.callZano('generate', [path, password]);
        return JSON.parse(response);
    }
    async getOpenedWallets() {
        const response = await this.module.callZano('getOpenedWallets', []);
        return JSON.parse(response);
    }
    async getWalletStatus(walletId) {
        const response = await this.module.callZano('getWalletStatus', [
            walletId.toFixed()
        ]);
        return JSON.parse(response);
    }
    async closeWallet(walletId) {
        const response = await this.module.callZano('closeWallet', [
            walletId.toFixed()
        ]);
        return JSON.parse(response);
    }
    async invoke(walletId, params) {
        return await this.module.callZano('invoke', [walletId.toFixed(), params]);
    }
    async asyncCall(methodName, instanceId, params) {
        const response = await this.module.callZano('asyncCall', [
            methodName,
            instanceId.toFixed(),
            params
        ]);
        return JSON.parse(response);
    }
    async tryPullResult(arg) {
        const response = await this.module.callZano('tryPullResult', [
            arg.toFixed()
        ]);
        return JSON.parse(response);
    }
    async syncCall(methodName, instanceId, params) {
        return await this.module.callZano('syncCall', [
            methodName,
            instanceId.toFixed(),
            params
        ]);
    }
    /**
     * Tells the native library not to start a wallet's refresh worker as part
     * of `open`/`restore`/`generate`; `runWallet` starts it explicitly. The
     * flag is process-wide and sticky, so every open made after this call must
     * be followed by `runWallet` once the wallet should sync -- and one
     * success is enough, so this short-circuits instead of paying a native
     * round trip per wallet start. Requires `init` to have run.
     */
    async configurePostponedRun() {
        if (this.postponedRunConfigured)
            return;
        const response = await this.syncCall('configure', 0, JSON.stringify({ postponed_run_wallet: true }));
        // Same `syncCall` primitive as `runWallet`, same quirk: one native
        // failure path answers with a bare return-code string rather than JSON,
        // so a parse failure is a failure report, not a protocol surprise:
        let parsed;
        try {
            parsed = JSON.parse(response);
        }
        catch (error) {
            throw new Error(`Zano configure returned ${response}`);
        }
        if (parsed.status !== 'OK') {
            throw new Error(`Zano configure returned ${response}`);
        }
        this.postponedRunConfigured = true;
    }
    /**
     * Starts the refresh worker for an open wallet. Idempotent: the native
     * side skips the spawn when the worker is already running.
     *
     * Public because adopting a wallet is public behavior: `startWallet`
     * rethrows ALREADY_EXISTS for its caller to recover from, and the wallet
     * the caller then adopts was opened with the refresh worker postponed, so
     * it does not sync until this runs.
     */
    async runWallet(walletId) {
        const response = await this.syncCall('run_wallet', walletId, '');
        // One native failure path answers with a bare return-code string rather
        // than JSON (the postponed main worker failing to start), so a parse
        // failure is a failure report, not a protocol surprise:
        let parsed;
        try {
            parsed = JSON.parse(response);
        }
        catch (error) {
            throw new Error(`Zano run_wallet returned ${response}`);
        }
        if (parsed.error_code !== 'OK') {
            throw new Error(`Zano run_wallet returned ${response}`);
        }
    }
    async isWalletExist(path) {
        const response = await this.module.callZano('isWalletExist', [
            this.documentDirectory + '/wallets/' + path
        ]);
        return response === '1';
    }
    async getWalletInfo(walletId) {
        const response = await this.module.callZano('getWalletInfo', [
            walletId.toFixed()
        ]);
        return JSON.parse(response);
    }
    async resetWalletPassword(walletId, password) {
        return await this.module.callZano('resetWalletPassword', [
            walletId.toFixed(),
            password
        ]);
    }
    // 0 (default), 1 (unimportant), 2 (normal), 3 (elevated), 4 (priority)
    async getCurrentTxFee(priority) {
        const fee = await this.module.callZano('getCurrentTxFee', [
            priority.toFixed()
        ]);
        return parseInt(fee);
    }
    // -----------------------------------------------------------------------------
    // Convenience API
    // -----------------------------------------------------------------------------
    async getSeedPhraseInfo(seed, seedPassword) {
        const params = {
            seed_phrase: seed,
            seed_password: seedPassword
        };
        const seedInfo = await this._asyncCallWithRetry('get_seed_phrase_info', 0, JSON.stringify(params));
        return seedInfo;
    }
    async generateSeedPhrase(rpcAddress, storagePath, seedPassword, logLevel = -1) {
        await this.init(rpcAddress, logLevel);
        // Native `generate` auto-starts the wallet's refresh worker unless
        // postponed-run is configured first, and the worker holds the per-wallet
        // mutex for the whole of each refresh. The `closeWallet` below takes that
        // same mutex on React Native's shared native-module queue, so without
        // this the create-wallet path stalls every native call in the app for as
        // long as the refresh runs. The flag is process-wide, so this matters
        // whenever `generateSeedPhrase` is the first call to configure it.
        await this.configurePostponedRun();
        const response = await this.generate(storagePath, seedPassword);
        const result = this.expectWallet(this.handleRpcResponse(response));
        const { response: closeResponse } = await this.closeWallet(result.wallet_id);
        if (closeResponse !== 'OK') {
            // The file is still open in this process, so deleting it would leave a
            // dangling handle. Leaving it is safe: `startWallet` re-keys or
            // rebuilds whatever it finds.
            throw new Error(`closeWallet returned ${closeResponse}`);
        }
        // `generate` writes a wallet file as a side effect, encrypted with
        // `seedPassword` -- typically the empty string. The caller only wants
        // the seed, so remove the file; the first `startWallet` recreates it
        // via `restore`, encrypted with the derived password. If this delete
        // silently fails (the native layer reports OK regardless), the leftover
        // file is re-keyed by `startWallet`'s migration instead.
        await this.deleteWallet(storagePath);
        return result;
    }
    /**
     * Opens the wallet file at `storagePath`, creating it from the mnemonic if
     * it does not exist.
     *
     * The file on disk is encrypted with a password derived from the mnemonic,
     * never with `seedPassword`. Versions 0.3.0 and earlier used `seedPassword`
     * for both roles, so files written by them were keyed with the seed
     * passphrase -- the empty string for most wallets. A file still encrypted
     * that way is re-keyed in place the first time it opens. A file that no
     * known password opens is deleted and rebuilt from the mnemonic, costing
     * one re-scan -- but only for a wallet with no seed passphrase. With one
     * set, the passphrase is far and away the likeliest thing to be wrong, and
     * rebuilding would restore a different wallet over a file that was intact,
     * so that case throws instead.
     *
     * The migration is decided entirely by what the file does, so it is
     * idempotent and self-healing: an interrupted re-key leaves the file on
     * its old password for the next attempt.
     */
    async startWallet(mnemonicSeed, seedPassword, storagePath, opts = {}) {
        const log = opts.log ?? (() => { });
        const filePassword = (0, walletFilePassword_1.deriveWalletFilePassword)(mnemonicSeed);
        // An auto-run open starts the refresh worker, which takes the per-wallet
        // lock for the entire first catch-up scan -- minutes for a wallet that is
        // weeks behind. The migration's `resetWalletPassword` then blocks on that
        // lock, and since it runs on React Native's shared native-module queue,
        // every native call in the app queues behind it for the whole scan.
        // Open without running instead, and start the worker explicitly once the
        // wallet this method returns is the one that should sync.
        await this.configurePostponedRun();
        const started = async (wallet) => {
            await this.runWallet(wallet.wallet_id);
            return wallet;
        };
        const openWith = async (password) => {
            const wallet = this.expectWallet(this.handleRpcResponse(await this.open(storagePath, password)));
            if (wallet.recovered) {
                // The keys decrypted but the body did not, so the native layer wiped
                // the history and will re-scan. It is also the signature of a file
                // left half-encrypted by a botched re-key.
                log('Zano wallet file was recovered; its history will re-sync');
            }
            return wallet;
        };
        const restoreFresh = async () => this.expectWallet(this.handleRpcResponse(await this.restore(mnemonicSeed, storagePath, filePassword, seedPassword)));
        const rebuild = async () => {
            await this.deleteWallet(storagePath);
            // The native delete reports OK whether or not it removed anything, so
            // confirm before restoring. `restore` onto a file that survived answers
            // ALREADY_EXISTS, which callers recover from by adopting the open
            // wallet -- and nothing is open here, so they would find none and
            // rebuild again on every start. Failing here says what went wrong once.
            // Ask the filesystem rather than the listing: `getWalletFiles` can
            // answer without an `items` field, and treating that as proof the file
            // is gone would restore onto a survivor anyway.
            if (await this.isWalletExist(storagePath)) {
                throw new Error('Could not delete the Zano wallet file');
            }
            return await restoreFresh();
        };
        const files = await this.getWalletFiles();
        const exists = 'items' in files && files.items.includes(storagePath);
        if (!exists) {
            return await started(await restoreFresh());
        }
        try {
            return await started(await openWith(filePassword));
        }
        catch (error) {
            // Anything other than a bad password -- including ALREADY_EXISTS,
            // which callers recover from by adopting the open wallet -- is not
            // ours to handle.
            if (!isWrongPassword(error))
                throw error;
        }
        // Files written by 0.3.0 and earlier are keyed with the seed passphrase,
        // which was '' unless the user set one:
        const legacyPasswords = seedPassword === '' ? [''] : [seedPassword, ''];
        for (const legacy of legacyPasswords) {
            if (legacy === filePassword)
                continue;
            let wallet;
            try {
                wallet = await openWith(legacy);
            }
            catch (error) {
                if (!isWrongPassword(error))
                    throw error;
                continue;
            }
            // Whether we still hold this wallet open. Rebuilding deletes the file,
            // so it is only safe once nothing has it open.
            let held = true;
            try {
                // `reset_wallet_password` only assigns the in-memory password. The
                // file is re-encrypted when the wallet next stores, which closing it
                // does.
                //
                // Do not replace this with a `store(path, password)` call: the SDK
                // encrypts the keys blob with the argument but the body with the
                // in-memory password, producing a file that opens, fails to
                // deserialize its body, wipes the history and silently re-scans.
                const resetCode = await this.resetWalletPassword(wallet.wallet_id, filePassword);
                if (resetCode !== 'OK') {
                    throw new Error(`resetWalletPassword returned ${resetCode}`);
                }
                // `closeWallet`, not `stopWallet`: the async 'close' path discards
                // the native return code and always reports OK, so it cannot tell
                // us whether the file was actually written.
                const { response } = await this.closeWallet(wallet.wallet_id);
                if (response !== 'OK') {
                    throw new Error(`closeWallet returned ${response}`);
                }
                held = false;
                // Only believe the migration once the file really opens with the
                // new password:
                const migrated = await started(await openWith(filePassword));
                log('Zano wallet file re-keyed with a derived password');
                return migrated;
            }
            catch (error) {
                // Someone else has this wallet open, and callers recover from that by
                // adopting it, exactly as the first probe allows. Deleting the file
                // would pull it out from under that handle.
                if (isAlreadyExists(error))
                    throw error;
                // Past the close, the file on disk really is re-keyed -- both
                // `resetWalletPassword` and `closeWallet` reported OK. Only a wrong
                // password on the confirming open says otherwise. Anything else is a
                // failure to confirm a file that is almost certainly correct, and
                // rebuilding would spend a full rescan replacing it with its twin.
                if (!held && !isWrongPassword(error))
                    throw error;
                log(`Zano wallet file re-key failed: ${String(error)}`);
                if (held) {
                    try {
                        const { response } = await this.closeWallet(wallet.wallet_id);
                        if (response !== 'OK') {
                            throw new Error(`closeWallet returned ${response}`);
                        }
                    }
                    catch (closeError) {
                        // We cannot delete a file this process still has open. Leaving it
                        // alone is safe: it is still keyed with the legacy password, so
                        // the next start simply tries the migration again.
                        log(`Zano wallet file re-key could not release the wallet, leaving the file alone: ${String(closeError)}`);
                        throw error;
                    }
                }
                // Rebuilding restores from the mnemonic with `seedPassword`, which
                // reproduces this wallet only if that is the passphrase the file was
                // written with. Opening it with `seedPassword` proves exactly that;
                // opening it with '' does not, and 0.3.0 wrote '' for wallets it
                // believed had no passphrase. When the two disagree, the file we just
                // opened is the user's wallet and the rebuild would not be, so leave
                // it alone -- the same rule the post-loop path applies.
                if (legacy !== seedPassword) {
                    throw new Error('The Zano wallet file was written without this seed passphrase, so it cannot be rebuilt with one');
                }
                log('Rebuilding the Zano wallet file');
                return await started(await rebuild());
            }
        }
        // Every password this package has ever written has now been tried: the
        // derived one, the seed passphrase, and the empty string 0.3.0 used for
        // wallets without one. Reaching here with a passphrase set means it does
        // not belong to this file, and rebuilding would restore from the mnemonic
        // with that same passphrase -- a different wallet, written over a file
        // that was fine. Zano's checksum rejects most wrong passphrases outright,
        // so the usual outcome would be a deleted file and a failed restore; the
        // rest of the time it is a wallet whose keys are not the user's, opening
        // cleanly ever after because the file password comes from the mnemonic
        // alone and so cannot tell the two apart.
        if (seedPassword !== '') {
            throw new Error('The Zano wallet file does not open with this seed passphrase');
        }
        log('Zano wallet file opens with no known password, rebuilding it');
        return await started(await rebuild());
    }
    async stopWallet(walletId) {
        const closeResponse = await this._asyncCallWithRetry('close', walletId, '');
        if (closeResponse.return_code !== 'OK') {
            throw new Error(`${closeResponse.return_code}`);
        }
        return closeResponse.return_code;
    }
    async removeWallet(walletId) {
        const response = await this.getOpenedWallets();
        const result = this.handleRpcResponse(response);
        const wallet = result.find(w => w.wallet_id === walletId);
        if (wallet == null)
            return;
        await this.stopWallet(walletId);
        await this.deleteWallet(wallet.wi.path);
    }
    async walletStatus(walletId) {
        const walletStatus = await this._asyncCallWithRetry('get_wallet_status', walletId, '');
        return walletStatus;
    }
    async getBalances(walletId) {
        const params = {
            method: 'getbalance'
        };
        const response = await this._asyncCallWithRetry('invoke', walletId, JSON.stringify(params));
        const result = this.handleRpcResponse(response);
        return result;
    }
    async getTransactions(walletId, offset = 0) {
        const params = {
            method: 'get_recent_txs_and_info2',
            params: {
                count: 100,
                exclude_mining_txs: true,
                exclude_unconfirmed: false,
                offset,
                order: 'FROM_BEGIN_TO_END',
                update_provision_info: true
            }
        };
        const response = await this._asyncCallWithRetry('invoke', walletId, JSON.stringify(params));
        const result = this.handleRpcResponse(response);
        return result;
    }
    async whitelistAssets(walletId, assetIds) {
        const currentWhitelistParams = {
            method: 'assets_whitelist_get',
            params: {}
        };
        const whitelistAssetsResponse = await this._asyncCallWithRetry('invoke', walletId, JSON.stringify(currentWhitelistParams));
        let whitelistSet = new Set();
        if ('local_whitelist' in whitelistAssetsResponse) {
            whitelistSet = new Set(whitelistAssetsResponse.local_whitelist.map(asset => asset.asset_id));
        }
        for (const assetId of assetIds) {
            if (!whitelistSet.has(assetId)) {
                const addAssetParams = {
                    method: 'assets_whitelist_add',
                    params: {
                        asset_id: assetId
                    }
                };
                await this._asyncCallWithRetry('invoke', walletId, JSON.stringify(addAssetParams));
            }
        }
    }
    async transfer(walletId, opts) {
        const params = {
            method: 'transfer',
            params: {
                destinations: opts.transfers.map(t => ({
                    address: t.recipient,
                    amount: t.nativeAmount,
                    asset_id: t.assetId
                })),
                comment: opts.comment,
                fee: opts.fee,
                // Since HF6, payment ids travel inside integrated addresses, one
                // per destination, and the wallet attaches each embedded id
                // natively -- a single transaction may pay several integrated
                // addresses carrying different ids. This request-level field is the
                // old transaction-wide mechanism, and the node rejects any
                // non-empty value outright. A caller with a separate payment id
                // must fold it into an integrated destination address first.
                payment_id: '',
                hide_receiver: true,
                mixin: 15,
                push_payer: false,
                service_entries_permanent: true
            }
        };
        const response = await this._asyncCallWithRetry('invoke', walletId, JSON.stringify(params));
        const result = this.handleRpcResponse(response);
        return result.tx_hash;
    }
    async burnAsset(walletId, opts) {
        const params = {
            method: 'burn_asset',
            params: {
                asset_id: opts.assetId,
                burn_amount: opts.burnAmount,
                native_amount: opts.nativeAmount ?? 0,
                point_tx_to_address: opts.pointTxToAddress ?? '',
                service_entries: opts.serviceEntries ?? []
            }
        };
        const response = await this._asyncCallWithRetry('invoke', walletId, JSON.stringify(params));
        const result = this.handleRpcResponse(response);
        return result.tx_id;
    }
    // -----------------------------------------------------------------------------
    // Utils
    // -----------------------------------------------------------------------------
    /**
     * Validates that a wallet payload really carries a wallet handle.
     * Guards the paths that must not mistake a degenerate payload for an
     * open wallet.
     */
    expectWallet(wallet) {
        if (typeof wallet.wallet_id !== 'number') {
            throw new types_1.ZanoError('INTERNAL_ERROR', 'Response carried no wallet_id');
        }
        return wallet;
    }
    handleRpcResponse(json) {
        if ('error' in json) {
            throw new types_1.ZanoError(String(json.error.code), json.error.message);
        }
        if (!('result' in json) || json.result == null) {
            throw new types_1.ZanoError('INTERNAL_ERROR', 'Unknown error');
        }
        // The native layer's catch-all macros report failure as a
        // success-shaped payload: `{result: {return_code: "INTERNAL_ERROR ..."}}`
        // from PLAIN_WALLET_CATCH, or `"UNINITIALIZED"` when `init` has not run.
        // Passing those through would hand callers a result whose real fields
        // are all undefined.
        const returnCode = json.result.return_code;
        if (typeof returnCode === 'string' && returnCode !== 'OK') {
            throw new types_1.ZanoError(returnCode);
        }
        return json.result;
    }
    async _asyncCallWithRetry(methodName, instanceId, params) {
        while (true) {
            const jobIdResponse = await this.asyncCall(methodName, instanceId, params);
            while (true) {
                const tryPullResponse = await this.tryPullResult(jobIdResponse.job_id);
                await new Promise(resolve => setTimeout(resolve, 100)); // 100 ms recommended by documentation
                if (tryPullResponse.status === 'idle') {
                    // try this again. job ID is still valid
                    continue;
                }
                else if (tryPullResponse.status === 'delivered') {
                    const error = (0, types_1.asMaybeBusy)(tryPullResponse.result);
                    if (error != null) {
                        // try this again. job ID is no longer valid
                        break;
                    }
                    return tryPullResponse.result;
                }
                else if (tryPullResponse.status === 'canceled') {
                    throw new Error(`${methodName} job canceled`);
                }
            }
        }
    }
}
exports.CppBridge = CppBridge;
