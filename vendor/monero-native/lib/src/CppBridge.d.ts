import type { BroadcastResult, DerivedKeys, EncodeUriParams, GeneratedWallet, NetworkType, ParsedUri, Recipient, SignedTransaction, TransactionPriority, TransactionsPage, WalletBackend, WalletStatus } from './types';
/**
 * The shape of the native C++ module exposed to React Native.
 *
 * You do not normally need this, but it is accessible as
 * `require('react-native').NativeModules.MoneroLwsfModule`.
 *
 * Pass this object to the `CppBridge` constructor to re-assemble the API.
 */
export interface NativeMoneroLwsfModule {
    readonly callMonero: (name: string, jsonArguments: string[]) => Promise<string>;
    readonly methodNames: string[];
    readonly documentDirectory: string;
}
export declare class CppBridge {
    private readonly module;
    constructor(moneroLwsfModule: NativeMoneroLwsfModule);
    /**
     * Generate a new wallet's keys in memory (no disk I/O).
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @param language - Mnemonic language (e.g., "English")
     * @returns Generated wallet with mnemonic and spend keys
     */
    generateWallet(nettype: NetworkType, language?: string): Promise<GeneratedWallet>;
    /**
     * Derive all keys from a mnemonic (no disk I/O).
     * @param mnemonic - The 25-word mnemonic seed
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @returns All four keys (view and spend, public and secret)
     */
    seedAndKeysFromMnemonic(mnemonic: string, nettype: NetworkType): Promise<DerivedKeys>;
    /**
     * Get the current network blockchain height from a daemon.
     * @param backend - Backend type ('lws' or 'monerod')
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @param daemonAddress - Daemon address to query
     * @returns Current blockchain height
     */
    getNetworkBlockHeight(backend: WalletBackend, nettype: NetworkType, daemonAddress: string): Promise<number>;
    /**
     * Validate a Monero address.
     * @param address - The address to validate
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @returns true if valid, false otherwise
     */
    isValidAddress(address: string, nettype: NetworkType): Promise<boolean>;
    /**
     * Open or create a wallet. If already open, returns current status.
     * If wallet exists on disk, opens it. Otherwise creates from mnemonic.
     * @param walletId - Unique identifier for the wallet
     * @param backend - Backend type ("lws" or "monerod")
     * @param mnemonic - The 25-word mnemonic seed
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @param restoreHeight - Block height to restore from
     * @param daemonAddress - Daemon address to connect to
     * @returns Current wallet status (heights and balances)
     */
    openWallet(walletId: string, backend: WalletBackend, mnemonic: string, password: string, nettype: NetworkType, restoreHeight: number, daemonAddress: string): Promise<WalletStatus>;
    /**
     * Get the current status of an open wallet.
     * @param walletId - Unique identifier for the wallet
     * @returns Current wallet status (heights and balances)
     */
    getWalletStatus(walletId: string): Promise<WalletStatus>;
    /**
     * Close an open wallet.
     * @param walletId - Unique identifier for the wallet to close
     */
    closeWallet(walletId: string): Promise<void>;
    /**
     * Delete a wallet's files from disk. Closes the wallet first if it's open.
     * @param walletId - Unique identifier for the wallet
     * @param backend - Backend type ('lws' or 'monerod')
     */
    deleteWallet(walletId: string, backend: WalletBackend): Promise<void>;
    /**
     * Get all transactions with pagination.
     * @param walletId - Unique identifier for the wallet
     * @param page - Page number (0-indexed)
     * @param pageSize - Number of transactions per page
     * @param sort - Sort order: 'asc' (oldest first) or 'desc' (newest first), pending always at end
     * @returns Paginated transactions with metadata
     */
    getAllTransactions(walletId: string, page: number, pageSize: number, sort?: 'asc' | 'desc'): Promise<TransactionsPage>;
    /**
     * Get not-yet-mined transactions with pagination. Same shape as
     * getAllTransactions, filtered to pending entries. Pending transactions sort
     * behind all confirmed ones in getAllTransactions, so a cursor-based scan of
     * confirmed history never reaches them; use this to read the pending set
     * directly. The set can include entries the backend reports as permanently
     * failed (isFailed: true); callers decide how to label those.
     * @param walletId - Unique identifier for the wallet
     * @param page - Page number (0-indexed)
     * @param pageSize - Number of transactions per page
     * @returns Paginated pending transactions with metadata
     */
    getPendingTransactions(walletId: string, page: number, pageSize: number): Promise<TransactionsPage>;
    /**
     * Create a transaction (supports multiple recipients).
     * The transaction is created and signed but not broadcast yet: it is retained
     * natively for a later broadcastTransaction call. At most 50 transactions are
     * retained per wallet (oldest disposed first; broadcasting an evicted one
     * reports that it must be recreated), and all are released when the wallet
     * closes. Payments the wallet would split into multiple on-chain
     * transactions are rejected, so a later broadcast is atomic.
     * @param walletId - Unique identifier for the wallet
     * @param recipients - Array of recipients with addresses and amounts (atomic units)
     * @param priority - Transaction priority (0=Default, 1=Low, 2=Medium, 3=High)
     * @returns SignedTransaction with txid, signedTxHex, and fee (atomic units)
     */
    createTransaction(walletId: string, recipients: Recipient[], priority: TransactionPriority): Promise<SignedTransaction>;
    /**
     * Broadcast a previously created transaction. `signedTx` identifies the
     * natively retained transaction to broadcast.
     * @param walletId - Unique identifier for the wallet
     * @param signedTx - The signedTxHex returned by createTransaction
     * @returns BroadcastResult with the transaction secret key, when the wallet
     *   can report it. This is the only chance to read the key on the send path:
     *   it is not derivable from the seed, so a caller that drops it here can
     *   only recover it from this wallet's local cache later.
     * @throws Error if the transaction is no longer retained (evicted, or the
     *   wallet was closed since creation) or the broadcast fails
     */
    broadcastTransaction(walletId: string, signedTx: string): Promise<BroadcastResult>;
    /**
     * Parse a monero: URI into its components.
     * @param uri - The monero: URI to parse
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @returns Parsed URI components
     * @throws Error if URI is invalid
     */
    parseUri(uri: string, nettype: NetworkType): Promise<ParsedUri>;
    /**
     * Encode a monero: URI from components.
     * @param params - URI components (address, amount, etc.)
     * @param nettype - Network type (0=mainnet, 1=testnet, 2=stagenet)
     * @returns The encoded monero: URI
     * @throws Error if parameters are invalid
     */
    encodeUri(params: EncodeUriParams, nettype: NetworkType): Promise<string>;
    /**
     * Set the API key for LWS (Light Wallet Server) requests.
     * Once set, the key will be included in all subsequent LWS HTTP POST requests
     * as an "api_key" field in the JSON body.
     * @param apiKey - The API key to include in LWS requests
     */
    setLwsApiKey(apiKey: string): Promise<void>;
    /**
     * Enable or disable the Nym fetch interceptor.
     *
     * When enabled, all LWSF HTTP POST requests that the C++ wallet code
     * would have issued are redirected through the native event bridge. The
     * consumer must register a handler via `NativeEventEmitter` on the
     * "MoneroWalletEvent" event with `eventName === 'nymFetchRequest'` and
     * call `resolveFetch` / `rejectFetch` to complete the request.
     *
     * @param enabled - Whether to route HTTP through the JS fetch bridge
     * @param baseUrl - scheme://host[:port] of the LWSF server (must match
     *                  the daemon address used at openWallet time). Empty
     *                  when disabling.
     */
    setNymEnabled(enabled: boolean, baseUrl: string): Promise<void>;
    /**
     * Resolve a pending nym fetch request that was emitted as a
     * `nymFetchRequest` wallet event. Must be called with the same
     * `requestId` carried on the incoming event.
     *
     * @param requestId  - id forwarded via the native event
     * @param status     - HTTP status code returned from fetch
     * @param bodyBase64 - response body encoded as base64
     */
    resolveFetch(requestId: string, status: number, bodyBase64: string): Promise<void>;
    /**
     * Reject a pending nym fetch request. The blocked C++ caller will
     * receive a runtime_error bubbled as an RPC failure.
     *
     * @param requestId    - id forwarded via the native event
     * @param errorMessage - human-readable error description
     */
    rejectFetch(requestId: string, errorMessage: string): Promise<void>;
}
