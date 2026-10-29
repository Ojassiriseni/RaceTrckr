/** The options of the `expand` subcommand of the Expo Modules binary. */
export type ExpandArgs = {
    paths: string[];
    symbols?: string[];
    json?: boolean;
    diagnosticsOnly?: boolean;
};
/** The arguments for `expand`, with the paths last, because the binary has no `--` separator. */
export declare function buildExpandArgs({ paths, symbols, json, diagnosticsOnly, }: ExpandArgs): string[];
/**
 * The Expo Modules executable of the `expo-modules-macros` version that the module at `packageDir`
 * compiles with. That version must have `expand`, which `expo-modules-macros` 0.27.0 added.
 */
export declare function resolveExpandBinary(packageDir: string): string;
/**
 * Runs `expand` with the Expo Modules executable at `binaryPath`. Its output goes to this
 * process's stdout and stderr as it is, and the promise resolves with its exit code: `0`, `1` for an
 * error diagnostic (as text), or `2` for a usage error.
 */
export declare function runExpand(binaryPath: string, args: string[]): Promise<number>;
