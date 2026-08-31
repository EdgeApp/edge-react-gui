mod wallet;

#[cfg(feature = "napi-backend")]
mod napi_api;

#[cfg(feature = "uniffi-backend")]
mod uniffi_api;

#[cfg(feature = "uniffi-backend")]
pub use uniffi_api::*;

#[cfg(feature = "uniffi-backend")]
pub use wallet::{Addresses, Poll, Transaction};

#[cfg(feature = "uniffi-backend")]
uniffi::include_scaffolding!("dash");
