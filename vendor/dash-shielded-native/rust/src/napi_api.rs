use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::wallet;

fn err(msg: impl ToString) -> Error {
    Error::from_reason(msg.to_string())
}

fn map<T>(value: wallet::WalletResult<T>) -> Result<T> {
    value.map_err(err)
}

#[napi(object)]
pub struct JsAddresses {
    pub shielded_address: String,
}

#[napi(object)]
pub struct JsTransaction {
    pub txid: String,
    pub block_time_in_seconds: i64,
    pub mined_height: i64,
    pub value: String,
    pub fee: Option<String>,
    pub to_address: Option<String>,
    pub memos: Vec<String>,
}

#[napi(object)]
pub struct JsPoll {
    pub alias: String,
    pub status: String,
    pub scan_progress: f64,
    pub network_block_height: u32,
    pub available_credits: String,
    pub total_credits: String,
    pub transactions: Vec<JsTransaction>,
}

impl From<wallet::Addresses> for JsAddresses {
    fn from(value: wallet::Addresses) -> Self {
        Self {
            shielded_address: value.shielded_address,
        }
    }
}

impl From<wallet::Transaction> for JsTransaction {
    fn from(value: wallet::Transaction) -> Self {
        Self {
            txid: value.txid,
            block_time_in_seconds: value.block_time_in_seconds,
            mined_height: value.mined_height,
            value: value.value,
            fee: value.fee,
            to_address: value.to_address,
            memos: value.memos,
        }
    }
}

impl From<wallet::Poll> for JsPoll {
    fn from(value: wallet::Poll) -> Self {
        Self {
            alias: value.alias,
            status: value.status,
            scan_progress: value.scan_progress,
            network_block_height: value.network_block_height,
            available_credits: value.available_credits,
            total_credits: value.total_credits,
            transactions: value.transactions.into_iter().map(Into::into).collect(),
        }
    }
}

#[napi]
pub fn set_document_directory(path: String) -> Result<()> {
    map(wallet::set_document_directory(path))
}

#[napi]
pub async fn initialize(
    mnemonic_seed: String,
    account: u32,
    alias: String,
    network_name: String,
    default_host: String,
    default_port: u32,
) -> Result<()> {
    map(wallet::initialize(
        mnemonic_seed,
        account,
        alias,
        network_name,
        default_host,
        default_port,
    )
    .await)
}

#[napi]
pub async fn stop(alias: String) -> Result<String> {
    map(wallet::stop(alias).await)
}

#[napi]
pub async fn start_sync(alias: String) -> Result<()> {
    map(wallet::start_sync(alias).await)
}

#[napi]
pub async fn stop_sync(alias: String) -> Result<()> {
    map(wallet::stop_sync(alias).await)
}

#[napi]
pub async fn derive_shielded_address(alias: String) -> Result<JsAddresses> {
    map(wallet::derive_shielded_address(alias).await).map(Into::into)
}

#[napi]
pub fn is_valid_address(address: String, network: String) -> bool {
    wallet::is_valid_address(address, network)
}

#[napi]
pub fn derive_viewing_key(mnemonic_seed: String, network: String) -> Result<String> {
    map(wallet::derive_viewing_key(mnemonic_seed, network))
}

#[napi]
pub async fn warm_up_prover() -> Result<()> {
    map(wallet::warm_up_prover().await)
}

#[napi]
pub fn is_prover_ready() -> bool {
    wallet::is_prover_ready()
}

#[napi]
pub async fn poll(alias: String) -> Result<JsPoll> {
    map(wallet::poll(alias).await).map(Into::into)
}

#[napi]
pub async fn propose_transfer(
    alias: String,
    amount_credits: String,
    to_address: String,
    memo: Option<String>,
) -> Result<String> {
    map(wallet::propose_transfer(alias, amount_credits, to_address, memo).await)
}

#[napi]
pub async fn create_transfer(
    alias: String,
    proposal_id: String,
    mnemonic_seed: String,
) -> Result<String> {
    map(wallet::create_transfer(alias, proposal_id, mnemonic_seed).await)
}
