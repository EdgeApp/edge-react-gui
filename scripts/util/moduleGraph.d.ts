/**
 * Types for `moduleGraph.js`, which is CommonJS JavaScript because
 * `scripts/cliNodeSafeSmoke.js` runs under plain Node with no sucrase.
 */
export declare const BUILTINS: Set<string>
export declare const CLI_ENTRIES: string[]
export declare const ROOT: string
export declare function packageOf(specifier: string): string
export declare function valueSpecifiers(file: string): string[]
export declare function walkGraph(entries: string[]): {
  /** Repo-relative, sorted. */
  modules: string[]
  packages: Set<string>
}
