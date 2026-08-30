/**
 * Derives the password used to encrypt the wallet file on disk.
 *
 * Versions 0.3.0 and earlier encrypted the file with the seed passphrase,
 * which is the empty string for most wallets, leaving the seed and spend
 * keys effectively unencrypted on disk. The file is a local cache that can
 * always be rebuilt from the mnemonic, so the only requirement here is
 * stability: the same mnemonic must derive the same password on every
 * device, forever.
 *
 * The mnemonic is normalized before hashing because callers store and pass
 * whatever spacing the user or a scanner produced.
 */
export declare function deriveWalletFilePassword(mnemonic: string): string;
