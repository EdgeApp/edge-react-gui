# Edge CLI

A command-line interface for the Edge platform. The CLI provides
direct access to edge-core-js functionality from a terminal, useful
for account management, wallet operations, debugging, and scripting.

## Running

**Development (from source):**

```bash
yarn cli                          # Interactive REPL
yarn cli help                     # Print command list
yarn cli -u <user> -p <pass> balance <walletId>  # One-shot command
```

**Built artifact:**

```bash
yarn build:cli                    # Compile to lib/edgeCli.js
node lib/edgeCli.js help          # Run the built binary
```

**Published (npm):**

```bash
npx edge-cli help
```

## Global Options

| Flag | Description |
|------|-------------|
| `-t, --test` | Use tester servers instead of production |
| `-u, --username` | Username for login |
| `-p, --password` | Password for login |
| `-k, --api-key` | Override the API key from keys.json |
| `-a, --app-id` | Application ID |
| `-d, --directory` | Working directory for local data |
| `-c, --config` | Path to a configuration file |
| `-h, --help` | Display options |

## Configuration

The CLI loads API keys from `keys.json`, searched in order:

1. `./keys.json` (repository root)
2. `~/.edge-cli/keys.json`

The file provides `edgeApiKey`, `edgeApiSecret`, and per-plugin API
keys under `pluginApiKeys`.

## Command Reference

### Account & Authentication

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `account-available <username>` | Check if a username is taken | `context.usernameAvailable()` |
| `account-create <user> <pass> <pin>` | Create a new account | `context.createAccount()` |
| `account-key` | Show the account's login key | `account.getLoginKey()` |
| `password-login <user> <pass> [otp]` | Log in with password | `context.loginWithPassword()` |
| `key-login <user> <key>` | Log in with an account key | `context.loginWithKey()` |
| `pin-login <user> <pin>` | Log in with a device PIN | `context.loginWithPIN()` |
| `recovery2-login <key> <user> <answers...>` | Log in with recovery answers | `context.loginWithRecovery2()` |
| `edge-login` | Request a QR-based Edge login | `context.requestEdgeLogin()` |
| `logout` | Log out of the current session | `account.logout()` |

### Username Management

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `username-list` | List local usernames on this device | `context.localUsers` |
| `username-delete <username>` | Forget a username from this device | `context.forgetAccount()` |
| `messages-fetch` | Fetch login messages for local users | `context.fetchLoginMessages()` |

### Password, PIN & OTP

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `password-setup <password>` | Create or change the password | `account.changePassword()` |
| `pin-setup <pin>` | Create or change the PIN | `account.changePin()` |
| `pin-delete` | Remove the PIN | `account.deletePin()` |
| `otp-status` | Show OTP status | `account.otpKey`, `account.otpResetDate` |
| `otp-enable [timeout]` | Enable OTP | `account.enableOtp()` |
| `otp-disable` | Disable OTP | `account.disableOtp()` |
| `otp-reset-cancel` | Cancel a pending OTP reset | `account.cancelOtpReset()` |
| `otp-reset-request <user> <token>` | Request an OTP reset | `context.requestOtpReset()` |

### Recovery

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `recovery2-setup [<q> <a>]...` | Set recovery questions and answers | `account.changeRecovery()` |
| `recovery2-questions <key> <user>` | Show a user's recovery questions | `context.fetchRecovery2Questions()` |

### Wallet Management

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `wallet-create <type> [<name>]` | Create a currency wallet | `account.createCurrencyWallet()` |
| `wallet-list` | List active wallets | `account.activeWalletIds`, `account.currencyWallets` |
| `wallet-info <walletId>` | Show wallet details | `wallet.currencyInfo`, `wallet.syncRatio`, etc. |
| `wallet-rename <walletId> <name>` | Rename a wallet | `wallet.renameWallet()` |
| `wallet-archive <walletId>` | Archive a wallet | `account.changeWalletStates({ archived: true })` |
| `wallet-unarchive <walletId>` | Unarchive a wallet | `account.changeWalletStates({ archived: false })` |
| `wallet-undelete <walletId>` | Undelete a wallet | `account.changeWalletStates({ deleted: false })` |

### Keys (Low-Level Wallet Access)

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `key-list` | List all keys in the account | `account.allKeys` |
| `key-add <json>` | Create a wallet from raw key JSON | `account.createWallet()` |
| `key-get <walletId>` | Read a raw private key | `account.getRawPrivateKey()` |
| `key-undelete <walletId>` | Remove a key's deleted flag | `account.changeWalletStates({ deleted: false })` |
| `export-public <walletId>` | Export public key (xpub, etc.) | `account.getDisplayPublicKey()` |
| `export-private <walletId>` | Export private key (WIF, seed, etc.) | `account.getDisplayPrivateKey()` |

### Balances & Transactions

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `balance <walletId> [<tokenId>]` | Show native and exchange balance | `wallet.balanceMap` |
| `address <walletId>` | Get receive addresses | `wallet.getAddresses()` |
| `tx-list <walletId> [<tokenId>] [<limit>] [<startDate>] [<endDate>] [<search>]` | List transactions | `wallet.getTransactions()` |

### Spending

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `spend <walletId> <addr> <amount> [<tokenId>] [dry-run]` | Send funds | `wallet.makeSpend()`, `wallet.signTx()`, `wallet.broadcastTx()`, `wallet.saveTx()` |
| `spend-max <walletId> <addr> [<tokenId>] [dry-run]` | Send entire balance | `wallet.getMaxSpendable()` + spend flow |
| `max-spendable <walletId> <addr> [<tokenId>]` | Calculate max spendable amount | `wallet.getMaxSpendable()` |

### Tokens

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `token-list <walletId>` | List available tokens | `wallet.currencyConfig.allTokens`, `wallet.enabledTokenIds` |
| `token-enable <walletId> <tokenId>` | Enable a token | `wallet.changeEnabledTokenIds()` |
| `token-disable <walletId> <tokenId>` | Disable a token | `wallet.changeEnabledTokenIds()` |
| `token-detected <walletId>` | Show detected but unenabled tokens | `wallet.detectedTokenIds` |

### Data Store

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `data-store-list [storeId]` | List stores or items in a store | `account.dataStore.listStoreIds()`, `account.dataStore.listItemIds()` |
| `data-store-get <storeId> <itemId>` | Read an item | `account.dataStore.getItem()` |
| `data-store-set <storeId> <itemId> <text>` | Write an item | `account.dataStore.setItem()` |
| `data-store-delete <storeId> [itemId]` | Delete an item or store | `account.dataStore.deleteItem()`, `account.dataStore.deleteStore()` |

### Lobby

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `lobby-login-fetch <lobbyId>` | Fetch an Edge login request | `account.fetchLobby()` |
| `lobby-login-approve <lobbyId>` | Approve an Edge login request | `account.fetchLobby()` + `loginRequest.approve()` |

### Other

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `help [command]` | Show help | (local) |

### Admin (Internal / Debugging)

These commands use private `context.$internalStuff` APIs and are
intended for Edge developers. They are prefixed with `admin-` to
keep them out of the way during normal use.

| Command | Description | edge-core-js API |
|---------|-------------|------------------|
| `admin-auth-fetch [method] <path> [body]` | Raw auth server request | `$internalStuff.authRequest()` |
| `admin-filename-hash <dataKey> <txid>` | Run the filename hashing algorithm | HMAC-SHA256 (local) |
| `admin-username-hash <username>` | Hash a username with scrypt | `$internalStuff.hashUsername()` |
| `admin-lobby-create <json>` | Create a lobby and wait for replies | `$internalStuff.makeLobby()` |
| `admin-lobby-fetch <lobbyId>` | Fetch a lobby's contents | `$internalStuff.fetchLobbyRequest()` |
| `admin-lobby-reply <lobbyId> <json>` | Send a reply to a lobby | `$internalStuff.sendLobbyReply()` |
| `admin-repo-sync <syncKey>` | Sync a repo | `$internalStuff.syncRepo()` |
| `admin-repo-list <syncKey> <dataKey> [path]` | List repo contents | `$internalStuff.getRepoDisklet()` + `disklet.list()` |
| `admin-repo-get <syncKey> <dataKey> <path>` | Read a repo file | `$internalStuff.getRepoDisklet()` + `disklet.getText()` |
| `admin-repo-set <syncKey> <dataKey> <path> <val>` | Write a repo file | `$internalStuff.getRepoDisklet()` + `disklet.setText()` |

## Source Layout

```
src/cli/
  index.ts                    # CLI entry point (main, REPL, plugin reg)
  command.ts                  # Command registry, CliConsole type
  cliConfig.ts                # Config file loader
  keysConfig.ts               # keys.json loader
  declare-modules.d.ts        # Module declarations for untyped deps
  commands/
    all.ts                    # Imports all command files
    admin.ts                  # admin-* commands (internal/debugging)
    data-store.ts             # data-store-* commands
    edge.ts                   # edge-login command
    help.ts                   # help command
    keys.ts                   # key-* commands (low-level wallet keys)
    lobby.ts                  # lobby-* commands
    login.ts                  # account-*, username-*, key-login, logout
    otp.ts                    # otp-* commands
    password.ts               # password-* commands
    pin.ts                    # pin-* commands
    recovery2.ts              # recovery2-* commands
    wallet.ts                 # wallet-*, balance, address, tx-list,
                              #   spend, token-*, export-*
  util/
    encoding.ts               # base58, utf8 codecs
    internal.ts               # EdgeInternalStuff accessor
    session.ts                # Session type, requireContext/requireAccount
```
