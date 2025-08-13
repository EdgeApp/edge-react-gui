# Edge React GUI - Agent Guidelines

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
- **Spacing**: Prefer dynamic flex styling. Don't use hard-coded literals if possible, with the exception of split 0.5rem spacing between children.
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

## Agent Operating Rules

### Coding rules

- **Quality of solutions**
  - Suggest better approaches if the user prompt’s approach is suboptimal; seek yes/no confirmation before implementing.

- **Package/tooling**
  - Use yarn, not npm, for Edge organization repositories.
  - Before installing a package, read the npm or github page first to check if there is anything suspicious: first publish date, I in place of L, number of stars, etc. Respond with a link to the package first, and wait for user confirmation to install.

- **Documentation style**
  - Always document the final state of current changes, not the journey.
  - Code comments and READMEs should describe the current state of the branch.
  - `CHANGELOG.md`
    - Add at most a few new bullets describing the changes made in the branch.
    - Bullet lines should never wrap
    - Follow the existing patterns and voice seen in the CHANGELOG

- **Defaults and nullish handling**
  - Use `??` instead of `||` for default values.
    - Examples:
      - `value ?? defaultValue`
      - `config.timeout ?? 5000` (preserves 0)
      - `user.name ?? 'Anonymous'` (preserves '')
      - `settings.enabled ?? true` (preserves false)

- **Conditional checks with optional chaining**
  - Do not use optional chaining results directly in conditions.
    - Use:
      - `if (obj?.prop != null) { ... }`
      - `if (obj?.arr != null && obj.arr.length > 0) { ... }`
      - `if (response?.data != null) { ... }`

- **Component exports**
  - Component exports for any modified files should follow the form: `export const Component: React.FC<Props> = (props: Props) => {`

- **External APIs/libraries**
  - Research first: quote official docs or actively search; explicitly state “According to [source] …”.
  - If documentation is incomplete:
    - STOP implementation
    - ASK: what’s missing and whether to search more or for user to provide docs
    - WAIT for guidance before proceeding

- **Lint after TypeScript edits**
  - Run:
    ```bash
    files=($(git diff HEAD --name-only -- '*.ts' '*.tsx')); if (( ${#files} )); then ./node_modules/.bin/eslint --fix "${files[@]}" && yarn tsc; else echo "No TS/TSX changes since HEAD."; fi
    ```
  - Fix remaining errors after running the above.

- **Meta reporting**
  - In every response that included code changes, state any unfollowed "Coding rules" along with rationale. If unfollowed rules are found to be applicable at this step, continue work to meet the rules.

### Non-coding (behavioral) rules

- **Communication**
  - Neutral tone; avoid fluff; do not apologize. State understanding of mistakes.
  - Ask for clarification when a prompt/task is unclear or ambiguous.
  - The user is human and prone to mistakes. Proactively notify when:
    - More research is needed
    - Better alternative patterns exist
    - Best practices are contradicted
    - Technical inaccuracies are present
    - Edge cases are missed
    - Inconsistencies appear against the codebase

- **Tool use gate**
  - Before using any code editing tools, scan the user’s message for question marks (?). If any exist, DO NOT make code changes - answer all questions.

- **Planning and workflow**
  - If asked to “plan” (or similar), DO NOT make code changes - provide only a textual plan.
  - Multi-phase plans: Implement one phase at a time, then pause for feedback.
