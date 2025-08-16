# Ramp Plugins

This directory contains the new ramp plugin architecture for buy/sell integrations.

## Overview

The ramp plugin system provides a standardized interface for integrating fiat on/off ramp providers. Unlike the legacy fiat plugin system, ramp plugins:

- Have a simpler, more focused API
- Return quote objects that can be approved later
- Use direct API access instead of UI wrappers

## Plugin Interface

### RampPlugin
The main plugin interface with:
- `pluginId`: Unique identifier
- `rampInfo`: Display information (name, icon)
- `fetchQuote()`: Returns an array of quotes for all supported payment types

### RampQuoteResult
Quote objects returned by plugins with:
- Quote details (amounts, currencies, etc.)
- `approveQuote()`: Executes the quote
- `closeQuote()`: Cleanup function

### RampApproveQuoteParams
Parameters passed to `approveQuote()`:
- `coreWallet`: The wallet to use for the transaction

### RampPluginConfig
Configuration passed to plugin factories:
- `initOptions`: Provider-specific initialization options
- `store`: Optional storage interface for persistent data
- `makeUuid`: Optional UUID generator
- `account`: EdgeAccount for wallet operations
- `navigation`: Navigation object for scene transitions
- `onLogEvent`: Analytics tracking function
- `disklet`: Disklet for file operations and permissions

## Available Plugins

- **paybis**: Paybis integration supporting multiple payment types

## Architecture

Ramp plugins receive their dependencies through the `RampPluginConfig` during initialization. This allows plugins to:
- Use navigation directly for scene transitions
- Track analytics events
- Request permissions
- Show toasts and errors
- Handle deeplinks

The plugin system uses a centralized deeplink handler (`rampDeeplinkHandler`) for managing provider callbacks from external webviews.