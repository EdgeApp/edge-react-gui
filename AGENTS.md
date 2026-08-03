# Edge React GUI - Agent Guidelines

## Package Manager

- **Use npm** for all package management and script execution
- `npm ci` - Install dependencies from the lockfile (CI-style, reproducible)
- `npm install <package>` - Add new dependency
- `npm install -D <package>` - Add dev dependency

## Build/Test/Lint Commands

- `npm run lint` - Run ESLint on entire codebase
- `npm run fix` - Auto-fix linting issues and dedupe the dependency tree
- `npm test` - Run Jest tests (single run)
- `npm run watch` - Run Jest tests in watch mode
- `npm test -- --testNamePattern="test name"` - Run specific test by name
- `npm run verify` - Run lint, typechain, tsc, and test (full verification)
- `npm run precommit` - Full pre-commit check (localize, lint-staged, tsc, test)
- `tsc` - TypeScript type checking (via package.json script)

## Swap Provider Integration

The plugin itself lives in `edge-exchange-plugins`; this repo only wires it up, and every wiring point below fails SILENTLY when missed (no error, just a blank icon or a provider that never initializes). Registering a new swap `pluginId` means all of:

- `src/envConfig.ts` - `<NAME>_INIT` via `asCorePluginInit`, when the plugin takes init options (an `apiKey`)
- `src/util/corePlugins.ts` - `swapPlugins` entry mapping the `pluginId` to that init (or `true` when it needs none)
- `src/actions/CategoriesActions.ts` - `pluginIdIcons` entry, or swap transactions render without a provider icon
- `src/constants/MerchantContacts.ts` - `MERCHANT_CONTACTS` entry whose `displayName` matches the plugin's `swapInfo.displayName` exactly, since the tx list matches thumbnails by that string
- `src/components/modals/SwapVerifyTermsModal.tsx` - `pluginData` entry ONLY for centralized providers with terms/KYC to accept; DEX plugins (`isDex: true`) take none

New swap icons live at `https://content.edge.app/exchangeIcons/<pluginId>/icon.png` (`getSwapPluginIconUri` in `src/util/CdnUris.ts`) and must be uploaded to the content server separately, or the URL 403s. The wiring stays inert until `package.json` bumps `edge-exchange-plugins` to a published version containing the plugin.

## Code Style Guidelines

- **Formatting**: Prettier with single quotes, no semicolons, no trailing commas, 80 char width
- **Imports**: Use `simple-import-sort` plugin for automatic import sorting
- **Types**: TypeScript required, no `allowJs`, prefer explicit types over `any`
- **React**: Use functional components with hooks, prefer `useHandler` over `useCallback`
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Files**: `.tsx` for React components, `.ts` for utilities/hooks
- **Error Handling**: Use proper error boundaries, avoid throwing in render
- **Text Components**: Use `EdgeText`, `Paragraph`, `SmallText`, `WarningText` instead of raw text
- **Component Reuse**: Strongly prefer reusing existing shared components over building new ones or dropping to raw library primitives. Before adding UI, look for a component that already covers the need (e.g. text via `EdgeText`), and keep color, sizing, and styling driven by `useTheme()` rather than hard-coded per call site. When nothing suitable exists, add a reusable, themed definition instead of a one-off
- **Spacing**: Keep a minimum of 1rem TOTAL space between an element and its neighbors, including screen edges. "Total" is the sum contributed across nearby and parent elements, so examine them rather than each element in isolation: scene-edge padding from `SceneWrapper`/`SceneContainer` (`DEFAULT_MARGIN_REM`, 0.5rem) plus an element's own 0.5rem margins via `Space`/`useSpaceStyle` compose to the 1rem total. An explicit override always takes precedence: the "unless otherwise specified" escape hatch applies to every case, screen edges included. The only built-in exception is flex layouts, which rely on flex gap and alignment for sibling spacing; even there, the 1rem screen-edge minimum still applies. Express spacing in rem through the layout primitives instead of hard-coded pixel margins
- **Hooks**: Custom hooks in `src/hooks/`, follow `use*` naming convention
- **Testing**: Jest with React Native Testing Library, tests in `__tests__/` directories

## Git Conventions

### Commit Messages

- **Subject**: Imperative mood, capitalize first letter, max 50 chars, no period
- **Body**: Explain what/why (not how), wrap at 72 chars, separate from subject with blank line
- **Clean commits**: Each commit should be standalone, build successfully, and improve code
- **Rebasing**: Use interactive rebase to split, squash, and reorder commits before PR

### Pull Requests

- **Future commits**: Use "future! branch-name" for feature dependencies not yet merged
- **Draft PRs**: Mark PRs with future commits as draft until dependencies are merged
- **Fixup commits**: Use `git commit --fixup <hash>` for PR feedback, then squash with `git rebase -i --autosquash`

### Branch Dependencies

- Create pseudo-merge commits with "future! branch-name" for dependent features
- Use `git rebase --onto` to update dependent branches when base changes
- Remove future commits by rebasing onto master once dependencies are merged