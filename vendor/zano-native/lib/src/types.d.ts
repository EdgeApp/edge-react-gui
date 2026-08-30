interface JsonRpcResponseBase {
    id: number;
    jsonrpc: string;
}
interface JsonRpcResponseSuccess<T> extends JsonRpcResponseBase {
    result: T;
}
interface JsonRpcResponseError extends JsonRpcResponseBase {
    error: {
        code: string | number;
        message: string;
    };
}
export type JsonRpc<T> = JsonRpcResponseSuccess<T> | JsonRpcResponseError;
/**
 * An error from the native Zano library, carrying its API return code.
 *
 * The message keeps the exact `<code> <detail>` shape this library has
 * always thrown, so callers matching on `error.message` substrings keep
 * working.
 */
export declare class ZanoError extends Error {
    /** The bare return code, with any packed detail stripped. */
    readonly code: string;
    constructor(rawCode: string, detail?: string);
}
export interface ReturnCode {
    return_code: string;
}
export interface WalletFiles {
    items: string[];
}
/**
 * The shape `plain_wallet::get_address_info` actually returns. Note that
 * `payment_id` is a boolean presence flag, not the id itself, and there is
 * no `is_integrated` field -- the earlier declaration of both was fiction
 * that no native version ever produced.
 */
export interface AddressInfo {
    valid: boolean;
    auditable: boolean;
    payment_id: boolean;
    wrap: boolean;
}
export interface ConnectivityStatus {
    is_online: boolean;
    is_remote_node_mode: boolean;
    is_server_busy: boolean;
    last_daemon_is_disconnected: boolean;
    last_proxy_communicate_timestamp: number;
}
interface AssetInfo {
    asset_id: string;
    current_supply: number;
    decimal_point: number;
    full_name: string;
    hidden_supply: boolean;
    meta_info: string;
    owner: string;
    owner_eth_pub_key: string;
    ticker: string;
    total_max_supply: number;
}
interface AssetBalance {
    asset_info: AssetInfo;
    awaiting_in: number;
    awaiting_out: number;
    outs_amount_max: number;
    outs_amount_min: number;
    outs_count: number;
    total: number;
    unlocked: number;
}
export interface WalletDetails {
    name: string;
    pass: string;
    private_spend_key: string;
    private_view_key: string;
    public_spend_key: string;
    public_view_key: string;
    recent_history: {
        last_item_index: number;
        total_history_items: number;
    };
    recovered: boolean;
    seed: string;
    wallet_file_size: number;
    wallet_id: number;
    wallet_local_bc_size: number;
    wi: {
        address: string;
        balances: AssetBalance[];
        has_bare_unspent_outputs: boolean;
        is_auditable: boolean;
        is_watch_only: boolean;
        mined_total: number;
        path: string;
        view_sec_key: string;
    };
}
declare enum WalletState {
    SYNCING = 1,
    SYNCED = 2,
    ERROR = 3
}
export interface WalletStatus {
    current_daemon_height: number;
    current_wallet_height: number;
    is_daemon_connected: boolean;
    is_in_long_refresh: boolean;
    progress: number;
    wallet_state: WalletState;
}
export interface CloseResponse {
    response: string;
}
export interface AsyncCallResponse {
    job_id: number;
}
export type TryPullResultResponse<T> = {
    status: 'canceled';
} | {
    status: 'idle';
} | {
    status: 'delivered';
    result: T | {
        error: {
            code: number;
            message: string;
        };
    };
};
export declare const asMaybeBusy: import("cleaners").Cleaner<{
    error: {
        message: any;
    };
} | undefined>;
export interface WalletInfoExtended {
    seed: string;
    spend_private_key: string;
    spend_public_key: string;
    view_private_key: string;
    view_public_key: string;
}
export declare enum FeePriority {
    DEFAULT = 0,
    UNIMPORTANT = 1,
    NORMAL = 2,
    ELEVATED = 3,
    PRIORITY = 4
}
export interface GetSeedPhraseInfo {
    error_code: string;
    response_data: {
        address: string;
        hash_sum_matched: boolean;
        require_password: boolean;
        syntax_correct: boolean;
        tracking: boolean;
    };
}
interface AssetInfo {
    asset_id: string;
    current_supply: number;
    decimal_point: number;
    full_name: string;
    hidden_supply: boolean;
    meta_info: string;
    owner: string;
    owner_eth_pub_key: string;
    ticker: string;
    total_max_supply: number;
}
interface AssetBalance {
    asset_info: AssetInfo;
    awaiting_in: number;
    awaiting_out: number;
    outs_amount_max: number;
    outs_amount_min: number;
    outs_count: number;
    total: number;
    unlocked: number;
}
export interface GetBalancesResponse {
    balance: number;
    balances: AssetBalance[];
    unlocked_balance: number;
}
export interface RecentTransaction {
    comment?: string;
    employed_entries: {
        receive?: Array<{
            amount: number;
            asset_id: string;
            index: number;
        }>;
        spent?: Array<{
            amount: number;
            asset_id: string;
            index: number;
        }>;
    };
    fee: number;
    height: number;
    is_mining: boolean;
    is_mixing: boolean;
    is_service: boolean;
    payment_id: string;
    show_sender: boolean;
    subtransfers: Array<{
        amount: number;
        asset_id: string;
        is_income: boolean;
    }>;
    timestamp: number;
    transfer_internal_index: number;
    tx_blob_size: number;
    tx_hash: string;
    tx_type: number;
    unlock_time: number;
}
export interface GetRecentTransactionsResponse {
    last_item_index: number;
    pi: {
        balance: number;
        curent_height: number;
        transfer_entries_count: number;
        transfers_count: number;
        unlocked_balance: number;
    };
    total_transfers: number;
    transfers?: RecentTransaction[];
}
export interface WhitelistAssetsResponse {
    global_whitelist: AssetInfo[];
    local_whitelist: AssetInfo[];
    own_assets: AssetInfo[];
}
export interface TransferParams {
    transfers: Array<{
        assetId: string;
        nativeAmount: number;
        recipient: string;
    }>;
    comment?: string;
    fee: number;
}
export interface TransferResponse {
    tx_hash: string;
    tx_size: number;
    tx_unsigned_hex: '';
}
export interface BurnAssetParams {
    assetId: string;
    burnAmount: number;
    nativeAmount?: number;
    pointTxToAddress?: string;
    serviceEntries?: Array<{
        body: string;
        flags?: number;
        instruction: string;
        security?: string;
        service_id: string;
    }>;
}
export interface BurnAssetResponse {
    tx_id: string;
}
export {};
