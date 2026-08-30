import { AddressInfo, AsyncCallResponse, BurnAssetParams, CloseResponse, ConnectivityStatus, FeePriority, GetBalancesResponse, GetRecentTransactionsResponse, GetSeedPhraseInfo, JsonRpc, ReturnCode, TransferParams, TryPullResultResponse, WalletDetails, WalletFiles, WalletInfoExtended, WalletStatus } from './types';
/**
 * The shape of the native C++ module exposed to React Native.
 *
 * You do not normally need this, but it is accessible as
 * `require('react-native').NativeModules.ZanoModule`.
 *
 * Pass this object to the `CppBridge` constructor to re-assemble the API.
 */
export interface NativeZanoModule {
    readonly callZano: (name: string, jsonArguments: string[]) => Promise<string>;
    readonly methodNames: string[];
    /**
     * Absent when the iOS module could not create the wallet directory or
     * exclude it from device backups; the `CppBridge` constructor refuses to
     * run without it.
     */
    readonly documentDirectory?: string;
}
export declare class CppBridge {
    private readonly module;
    private readonly documentDirectory;
    private postponedRunConfigured;
    constructor(zanoModule: NativeZanoModule);
    init(rpcAddress: string, logLevel: number): Promise<JsonRpc<ReturnCode>>;
    initWithIpPort(ip: string, port: string, logLevel: number): Promise<JsonRpc<ReturnCode>>;
    reset(): Promise<JsonRpc<ReturnCode>>;
    setLogLevel(logLevel: number): Promise<string>;
    getVersion(): Promise<string>;
    getWalletFiles(): Promise<WalletFiles | {}>;
    getExportPrivateInfo(targetDir: string): Promise<JsonRpc<ReturnCode>>;
    deleteWallet(fileName: string): Promise<JsonRpc<ReturnCode>>;
    getAddressInfo(addr: string): Promise<AddressInfo>;
    getAppconfig(encryptionKey: string): Promise<object>;
    setAppconfig(confStr: string, encryptionKey: string): Promise<JsonRpc<ReturnCode>>;
    generateRandomKey(length: number): Promise<string>;
    getLogsBuffer(): Promise<string>;
    truncateLog(): Promise<JsonRpc<ReturnCode>>;
    getConnectivityStatus(): Promise<ConnectivityStatus>;
    /**
     * Raw native open. Note that once `startWallet` or `generateSeedPhrase`
     * has run, the process-wide postponed-run mode is configured and stays on:
     * a wallet opened here will not sync until `run_wallet` is issued for it
     * (via `syncCall`). Prefer `startWallet`.
     */
    open(path: string, password: string): Promise<JsonRpc<WalletDetails>>;
    /**
     * Raw native restore. Subject to the same postponed-run caveat as `open`:
     * under postponed mode the restored wallet will not sync until
     * `run_wallet` is issued for it.
     */
    restore(seed: string, path: string, password: string, seedPassword: string): Promise<JsonRpc<WalletDetails>>;
    /**
     * Raw native generate. Subject to the same postponed-run caveat as `open`:
     * under postponed mode the generated wallet will not sync until
     * `run_wallet` is issued for it.
     */
    generate(path: string, password: string): Promise<JsonRpc<WalletDetails>>;
    getOpenedWallets(): Promise<JsonRpc<WalletDetails[]>>;
    getWalletStatus(walletId: number): Promise<WalletStatus>;
    closeWallet(walletId: number): Promise<CloseResponse>;
    invoke(walletId: number, params: string): Promise<string>;
    asyncCall(methodName: string, instanceId: number, params: string): Promise<AsyncCallResponse>;
    tryPullResult<T>(arg: number): Promise<TryPullResultResponse<T>>;
    syncCall(methodName: string, instanceId: number, params: string): Promise<string>;
    /**
     * Tells the native library not to start a wallet's refresh worker as part
     * of `open`/`restore`/`generate`; `runWallet` starts it explicitly. The
     * flag is process-wide and sticky, so every open made after this call must
     * be followed by `runWallet` once the wallet should sync -- and one
     * success is enough, so this short-circuits instead of paying a native
     * round trip per wallet start. Requires `init` to have run.
     */
    private configurePostponedRun;
    /**
     * Starts the refresh worker for an open wallet. Idempotent: the native
     * side skips the spawn when the worker is already running.
     *
     * Public because adopting a wallet is public behavior: `startWallet`
     * rethrows ALREADY_EXISTS for its caller to recover from, and the wallet
     * the caller then adopts was opened with the refresh worker postponed, so
     * it does not sync until this runs.
     */
    runWallet(walletId: number): Promise<void>;
    isWalletExist(path: string): Promise<boolean>;
    getWalletInfo(walletId: number): Promise<{
        wi: WalletDetails['wi'];
        wi_extended: WalletInfoExtended;
    }>;
    resetWalletPassword(walletId: number, password: string): Promise<string>;
    getCurrentTxFee(priority: FeePriority): Promise<number>;
    getSeedPhraseInfo(seed: string, seedPassword: string): Promise<GetSeedPhraseInfo>;
    generateSeedPhrase(rpcAddress: string, storagePath: string, seedPassword: string, logLevel?: number): Promise<WalletDetails>;
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
    startWallet(mnemonicSeed: string, seedPassword: string, storagePath: string, opts?: {
        log?: (message: string) => void;
    }): Promise<WalletDetails>;
    stopWallet(walletId: number): Promise<string>;
    removeWallet(walletId: number): Promise<void>;
    walletStatus(walletId: number): Promise<WalletStatus>;
    getBalances(walletId: number): Promise<GetBalancesResponse>;
    getTransactions(walletId: number, offset?: number): Promise<GetRecentTransactionsResponse>;
    whitelistAssets(walletId: number, assetIds: string[]): Promise<void>;
    transfer(walletId: number, opts: TransferParams): Promise<string>;
    burnAsset(walletId: number, opts: BurnAssetParams): Promise<string>;
    /**
     * Validates that a wallet payload really carries a wallet handle.
     * Guards the paths that must not mistake a degenerate payload for an
     * open wallet.
     */
    private expectWallet;
    private handleRpcResponse;
    private _asyncCallWithRetry;
}
