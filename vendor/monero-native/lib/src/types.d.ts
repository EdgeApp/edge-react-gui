export type NetworkType = 'MAINNET' | 'TESTNET' | 'STAGENET';
export declare function networkTypeToIntString(type: NetworkType): string;
export type WalletBackend = 'lws' | 'monerod';
export interface GeneratedWallet {
    mnemonic: string;
    secretSpendKey: string;
    publicSpendKey: string;
}
/** Return type for seedAndKeysFromMnemonic. */
export interface DerivedKeys {
    address: string;
    secretViewKey: string;
    publicViewKey: string;
    secretSpendKey: string;
    publicSpendKey: string;
}
/** Return type for openWallet and getWalletStatus. */
export interface WalletStatus {
    syncedHeight: number;
    networkHeight: number;
    balance: string;
    unlockedBalance: string;
    /**
     * True once at least one server refresh has completed for this wallet. LWS
     * wallets seed syncedHeight == networkHeight from the stored scan height
     * until their first refresh, so heights alone cannot tell "caught up" from
     * "has not looked yet"; treat the wallet as synced/spendable only when this
     * is true.
     */
    refreshed: boolean;
}
/** Transaction direction. */
export type TransactionDirection = 0 | 1;
/** Single transaction info. */
export interface TransactionInfo {
    hash: string;
    direction: TransactionDirection;
    isPending: boolean;
    isFailed: boolean;
    isCoinbase: boolean;
    amount: string;
    fee: string;
    blockHeight: number;
    confirmations: number;
    timestamp: number;
    paymentId: string;
    description: string;
    label: string;
    unlockTime: number;
    subaddrAccount: number;
    txKey?: string;
}
/** Return type for getAllTransactions. */
export interface TransactionsPage {
    transactions: TransactionInfo[];
    totalCount: number;
    page: number;
    pageSize: number;
}
/** Transaction priority levels. */
export type TransactionPriority = 0 | 1 | 2 | 3;
/** Recipient for createTransaction. */
export interface Recipient {
    address: string;
    amount: string;
}
/** Return type for createTransaction. */
export interface SignedTransaction {
    txid: string;
    signedTxHex: string;
    fee: string;
}
/** Return type for broadcastTransaction. */
export interface BroadcastResult {
    /**
     * The transaction secret key, when the wallet can report it. The sender's
     * only proof of payment: chosen at random while building the transaction,
     * held only by the wallet that built it, and never recoverable later.
     */
    txKey?: string;
}
/** Parsed Monero URI (parseUri result). */
export interface ParsedUri {
    address: string;
    paymentId: string;
    amount: string;
    txDescription: string;
    recipientName: string;
    unknownParameters: string[];
}
/** Params for encodeUri (make monero: URI). */
export interface EncodeUriParams {
    address: string;
    paymentId?: string;
    amount: string;
    txDescription?: string;
    recipientName?: string;
}
/** Wallet event names emitted by the native WalletListener. */
export type WalletEventName = 'pendingTransactionReceived' | 'nymFetchRequest';
/** Payload delivered by "MoneroWalletEvent" NativeEventEmitter events. */
export interface WalletEventData {
    walletId: string;
    eventName: WalletEventName;
    /**
     * JSON string whose shape depends on `eventName`:
     *   - pendingTransactionReceived: { txId: string, amount: number }
     *   - nymFetchRequest: { url, method, headers, bodyBase64 } — in this
     *     case `walletId` holds the nym requestId that must be passed to
     *     `resolveFetch` / `rejectFetch`.
     */
    data: string;
}
/** Parsed payload for the `nymFetchRequest` wallet event. */
export interface NymFetchRequestPayload {
    url: string;
    method: string;
    headers: Record<string, string>;
    bodyBase64: string;
}
