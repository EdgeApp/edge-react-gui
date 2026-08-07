# Android APK Size Optimization Report

Generated: 2026-08-06  
Repo: `edge-react-gui`  
Comparison artifact: universal / release APK produced by the same path as [`scripts/deploy.ts`](../scripts/deploy.ts) (`bundleRelease` → bundletool `--mode=universal`, or local `assembleRelease` for iteration).  
32-bit ABI removal is **out of scope** here (tracked separately); overlap is noted explicitly below.

Machine-readable companion files:

- [`apkSizeBaseline.json`](./apkSizeBaseline.json) — full category / ABI / asset / top-entry attribution
- [`apkDexPackages.json`](./apkDexPackages.json) — DEX package rollup
- [`apkJsBundleAttribution.json`](./apkJsBundleAttribution.json) — Hermes sourcemap → npm package attribution
- [`apkUnusedImages.json`](./apkUnusedImages.json) — import-graph unused asset scan
- [`apkAccountbasedDupes.json`](./apkAccountbasedDupes.json) — multi-version deps in `edge-currency-accountbased`

Harness:

```bash
npm run analyze-apk-size -- ./android/app/build/outputs/apk/release/app-release.apk
npm run analyze-apk-size -- --compare docs/apkSizeBaseline.json docs/apkSizeAfter.json
npm run find-unused-images
```

Bundletool (Jenkins uses `bundletool-all-1.11.2.jar`) lives under `tools/` locally (gitignored). `apkanalyzer` comes from the Android SDK cmdline-tools.

---

## Baseline (pre-change release APK)

| Metric | Value |
|--------|------:|
| File size | **136.06 MB** (142,667,236 bytes) |
| Download estimate (`apkanalyzer`) | 99.26 MB |
| Package | `co.edgesecure.app` |

### Compressed size by category

| Category | Compressed | Uncompressed |
|----------|----------:|-------------:|
| DEX (`classes*.dex`) | 41.84 MB | 41.84 MB |
| `lib/arm64-v8a` | 32.02 MB | 85.38 MB |
| `lib/armeabi-v7a` | 29.37 MB | 66.20 MB |
| `assets/index.android.bundle` (in assets root) | 11.43 MB | 11.43 MB |
| `assets/edge-currency-accountbased` | 6.20 MB | 28.24 MB |
| `assets/edge-core-js` | 4.23 MB | 12.94 MB |
| `assets/fonts` | 2.96 MB | 5.99 MB |
| `res/` | 2.50 MB | 2.84 MB |
| `resources.arsc` | 1.24 MB | 1.24 MB |
| Zcash sapling assets | 1.11 MB | 1.94 MB |
| ML Kit barcode models | 860 KB | 860 KB |
| Other plugin assets | ~1.6 MB | ~4.5 MB |

### Largest single entries (compressed)

| Entry | Compressed |
|-------|----------:|
| `lib/arm64-v8a/libzcashwalletsdk.so` | 12.88 MB |
| `lib/armeabi-v7a/libzcashwalletsdk.so` | 11.94 MB |
| `assets/index.android.bundle` (Hermes bytecode) | 11.42 MB |
| DEX shards (6×) | 41.84 MB total |
| `librnmonero.so` (both ABIs) | ~11.8 MB |
| `assets/.../edge-currency-accountbased.js` | 6.18 MB |
| `librnzano.so` (both ABIs) | ~8.1 MB |
| `go_conn.wasm` + `mix_fetch_wasm_bg.wasm` | ~4.03 MB |
| `libbarhopper_v3.so` (both ABIs) | ~3.7 MB |
| `libpiratewalletsdk.so` (both ABIs) | ~4.4 MB |

### DEX package rollup (defined bytecode)

| Package | Size |
|---------|-----:|
| **TOTAL** | **30.18 MB** |
| `com.google.*` | 8.04 MB |
| `androidx.*` | 5.14 MB |
| `kotlin*` | ~2.95 MB |
| `com.facebook.*` | 2.25 MB |
| `com.google.crypto` / Guava (`com.google.common`) | ~3.1 MB |
| `io.sentry*` | 1.29 MB |
| `cash.z.*` (Zcash) | 1.19 MB |
| `io.ktor` / `io.reactivex` / `io.grpc` | ~2.9 MB |
| `pirate.*` | ~0.67 MB |
| `com.google.firebase` | 0.24 MB |

R8 was previously **off** (`enableProguardInReleaseBuilds = false`), so this entire DEX surface shipped unshrunk.

---

## Phase 1 — Lossless

### 1.1 Enable R8 + resource shrinking — **IMPLEMENTED (needs smoke test)**

**Owning repo:** `edge-react-gui`  
**Changes:** [`android/app/build.gradle`](../android/app/build.gradle), [`android/app/proguard-rules.pro`](../android/app/proguard-rules.pro)

- `minifyEnabled true`, `shrinkResources true`
- Keep rules for RN/Hermes JNI, Firebase, Sentry, Zcash/Pirate protobuf-gRPC, Expo, VisionCamera, Reanimated
- First R8 pass failed on missing `kotlinx.datetime.*` refs from Pirate SDK; fixed with `-dontwarn` rules from AGP `missing_rules.txt`

| Item | Value |
|------|------:|
| Risk | **High** until full wallet smoke pass |
| Effort | Medium (rules iteration + QA) |
| **Measured** universal vs develop (authoritative) | **−8.30 MB** (−6.86 MB DEX Deflate) |
| Historical `assembleRelease` DEX-store savings | −18.64 MB (not the ship metric) |
| FontAwesome6 after clean rebuild | **−297 KB** confirmed |

**Smoke-test checklist before shipping:** login, create wallets (UTXO + account-based + Zcash + Monero + Pirate + Zano), send/receive, swap, camera QR scan, push notifications, Sentry breadcrumb on a forced error.

### 1.2 `resourceConfigurations` (locale trim) — **IMPLEMENTED**

Keeps `en, de, es, fr, it, ja, ko, pt, ru, vi, zh` matching `src/locales/strings`.

| Risk | Low |
| Effort | Low |
| Expected savings | **0.3–1.5 MB** compressed (AndroidX/Play translated resources) |

### 1.3 Filter unused vector-icon fonts — **IMPLEMENTED**

Dropped `FontAwesome6_{Solid,Brands,Regular}.ttf` (never imported from `src/`).

| Font | Compressed in baseline APK |
|------|--------------------------:|
| FontAwesome6_Solid | 161 KB |
| FontAwesome6_Brands | 111 KB |
| FontAwesome6_Regular | 25 KB |
| **Total measured** | **~297 KB** |

Further candidates (still imported by `VectorIcon.tsx` glyph map, but only `Feather` is passed at call sites): Fontisto (169 KB), Foundation (34 KB), Zocial (18 KB), Octicons (25 KB) ≈ **246 KB** more if `VectorIcon` is slimmed.

### 1.4 Delete unreferenced images — **IMPLEMENTED**

Import-graph scan (`npm run find-unused-images`) found **143 / 202** assets unused (~0.78 MB on disk). Removed:

- Entire legacy trees: `sidenav/`, `tabbar/`, `transactions/`, `MenuButton/`, `manageTokens/`, `createWallet/`, `otp/`, `slider/`
- Orphans: `shapeShiftLogo.png`, both tutorial GIFs (~767 KB), 14 unused root SVGs
- Theme dead property `walletListSlideTutorialImage` removed from `Theme` + four theme barrels

| Risk | Low (static import verification) |
| Effort | Low |
| APK savings | **~0.5–1.0 MB** inside Hermes bundle / drawable packing (GIFs dominated) |

Exact duplicates inside APK assets/libs: **none** found by sha256 scan of entries ≥8 KB.

### 1.5 Dead JS / unused npm deps — **PARTIAL**

| Action | Status | Notes |
|--------|--------|-------|
| knip unused dependencies | Ran | Flagged `posthog-js`, `url`, `assert`, others (some are Metro shims — treat carefully) |
| Removed `posthog-js` | **Done** | Zero `src/` imports; app uses `posthog-react-native` |
| Sourcemap attribution | **Done** | See `apkJsBundleAttribution.json` |
| Top JS contributors | Measured | app src 5.2 MB, RN 2.3 MB, `@sentry/*` ~2.4 MB, **date-fns 0.93 MB**, reanimated 0.76 MB, **moment 0.17 MB** (transitive) |

| Risk | Low for `posthog-js`; medium for broader knip cuts |
| Expected Hermes savings from dep hygiene | **0.2–1.5 MB** depending how aggressively date-fns / moment / Sentry replay are trimmed |

---

## Phase 2 — Near-lossless

### 2.1 Strip native symbols — **MEASURED: already stripped**

| Library (arm64) | Uncompressed | `strip -S` savings | `nm` |
|-----------------|-------------:|-------------------:|------|
| `libzcashwalletsdk.so` | 35.9 MB | **0** | no symbols |
| `librnmonero.so` | 15.3 MB | **0** | — |
| `librnzano.so` | 10.5 MB | **0** | — |
| `libpiratewalletsdk.so` | 4.6 MB | **0** | — |

**Verdict:** No win from post-processing strip. Remaining size is code + embedded proving params / tables inside the Rust SDKs. Further cuts require upstream build flags (`--release` LTO, feature gates) in `react-native-zcash` / monero / zano / piratechain.

### 2.2 `useLegacyPackaging true` — **EVALUATED, leave on for now**

Added historically for 16 KiB page-size alignment before AGP 8.5.1. Project is on **AGP 8.8.2**.

| Mode | Effect on universal APK file size | Install / page-align |
|------|-----------------------------------|----------------------|
| `useLegacyPackaging true` (current) | `.so` files stored compressed → **smaller APK**, larger on-disk extract | Legacy extract |
| `false` (modern default) | `.so` stored uncompressed / page-aligned → **larger APK**, better install | Preferred long-term |

**Verdict:** Turning it off would **increase** the universal APK we compare against. Keep `true` for the deploy.ts universal metric; revisit when Play Feature Delivery / uncompressed-lib installs are the primary concern.

### 2.3 Hermes bytecode — **VERIFIED**

`assets/index.android.bundle` magic: `Hermes JavaScript bytecode, version 96`. Not plain JS. No extra compression win here beyond dead-code / dependency cuts.

### 2.4 `wasm-opt -Oz` on Nym WASM — **MEASURED: negligible / blocked**

| File | Before | After `-Oz` | Notes |
|------|-------:|------------:|-------|
| `mix_fetch_wasm_bg.wasm` | 3,532,394 | 3,529,866 | **−2.5 KB (0.1%)** |
| `go_conn.wasm` | 9,316,964 | n/a | wasm-opt failed validation without `--enable-bulk-memory` |

**Verdict:** Not worth a Phase 2 pipeline. Prefer Phase 3 lazy download.

### 2.5 Image / GIF optimization — **MEASURED**

| Item | Finding |
|------|---------|
| PNG zlib recompress estimate | ~6% / **~86 KB** on remaining PNGs |
| Tutorial GIFs | Removed in Phase 1 (~767 KB disk) |
| WebP for gettingStarted USPs | Optional ~30–50% of ~719 KB set → **~0.2–0.4 MB** |

### 2.6 Compress `edge-currency-accountbased.js` at rest — **MEASURED**

| Form | Size |
|------|-----:|
| Raw JS in assets | 29.56 MB |
| gzip -9 | 6.42 MB |
| brotli q11 | 4.21 MB |
| Already in APK (Deflate) | 6.18 MB |

APK Deflate already captures most of the gzip win. Storing pre-compressed + inflating in the WebView would mainly help **install size / extract time**, not the universal APK zip size, unless the entry is stored uncompressed today (it is Deflate). **Low APK-file ROI**; still useful if moving the plugin off packaged assets onto CDN.

---

## Phase 3 — Aggressive

### 3.1 Lazy-load Nym WASM — **PROTOTYPED**

See [`scripts/nymWasmLazyLoadPrototype.ts`](../scripts/nymWasmLazyLoadPrototype.ts). Gate already exists: `privacy === 'nym'` in `edge-core-js` worker.

| Metric | Value |
|--------|------:|
| Compressed APK savings | **~4.03 MB** |
| Uncompressed | **12.85 MB** |
| Risk | Medium (offline / first-use download) |
| Owning repo | `edge-core-js` (webpack `CopyPlugin` + `nym.ts`) |

### 3.2 Deduplicate `edge-currency-accountbased` — **ANALYZED**

`package-lock.json` has **153** multi-version packages. Crypto-relevant duplicates:

| Package | Versions present |
|---------|------------------|
| `@noble/hashes` | 1.3.1, 1.3.2, 1.6.0, 1.6.1, 1.7.1, 1.8.0 |
| `@noble/curves` | 1.1.0, 1.7.0, 1.8.1, 1.9.7 |
| `axios` | 0.18.1, 0.21.4, 0.26.1, 1.13.5 |
| `bn.js` / `elliptic` / `secp256k1` | 2–3 each |
| `protobufjs` | 6.11.4, 7.2.6 |

Webpack already minifies with esbuild; bundle is **29.5 MB raw / 6.18 MB in APK**. A 20% raw reduction via overrides + per-chain splitting ≈ **~1.2 MB compressed** APK (more if chunks stay out of the base package).

| Risk | Medium–High (chain SDK semver) |
| Owning repo | `edge-currency-accountbased` |
| Expected compressed savings | **1–3 MB** with overrides; **3–6 MB** if unused chains become deferred chunks |

### 3.3 On-demand ML Kit (VisionCamera) — **ANALYZED**

`VisionCamera_enableCodeScanner=true` embeds:

| Entry | Compressed (both ABIs where applicable) |
|-------|----------------------------------------:|
| `libbarhopper_v3.so` | ~3.71 MB |
| `assets/mlkit_barcode_models` | 860 KB |
| DEX `mlkit_vision_barcode*` | ~0.5 MB |

| Risk | Medium (Play services delivery / API changes) |
| Expected savings | **~4–5 MB** compressed |
| Owning repo | `edge-react-gui` (`gradle.properties` + VisionCamera config) |

### 3.4 Cross-repo npm dedupe — **ANALYZED**

| Issue | Notes |
|-------|-------|
| `date-fns` + `dateformat` | Both used; date-fns alone is **0.93 MB** of sourcemap content |
| `url` + `url-parse` | Both present; knip marks `url` unused at app level |
| `moment` | 0.17 MB transitive in Hermes map — chase and replace |
| Guava 29 + `androidx.work` | Visible in DEX (~1.5 MB Guava); R8 should trim if not reflected |

### 3.5 Chain-native packaging / Play Feature Delivery — **PRODUCT DECISION**

arm64 alone:

| `.so` | Uncompressed |
|-------|-------------:|
| Zcash | 35.9 MB |
| Monero | 15.3 MB |
| Zano | 10.5 MB |
| Pirate | 4.6 MB |
| **Sum** | **66.3 MB** (~25 MB compressed both ABIs for these four) |

Deferred install modules could move most of that out of the base universal APK. Overlaps with 32-bit removal only on the armeabi-v7a copies.

---

## Overlap with 32-bit (`armeabi-v7a`) removal

| Category | armeabi-v7a compressed | Notes |
|----------|----------------------:|-------|
| All `lib/armeabi-v7a` | **29.37 MB** | Owned by the other agent |
| Of which Zcash+Monero+Zano+Pirate+barhopper | ~25 MB | Do **not** double-count with Phase 3 chain delivery |

This report’s Phase 1–3 totals below **exclude** the 29.37 MB ABI cut.

---

## Running total vs 20–30 MB target

**Headline metric** is the deploy.ts-style universal APK (`bundleRelease` → bundletool `--mode=universal`), compared **origin/develop vs Phase 1** on the same tip (2026-08-06). Exclude 32-bit removal.

| Phase | Candidate | Status | Universal APK savings |
|-------|-----------|--------|----------------------:|
| 1 | R8 + shrinkResources + locales | **Measured** | **−8.30 MB** total (see table below) |
| 1 | of which DEX (Deflate in universal) | Measured | **−6.86 MB** |
| 1 | of which `resources.arsc` + `res/` | Measured | **−1.13 MB** |
| 1 | Drop FontAwesome6 fonts | **Measured** (36 fonts, was 39) | **−297 KB** |
| 1 | Delete dead images / GIFs / theme | Implemented | ~0 in Hermes bytecode (assets were not in bundle) |
| 1 | Remove `posthog-js` | Done | negligible vs develop (already tiny) |
| 2 | Strip `.so` | No-op (already stripped) | **0** |
| 2 | wasm-opt | Negligible | **~0** |
| 2 | PNG / WebP | Optional | 0.1–0.4 MB |
| 3 | Lazy Nym WASM | Prototyped | **~4.0 MB** (still available) |
| 3 | accountbased dedupe / split | Analyzed | 1–6 MB |
| 3 | On-demand ML Kit | Analyzed | 4–5 MB |
| 3 | date-fns / moment trim | Analyzed | 0.5–1.0 MB |
| | **Phase 1 alone (universal, measured)** | | **−8.30 MB** |
| | **Phase 1 + Nym + ML Kit (stretch)** | | **~16–17 MB** |
| | **+ accountbased / JS / 32-bit** | | reaches 20–30+ MB |

**Verdict:** On the **production universal APK** path, Phase 1 saves **−8.30 MB** (110.88 → 102.59 MB), not the earlier −18.6 MB from `assembleRelease`. In universal APKs DEX is already Deflate-compressed (~15.4 MB vs ~42 MB store), so R8’s ~19 MB uncompressed DEX cut only yields ~6.9 MB on the zip. Hitting the 20–30 MB target still needs Phase 3 (Nym, ML Kit, accountbased) and/or the separate 32-bit ABI cut (−29 MB armeabi-v7a).

Recommended sequencing:

1. Land Phase 1 after fuller wallet smoke (launch + account creation already green).  
2. Implement Nym WASM lazy-load in `edge-core-js` (+~4 MB).  
3. Switch VisionCamera ML Kit to Play-delivered / on-demand (+4–5 MB).  
4. Start `edge-currency-accountbased` version overrides + per-chain chunks.  
5. Coordinate with the 32-bit removal agent so armeabi-v7a cuts are not double-counted.

### Follow-ups carried from the deprecated plan

- iOS `UIAppFonts` in [`ios/edge/Info.plist`](../ios/edge/Info.plist) still lists SourceSansPro / SF-UI-Text; FontAwesome6 was already absent from iOS. Android font filter does not need an iOS FontAwesome6 change.
- Orphaned `kaa.json` is already gone from this tree.

---

## Develop vs Phase 1 (measured 2026-08-06) — **authoritative**

Both artifacts: `./gradlew clean bundleRelease` + bundletool `--mode=universal`, signed with `airbitz.keystore`, tip `33a697ad3` (current `origin/develop`) ± Phase 1 WIP.

| Metric | develop baseline | Phase 1 | Delta |
|--------|-----------------:|--------:|------:|
| Universal APK file size | **110.88 MB** | **102.59 MB** | **−8.30 MB** |
| DEX (compressed in APK) | 15.40 MB | 8.53 MB | **−6.86 MB** |
| `resources.arsc` | 1.28 MB | 679 KB | **−627 KB** |
| `res/` | 2.53 MB | 2.01 MB | **−531 KB** |
| `assets/fonts` | 2.96 MB (39 files) | 2.67 MB (36 files) | **−297 KB** |

Machine-readable:

- [`apkSizeDevelopBaseline.json`](./apkSizeDevelopBaseline.json)
- [`apkSizeAfterPhase1.json`](./apkSizeAfterPhase1.json)
- APKs (gitignored): `docs/app-release-develop-baseline.apk`, `docs/app-release-phase1.apk`

```bash
npm run analyze-apk-size -- --compare docs/apkSizeDevelopBaseline.json docs/apkSizeAfterPhase1.json
```

### Smoke test (Pixel 10 `56131FDCR003LJ`)

| Check | Result |
|-------|--------|
| Install Phase 1 universal APK | Pass |
| Launch → welcome (no Oops!) | Pass (2×) |
| Create account through password + PIN + TOS | Pass |
| Wallet picker → enable Monero/Zcash/Zano → Assets | Pass (no Oops!; Pirate tap blocked by keyboard) |
| C000044 create-all-wallet-types | Fail (flaky 30s welcome timeout in nested `launch-cleared`; not an R8 crash) |
| Full automated wallet matrix / send-receive / QR / Sentry | **Not completed** — still recommended before shipping R8 |

Kotlin metadata R8 warnings still appear at build time (Kotlin newer than AGP 8.8.2’s R8). Local `bundleRelease` fails the task graph on `:uploadSentryProguardMappingsRelease` with placeholder `SENTRY_MAP_UPLOAD_URL`; the AAB is produced before that task — exclude the upload task or set real Sentry credentials.

---

## Historical: After R8 `assembleRelease` (measured 2026-08-05)

Earlier iteration used `assembleRelease` (DEX stored uncompressed). That overstated universal-APK savings:

| Metric | Aug 3 assembleRelease | After R8 assembleRelease | Delta |
|--------|----------------------:|-------------------------:|------:|
| APK file size | 136.06 MB | 117.42 MB | **−18.64 MB** |
| DEX (store / uncompressed) | 41.84 MB | 22.71 MB | **−19.13 MB** |

Machine-readable: [`apkSizeAfterR8.json`](./apkSizeAfterR8.json) vs [`apkSizeBaseline.json`](./apkSizeBaseline.json). Prefer the develop-vs-Phase1 universal table above for ship decisions.
