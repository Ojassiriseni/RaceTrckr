export declare function swiftExpandCommand(argv: string[]): Promise<void>;
export declare function swiftCheckCommand(argv: string[]): Promise<void>;
/**
 * The directory to find the macros from: the first path, or the directory of a file. The macros
 * resolve through `node_modules` above it, so any directory in the module package works.
 */
export declare function packageDirectoryOf(sourcePath: string): string;
