import type * as Macros from 'expo-modules-macros';
/** The `expo-modules-macros` package: the scanner wrapper and the scanner it ships. */
export type MacrosPackage = typeof Macros;
/**
 * The `scan-exports` schema version this CLI renders. It must match the macros version the CLI is
 * built and tested against (the one `expo-modules-core` in this repository depends on); a test
 * keeps the two in sync.
 */
export declare const SCAN_EXPORTS_SCHEMA_VERSION = 10;
/** The `expo-modules-macros` package that a package compiles with, and where it is installed. */
export type ResolvedMacros = {
    macros: MacrosPackage;
    root: string;
    version: string;
};
/**
 * Loads the `expo-modules-macros` package that the `expo-modules-core` of the package at
 * `packageDir` depends on. `packageDir` can also be any directory inside that package.
 */
export declare function loadMacros(packageDir: string): ResolvedMacros;
/**
 * Loads the `expo-modules-macros` package that the `expo-modules-core` of the scanned package
 * depends on, and checks that it reports the schema this CLI renders.
 */
export declare function resolveMacros(packageDir: string): MacrosPackage;
