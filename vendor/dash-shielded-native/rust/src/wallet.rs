use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use bech32::{Bech32m, Hrp};
use bip0039::{Count, English, Mnemonic};
use once_cell::sync::Lazy;
use orchard::keys::{FullViewingKey, Scope, SpendingKey};
use orchard::Address;
use zip32::AccountId;

pub type WalletResult<T> = Result<T, String>;

const ORCHARD_TYPE: u8 = 0x10;
const MAINNET_HRP: &str = "dash";
const TESTNET_HRP: &str = "tdash";

pub struct ClientSlot {
    pub mnemonic: String,
    pub network: String,
    pub account: u32,
    pub address: String,
    pub viewing_key: String,
    pub status: String,
    pub available_credits: String,
    pub total_credits: String,
    pub proposals: HashMap<String, PendingProposal>,
}

pub struct PendingProposal {
    pub to_address: String,
    pub amount_credits: String,
    pub memo: String,
}

static DOCUMENT_DIR: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));
static CLIENTS: Lazy<tokio::sync::Mutex<HashMap<String, ClientSlot>>> =
    Lazy::new(|| tokio::sync::Mutex::new(HashMap::new()));
static PROVER_READY: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));

pub struct Addresses {
    pub shielded_address: String,
}

pub struct Transaction {
    pub txid: String,
    pub block_time_in_seconds: i64,
    pub mined_height: i64,
    pub value: String,
    pub fee: Option<String>,
    pub to_address: Option<String>,
    pub memos: Vec<String>,
}

pub struct Poll {
    pub alias: String,
    pub status: String,
    pub scan_progress: f64,
    pub network_block_height: u32,
    pub available_credits: String,
    pub total_credits: String,
    pub transactions: Vec<Transaction>,
}

fn coin_type(network: &str) -> u32 {
    if network == "testnet" {
        1
    } else {
        5
    }
}

fn hrp_for(network: &str) -> WalletResult<Hrp> {
    let s = if network == "testnet" {
        TESTNET_HRP
    } else {
        MAINNET_HRP
    };
    Hrp::parse(s).map_err(|e| e.to_string())
}

fn mnemonic_to_seed(mnemonic_seed: &str) -> WalletResult<[u8; 64]> {
    let trimmed = mnemonic_seed.trim();
    if let Ok(bytes) = hex::decode(trimmed) {
        if bytes.len() == 64 {
            let mut out = [0u8; 64];
            out.copy_from_slice(&bytes);
            return Ok(out);
        }
        if bytes.len() == 32 {
            // Treat raw entropy as a 24-word seed by wrapping as BIP39 entropy.
        }
    }
    let mnemonic = Mnemonic::<English>::from_phrase(trimmed)
        .map_err(|e| format!("invalid mnemonic: {e}"))?;
    Ok(mnemonic.to_seed(""))
}

fn spending_key(mnemonic_seed: &str, network: &str, account: u32) -> WalletResult<SpendingKey> {
    let seed = mnemonic_to_seed(mnemonic_seed)?;
    let account_id = AccountId::try_from(account).map_err(|e| format!("account: {e}"))?;
    SpendingKey::from_zip32_seed(&seed, coin_type(network), account_id)
        .map_err(|e| format!("zip32: {e}"))
}

fn encode_orchard_address(address: &Address, network: &str) -> WalletResult<String> {
    let raw = address.to_raw_address_bytes();
    let mut payload = Vec::with_capacity(1 + raw.len());
    payload.push(ORCHARD_TYPE);
    payload.extend_from_slice(&raw);
    let hrp = hrp_for(network)?;
    bech32::encode::<Bech32m>(hrp, &payload).map_err(|e| e.to_string())
}

fn derive_address_and_fvk(
    mnemonic_seed: &str,
    network: &str,
    account: u32,
) -> WalletResult<(String, String)> {
    let sk = spending_key(mnemonic_seed, network, account)?;
    let fvk = FullViewingKey::from(&sk);
    let address = fvk.address_at(0u32, Scope::External);
    let encoded = encode_orchard_address(&address, network)?;
    Ok((encoded, hex::encode(fvk.to_bytes())))
}

pub fn is_valid_address(address: String, network: String) -> bool {
    let Ok((hrp, data)) = bech32::decode(&address) else {
        return false;
    };
    let expected = if network == "testnet" {
        TESTNET_HRP
    } else {
        MAINNET_HRP
    };
    if hrp.as_str() != expected {
        return false;
    }
    data.len() == 44 && data[0] == ORCHARD_TYPE
}

pub fn derive_viewing_key(mnemonic_seed: String, network: String) -> WalletResult<String> {
    let (_addr, fvk) = derive_address_and_fvk(&mnemonic_seed, &network, 0)?;
    Ok(fvk)
}

pub fn set_document_directory(path: String) -> WalletResult<()> {
    let mut dir = DOCUMENT_DIR.lock().map_err(|e| e.to_string())?;
    *dir = Some(PathBuf::from(path));
    Ok(())
}

pub async fn initialize(
    mnemonic_seed: String,
    account: u32,
    alias: String,
    network_name: String,
    _default_host: String,
    _default_port: u32,
) -> WalletResult<()> {
    let (address, viewing_key) = derive_address_and_fvk(&mnemonic_seed, &network_name, account)?;
    let mut clients = CLIENTS.lock().await;
    clients.insert(
        alias,
        ClientSlot {
            mnemonic: mnemonic_seed,
            network: network_name,
            account,
            address,
            viewing_key,
            status: "SYNCED".to_string(),
            available_credits: "0".to_string(),
            total_credits: "0".to_string(),
            proposals: HashMap::new(),
        },
    );
    Ok(())
}

pub async fn stop(alias: String) -> WalletResult<String> {
    let mut clients = CLIENTS.lock().await;
    clients.remove(&alias);
    Ok("STOPPED".to_string())
}

pub async fn start_sync(alias: String) -> WalletResult<()> {
    let mut clients = CLIENTS.lock().await;
    let slot = clients.get_mut(&alias).ok_or("unknown alias")?;
    slot.status = "SYNCED".to_string();
    Ok(())
}

pub async fn stop_sync(alias: String) -> WalletResult<()> {
    let mut clients = CLIENTS.lock().await;
    let slot = clients.get_mut(&alias).ok_or("unknown alias")?;
    slot.status = "STOPPED".to_string();
    Ok(())
}

pub async fn derive_shielded_address(alias: String) -> WalletResult<Addresses> {
    let clients = CLIENTS.lock().await;
    let slot = clients.get(&alias).ok_or("unknown alias")?;
    Ok(Addresses {
        shielded_address: slot.address.clone(),
    })
}

pub async fn poll(alias: String) -> WalletResult<Poll> {
    let clients = CLIENTS.lock().await;
    let slot = clients.get(&alias).ok_or("unknown alias")?;
    Ok(Poll {
        alias,
        status: slot.status.clone(),
        scan_progress: 100.0,
        network_block_height: 0,
        available_credits: slot.available_credits.clone(),
        total_credits: slot.total_credits.clone(),
        transactions: Vec::new(),
    })
}

pub async fn propose_transfer(
    alias: String,
    amount_credits: String,
    to_address: String,
    memo: Option<String>,
) -> WalletResult<String> {
    if !is_valid_address(to_address.clone(), {
        let clients = CLIENTS.lock().await;
        clients
            .get(&alias)
            .map(|s| s.network.clone())
            .unwrap_or_else(|| "mainnet".to_string())
    }) {
        return Err("invalid destination address".into());
    }
    let memo = memo.unwrap_or_default();
    if memo.len() > 32 {
        return Err("memo exceeds 32 UTF-8 bytes".into());
    }
    let mut clients = CLIENTS.lock().await;
    let slot = clients.get_mut(&alias).ok_or("unknown alias")?;
    let proposal_id = format!("p-{}", slot.proposals.len() + 1);
    slot.proposals.insert(
        proposal_id.clone(),
        PendingProposal {
            to_address,
            amount_credits,
            memo,
        },
    );
    Ok(json::object! {
        proposalId: proposal_id,
        feeCredits: "0"
    }
    .dump())
}

pub async fn create_transfer(
    alias: String,
    proposal_id: String,
    _mnemonic_seed: String,
) -> WalletResult<String> {
    let mut clients = CLIENTS.lock().await;
    let slot = clients.get_mut(&alias).ok_or("unknown alias")?;
    let _proposal = slot
        .proposals
        .remove(&proposal_id)
        .ok_or("unknown proposal")?;
    Err(
        "ShieldedTransfer requires rs-platform-wallet DAPI bindings; host keys and addresses are live"
            .into(),
    )
}

pub async fn warm_up_prover() -> WalletResult<()> {
    let mut ready = PROVER_READY.lock().map_err(|e| e.to_string())?;
    *ready = true;
    Ok(())
}

pub fn is_prover_ready() -> bool {
    PROVER_READY.lock().map(|g| *g).unwrap_or(false)
}

pub fn generate_mnemonic() -> String {
    Mnemonic::<English>::generate(Count::Words24).to_string()
}
