# Module and File Guidelines

Essential rules for organizing TypeScript/JavaScript files in the Edge codebase.

## Core Structure

Files must follow this strict three-category order, with **exports always before non-exports within each category**:

1. **Types** → exported types, then non-exported types
2. **Constants/Variables** → exported constants, then non-exported constants  
3. **Functions** → exported functions, then non-exported functions

## The Golden Rule

**Within EACH category, exports come before non-exports.** This makes the public API immediately visible.

## Complete Example

```typescript
import React from 'react'
import { View } from 'react-native'
import type { EdgeAccount } from 'edge-core-js'

// Exported types first
export interface PublicConfig {
  apiUrl: string
}
export type Status = 'active' | 'inactive'

// Non-exported types after
interface InternalState {
  cache: Map<string, unknown>
}

// Exported constants first
export const API_TIMEOUT = 30000
export const VERSION = '1.0'

// Non-exported constants after
const RETRY_DELAY = 1000
const cache = new Map()

// Exported functions first
export const processData = (data: string): string => {
  return sanitize(data).toLowerCase()
}

// Non-exported functions after
const sanitize = (input: string): string => {
  return input.trim()
}
```

## Quick Examples

### ✅ CORRECT
```typescript
// Types
export interface User { id: string }
export type Role = 'admin' | 'user'
interface Cache { data: unknown }

// Constants
export const MAX_RETRIES = 3
const INTERNAL_KEY = 'secret'

// Functions
export const getUser = () => { }
const validateUser = () => { }
```

### ❌ WRONG
```typescript
// Mixed exports and non-exports
interface Cache { }  // non-export
export interface User { }  // export after non-export

const INTERNAL_KEY = 'secret'
export const MAX_RETRIES = 3  // export after non-export

const validate = () => { }
export const getUser = () => { }  // export after non-export
```

## Import Order

1. External packages (React, react-native)
2. Edge packages (edge-core-js)
3. Absolute imports (from src/)
4. Relative imports (../, ./)
5. Type imports (use `import type`)

## Common Violations

1. **Scattered exports** - Don't mix exports throughout the file
2. **Wrong category order** - Always: Types → Constants → Functions
3. **Mixed export/non-export** - Keep exports before non-exports in each category

## File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCaseTypes.ts`
- Workflows: `camelCaseWorkflow.ts`
- Hooks: `useCamelCase.ts`

## When to Split

Split files that:
- Exceed 300 lines
- Have 10+ exports in one category
- Mix unrelated functionality

**Goal**: Consistent, scannable files where the public API is immediately visible.