# Edge React GUI - Agent Guidelines

> **⚠️ IMPORTANT: Learning and Documentation**
>
> **ALWAYS search for relevant documentation first** before starting any task that lacks sufficient context:
>
> 1. **Use `find docs/ -name "*.md" -type f`** to recursively list all `.md` files in `docs/` folder to get an index of available documentation
> 2. **Read relevant docs** to understand existing conventions, patterns, and business logic
> 3. **Document lessons learned** when prompts contain "always", "remember", "never" or similar instructions
> 4. **Create markdown files** in `docs/` folder for conventions, business logic, and codebase patterns discovered
> 5. **Amend existing docs** rather than creating duplicates to keep knowledge base organized and succinct
> 6. **Prioritize documenting** coding conventions, architectural patterns, and business rules
> 7. **All `.md` files in `docs/` must be indexed** in the Documentation section below with "When to read" and "Summary" descriptions

## Package Manager

- **Use Yarn v1** instead of npm for all package management and script execution
- `yarn install` - Install dependencies
- `yarn add <package>` - Add new dependency
- `yarn add -D <package>` - Add dev dependency

## Build/Test/Lint Commands

- `yarn lint` - Run ESLint on entire codebase
- `yarn fix` - Auto-fix linting issues and deduplicate yarn
- `yarn test` - Run Jest tests (single run)
- `yarn watch` - Run Jest tests in watch mode
- `yarn test --testNamePattern="test name"` - Run specific test by name
- `yarn verify` - Run lint, typechain, tsc, and test (full verification)
- `yarn precommit` - Full pre-commit check (localize, lint-staged, tsc, test)
- `tsc` - TypeScript type checking (via package.json script)

## Code Style Guidelines

- **Formatting**: Prettier with single quotes, no semicolons, no trailing commas, 80 char width
- **Imports**: Use `simple-import-sort` plugin for automatic import sorting
- **Types**: TypeScript required, no `allowJs`, prefer explicit types over `any`
- **React**: Use functional components with hooks, prefer `useHandler` over `useCallback`
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Files**: `.tsx` for React components, `.ts` for utilities/hooks
- **Error Handling**: Use proper error boundaries, avoid throwing in render
- **Text Components**: Use `EdgeText`, `Paragraph`, `SmallText`, `WarningText` instead of raw text
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
