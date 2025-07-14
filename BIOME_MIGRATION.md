# Biome Migration Guide

This document explains the migration from ESLint and Prettier to Biome and how to handle the custom linting rules.

## Overview

We've successfully migrated from ESLint and Prettier to Biome for faster and more consistent code formatting and linting.

## Configuration Mapping

### Prettier Configuration Comparison

| Prettier Setting | Original Value | Biome Configuration | Biome Value | Behavior Notes |
|------------------|----------------|-------------------|-------------|----------------|
| `printWidth` | `80` | `formatter.lineWidth` | `80` | ✅ Identical behavior |
| `arrowParens` | `"avoid"` | `javascript.formatter.arrowParentheses` | `"asNeeded"` | ✅ Equivalent: both avoid unnecessary parens |
| `semi` | `false` | `javascript.formatter.semicolons` | `"asNeeded"` | ⚠️ Biome adds semicolons where ASI is unsafe |
| `singleQuote` | `true` | `javascript.formatter.quoteStyle` | `"single"` | ✅ Identical behavior |
| `trailingComma` | `"none"` | `javascript.formatter.trailingCommas` | `"none"` | ✅ Identical behavior |
| `tabWidth` | `2` (default) | `formatter.indentWidth` | `2` | ✅ Identical behavior |
| `useTabs` | `false` (default) | `formatter.indentStyle` | `"space"` | ✅ Identical behavior |
| JSX quotes | `"` (default) | `javascript.formatter.jsxQuoteStyle` | `"double"` | ✅ Identical behavior |
| `bracketSpacing` | `true` (default) | `javascript.formatter.bracketSpacing` | `true` | ✅ Identical behavior |
| `bracketSameLine` | `false` (default) | `javascript.formatter.bracketSameLine` | `false` | ✅ Identical behavior |
| N/A | N/A | `javascript.formatter.quoteProperties` | `"asNeeded"` | 🆕 **New**: Only quote object properties when necessary |
| N/A | N/A | `javascript.formatter.attributePosition` | `"auto"` | 🆕 **New**: Automatic JSX attribute positioning |

### ESLint Configuration Comparison

| ESLint Setting | Original Value | Biome Configuration | Biome Value | Behavior Notes |
|----------------|----------------|-------------------|-------------|----------------|
| `extends` | `["standard-kit/prettier"]` | `linter.rules.recommended` | `false` (custom rules) | ⚠️ Biome uses explicit rule configuration vs. presets |
| `simple-import-sort/imports` | `"error"` | `assist.actions.source.organizeImports` | `"off"` | ⚠️ Handled by separate script vs. real-time |
| `no-unused-vars` | `"off"` | `correctness.noUnusedVariables` | `"off"` | ✅ Identical behavior |
| `no-console` | `"off"` (inherited) | `suspicious.noConsole` | `"off"` | ✅ Identical behavior |
| `no-debugger` | `"error"` (inherited) | `suspicious.noDebugger` | `"error"` | ✅ Identical behavior |
| `no-empty` | `"off"` (custom) | `suspicious.noEmptyBlockStatements` | `"off"` | ✅ Identical behavior |
| `@typescript-eslint/no-explicit-any` | `"off"` | `suspicious.noExplicitAny` | `"off"` | ✅ Identical behavior |
| `@typescript-eslint/no-unused-vars` | `"off"` | `correctness.noUnusedVariables` | `"off"` | ✅ Identical behavior |
| `@typescript-eslint/no-non-null-assertion` | `"off"` | `style.noNonNullAssertion` | `"off"` | ✅ Identical behavior |
| N/A | N/A | `correctness.noUnusedImports` | `"off"` | 🆕 **New**: Separate rule for unused imports |
| N/A | N/A | `correctness.noUnusedFunctionParameters` | `"off"` | 🆕 **New**: Specific to function parameters |
| N/A | N/A | `suspicious.useAwait` | `"off"` | 🆕 **New**: Ensures async functions use await |
| N/A | N/A | `suspicious.noArrayIndexKey` | `"off"` | 🆕 **New**: React-specific rule for array keys |
| N/A | N/A | `complexity.noUselessFragments` | `"off"` | 🆕 **New**: React fragment optimization |

### File Inclusion/Exclusion Mapping

| ESLint/Prettier Setting | Original Value | Biome Configuration | Biome Value |
|-------------------------|----------------|-------------------|-------------|
| `.eslintignore` | `android/`, `ios/`, `node_modules` | `vcs.useIgnoreFile` | `true` (uses .gitignore) |
| File patterns | All JS/TS files | `files.includes` | `["src/**/*.{ts,tsx,js,jsx}", "scripts/**/*.{ts,js}", "*.{js,ts,tsx,jsx}"]` |
| Test file overrides | N/A | `overrides` for test files | `noPrecisionLoss: "off"` |

### Custom Rules Mapping

| Original ESLint Rule | Location | Biome Equivalent | Implementation |
|---------------------|----------|------------------|----------------|
| `useAbortable-abort-check-param` | `eslint-local-rules/` | N/A | `scripts/check-useAbortable.ts` |
| `useAbortable-abort-check-usage` | `eslint-local-rules/` | N/A | `scripts/check-useAbortable.ts` |
| Import sorting | `simple-import-sort/imports` | N/A | Handled by editor/manual |

### Global Variables

| ESLint Global | Original | Biome Configuration | Status |
|---------------|----------|-------------------|---------|
| `__DEV__` | Defined | `javascript.globals` | ✅ Included |
| `fetch` | Defined | `javascript.globals` | ✅ Included |
| `global` | Defined | `javascript.globals` | ✅ Included |
| Jest globals | Via env | `javascript.globals` | ✅ Included |
| Node globals | Via env | `javascript.globals` | ✅ Included |

## Additional Biome-Specific Configurations

### New Features Not Available in ESLint/Prettier

| Feature | Biome Configuration | Value | Purpose & Benefits |
|---------|-------------------|-------|-------------------|
| **Schema Validation** | `$schema` | `"https://biomejs.dev/schemas/2.1.1/schema.json"` | 🆕 **New**: Provides IDE autocompletion and validation for config file |
| **VCS Integration** | `vcs.enabled` | `true` | 🆕 **New**: Automatic integration with version control systems |
| **Git Client Kind** | `vcs.clientKind` | `"git"` | 🆕 **New**: Optimized for Git workflows and ignore patterns |
| **Ignore File Usage** | `vcs.useIgnoreFile` | `true` | 🆕 **New**: Automatically respects .gitignore without separate .eslintignore |
| **JSON Formatting** | `json.formatter` | Separate config | 🆕 **New**: Independent JSON formatting rules (lineWidth: 120) |
| **Assist Actions** | `assist.actions.source.organizeImports` | `"off"` | 🆕 **New**: Code refactoring and quick fixes beyond linting |
| **Format With Errors** | `formatter.formatWithErrors` | `false` (default) | 🆕 **New**: Option to format code even with syntax errors |
| **Accessibility Rules** | `a11y.*` | Multiple rules | 🆕 **New**: Built-in accessibility linting (disabled for compatibility) |
| **Security Rules** | `security.*` | Multiple rules | 🆕 **New**: Built-in security vulnerability detection |
| **Performance Rules** | `performance.*` | Multiple rules | 🆕 **New**: Performance-focused linting rules |

### Enhanced Override System

| Feature | ESLint Equivalent | Biome Implementation | Advantages |
|---------|-------------------|----------------------|------------|
| **File-based Overrides** | `overrides` array | `overrides` with `includes` | ✅ More granular pattern matching |
| **Test File Handling** | Separate config files | Built-in test file detection | 🆕 **New**: `**/__tests__/**`, `**/*.test.*`, `**/*.spec.*` |
| **Language-specific Rules** | Plugin configurations | Native language support | 🆕 **New**: Built-in TypeScript, React, and JSON support |
| **Rule Inheritance** | Complex extends system | Simple override cascade | 🆕 **New**: Cleaner configuration inheritance |

### Biome-Only Linting Rules

| Rule Category | Example Rules | Purpose | ESLint Equivalent |
|---------------|---------------|---------|------------------|
| **Correctness** | `noPrecisionLoss`, `noUnreachableSuper` | Prevent runtime errors | Various ESLint rules |
| **Suspicious** | `noMisleadingInstantiator`, `noPrototypeBuiltins` | Catch suspicious patterns | Custom plugins needed |
| **Performance** | `noAccumulatingSpread`, `noDelete` | Optimize performance | No direct equivalent |
| **Complexity** | `noUselessTernary`, `useOptionalChain` | Reduce complexity | Some via plugins |
| **Security** | `noDangerouslySetInnerHtml`, `noGlobalEval` | Security vulnerabilities | Requires plugins |

### Behavioral Differences & Special Notes

#### Formatting Behavior
- **Semicolon Insertion**: Biome's `"asNeeded"` is more conservative than Prettier's `false` - it adds semicolons where ASI could be problematic
- **Ternary Operator Indentation**: Biome enforces stricter indentation rules - use `// biome-ignore format:` for edge cases
- **Line Width**: Biome respects `lineWidth` more strictly than Prettier in some edge cases

#### Linting Behavior
- **Rule Organization**: Biome categorizes rules by purpose (`correctness`, `suspicious`, `style`, `complexity`) vs. ESLint's plugin-based approach
- **Performance**: Biome's native rules are ~10x faster than equivalent ESLint rules
- **Error Messages**: Biome provides more contextual error messages with suggested fixes

#### Integration Differences
- **IDE Support**: Biome's LSP provides real-time diagnostics vs. ESLint's plugin-based approach
- **File Watching**: Biome has better file watching performance for large codebases
- **Configuration**: Single file vs. ESLint's multiple config files and plugin dependencies

## Changes Made

### 1. Configuration Files
- **Removed:** `.eslintrc.json`, `.prettierrc.json`, `.eslintignore`
- **Added:** `biome.json` with equivalent rules and formatting settings
- **Updated:** `package.json` scripts to use `biome check` instead of `eslint`

### 2. Scripts
- `yarn lint` - Run Biome linting and formatting checks
- `yarn fix` - Auto-fix Biome issues and run yarn-deduplicate
- `yarn lint:useAbortable` - Check custom useAbortable rules (see below)

### 3. Custom ESLint Rules Migration

The original ESLint local rules have been replaced with a standalone TypeScript script:

#### Original ESLint Rules:
- `useAbortable-abort-check-param` - Ensured useAbortable includes maybeAbort parameter
- `useAbortable-abort-check-usage` - Ensured awaited promises within useAbortable are followed by .then(maybeAbort)

#### New Implementation:
- **Script:** `scripts/check-useAbortable.ts`
- **Command:** `yarn lint:useAbortable`
- **Integration:** Runs automatically in precommit hook

## Format Suppression

In rare cases where Biome's formatting differs from the original Prettier behavior, you can suppress formatting on specific lines:

```javascript
// biome-ignore format: preserve original prettier indentation
? feeStyle.warning
```

## Running the Checker

### Check useAbortable Rules Only:
```bash
yarn lint:useAbortable
```

### Full Linting Suite:
```bash
yarn lint  # Biome linting + formatting
yarn lint:useAbortable  # Custom useAbortable rules
```

### Auto-fix Issues:
```bash
yarn fix  # Fixes Biome issues only
# useAbortable issues need to be fixed manually
```

## Integration with Pre-commit

The `yarn precommit` script now includes:
1. Localization updates
2. Typechain generation
3. Lint-staged (Biome formatting)
4. **useAbortable custom rules check**
5. TypeScript compilation
6. Jest tests

## VSCode Integration

Make sure to install the Biome extension for VSCode:
- Extension ID: `biomejs.biome`
- Provides real-time linting and formatting
- Supports auto-fix on save

## Migration Benefits

1. **Performance:** ~35x faster than Prettier
2. **Consistency:** Single tool for linting and formatting
3. **Maintenance:** Fewer dependencies and configuration files
4. **Custom Rules:** Maintained as TypeScript scripts for better maintainability

## Troubleshooting

### If you see formatting differences:
1. Most differences should be minimal and acceptable
2. For problematic cases, use `// biome-ignore format: reason` comments
3. The `lineWidth` is set to 80 characters to match original Prettier config

### If useAbortable checker fails:
1. Check the specific file and line mentioned in the error
2. Ensure `useAbortable` calls have a parameter: `useAbortable((maybeAbort) => ...)`
3. Ensure awaited promises include `.then(maybeAbort)`: `await promise.then(maybeAbort)`

## Files Modified

- `biome.json` - New Biome configuration
- `package.json` - Updated scripts and removed ESLint/Prettier dependencies
- `scripts/check-useAbortable.ts` - New custom rules checker
- `src/util/utils.ts` - Added format suppression comment for ternary operator
- `CHANGELOG.md` - Documented the migration 