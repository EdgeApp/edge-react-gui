# WIP — delete this file before a production PR

This file records temporary state that exists only while `paul/cli` is in
progress. **None of it should reach a production pull request.** When the
blockers below clear, delete this file along with the workarounds it describes.

## This branch does not compile from a clean clone

`tsc` reports five errors, and `npm run precommit` therefore fails:

```
src/cli/engine/fetchPluginKeys.ts   Module '"edge-core-js"' has no exported member 'EdgeApiSigner'
src/cli/engine/nodeApiSigner.ts     Module '"edge-core-js"' has no exported member 'EdgeApiSigner'
src/util/edgeApiSigner.ts           Module '"edge-core-js"' has no exported member 'EdgeApiSigner'
src/util/keysServer.ts              Module '"edge-core-js"' has no exported member 'EdgeApiSigner'
src/components/services/EdgeCoreManager.tsx
                                    Property 'apiSigner' does not exist on type 'EdgeContextOptions'
```

`package.json` asks for `edge-core-js@^2.48.1`, which is the newest published
version and does not export `EdgeApiSigner`. The five files above are all new
on this branch and all need it.

### Working around it

Pack `edge-core-js` from its own worktree and install the tarball here. The
`.tgz` files in the repository root are the packs already made for this — they
are gitignored, so they exist only on machines that built them.

```bash
npm install --no-save ./edge-core-js-<version>-<stamp>.tgz
```

`--no-save` is deliberate: pointing `package.json` at a gitignored tarball
would break the build for everyone else. That leaves `package.json` and
`node_modules` disagreeing, which is the whole reason this file exists.

### Clearing it

Either is enough, and both make this section obsolete:

- `edge-core-js` publishes a release exporting `EdgeApiSigner`, and
  `package.json` moves to it; or
- the `apiSigner` work comes out of this branch and ships separately.

## Checklist before opening a production PR

- [ ] `EdgeApiSigner` resolves from a published `edge-core-js`
- [ ] `npx tsc --noEmit` is clean with no `--no-save` install
- [ ] `npm run precommit` passes from a fresh `npm ci`
- [ ] No `*.tgz` in the repository root
- [ ] Delete this file
