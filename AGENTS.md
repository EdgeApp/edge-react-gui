# Edge React GUI - Agent Guidelines

## Initialization

**Before starting any task, ensure `docs/` is in context:**

1. **Use `find docs/ -name "*.md" -type f`** to recursively list all `.md` files in `docs/` folder to get an index of available documentation
2. **Read relevant docs** to understand existing conventions, patterns, and business logic before implementing features

## Workflow

### Documentation Management

- **Document lessons learned** when prompts contain "always", "remember", "never" or similar memory keywords
- **Create markdown files** in `docs/` folder for conventions, business logic, and codebase patterns discovered
- **Amend existing docs** rather than creating duplicates to keep knowledge base organized and succinct
- **Prioritize documenting** coding conventions, architectural patterns, and business rules
- **All `.md` files in `docs/` must be indexed** in the Documentation section below with "When to read" and "Summary" descriptions

## Documentation

The following documentation files provide detailed guidance for specific areas of development. **Read the relevant documentation before starting work** in these areas:

### `docs/component-styling-guidelines.md`

**When to read**: Before styling components or converting inline styles to styled components
**Summary**: Guidelines for using the `styled` HOC, file structure patterns, and avoiding inline styles. Essential for maintaining consistent component styling across the codebase.

### `docs/localization-guidelines.md`

**When to read**: Before adding any UI text or working with user-facing strings
**Summary**: Mandatory guidelines for localizing all UI strings using `lstrings` from `en_US.ts`. Covers naming conventions, parameter handling, and implementation steps for internationalization.

### `docs/MAESTRO.md`

**When to read**: When setting up or running end-to-end tests, or when working on test automation
**Summary**: Complete setup guide for Maestro mobile testing framework. Includes installation instructions, running tests, and creating new tests with Maestro Studio.

### `docs/GUI_PLUGINS_ARCHITECTURE.md`

**When to read**: When working on fiat on/off ramp features, payment integrations, or plugin system
**Summary**: Comprehensive architecture guide for the fiat plugin system. Covers provider implementations, payment method configurations, regional restrictions, and integration patterns for buy/sell cryptocurrency features.

### `docs/scene-architecture-patterns.md`

**When to read**: Before creating new scenes or modifying existing scene components
**Summary**: Critical architectural patterns for Edge scenes. Covers the fundamental rule that scenes must never implement custom headers (managed by react-navigation), proper SceneWrapper usage, and navigation configuration patterns. Includes TradeCreateScene case study showing common architectural violations to avoid.

### `docs/payment-type-icons.md`

**When to read**: When working with payment type icons in fiat plugins or payment method displays
**Summary**: Explains the payment type icon mapping system for displaying appropriate icons for different payment methods. Covers usage with `getPaymentTypeIcon` utility, integration with PaymentOptionCard, direct and fallback mappings, and how to add new payment types.

### `docs/ramp-plugin-migration-guide.md`

**When to read**: Before migrating ramp plugins from legacy provider architecture to new ramp plugin architecture or when creating new ramp plugins
**Summary**: Comprehensive migration guide for removing FiatPluginUi abstraction and using direct API imports. Covers migration of toasts, modals, navigation, permissions (with important boolean logic inversion note), wallet operations, and environment configuration requirements. Includes detailed steps for creating init options cleaners, validating plugin initialization, and registering plugins in envConfig. Also explains how to migrate getSupportedAssets initialization logic to an internal fetchProviderConfig function with 2-minute TTL caching. Essential for converting legacy fiat providers to new ramp plugins and ensuring proper type safety.

### `docs/infinite-headless-api.md`

**When to read**: When integrating with Infinite's Headless SDK for wallet authentication, KYC, quotes, or transfers
**Summary**: Complete API documentation for Infinite's Headless SDK. Covers wallet-based authentication flow using EIP-191 message signing, simplified customer onboarding with automatic wallet association, bank account management, real-time quotes for on-ramp/off-ramp conversions, and transfer execution with ACH payments. Includes detailed error codes, security best practices, and Edge Wallet-specific configuration (org_edge_wallet_main). Note that API Key is no longer required - only Organization ID and JWT tokens for authenticated endpoints.

### `docs/module-file-guidelines.md`

**When to read**: Before creating or modifying any TypeScript/JavaScript files or modules
**Summary**: Comprehensive guidelines for organizing code files with strict ordering rules: types → constants → functions, with exports always preceding non-exports within each category. Explains the three-category structure where exported types come before non-exported types, exported constants before non-exported constants, and exported functions before non-exported functions. Provides detailed examples for different module types (React components, utilities, workflows), common violations to avoid, and visual separation techniques. Essential reading for maintaining consistent, scannable, and maintainable code structure across the codebase.
