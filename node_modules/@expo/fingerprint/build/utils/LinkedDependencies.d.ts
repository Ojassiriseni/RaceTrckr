/**
 * Create a test for a file of a dependency that the project declares and that lives outside
 * `node_modules`, such as a linked workspace package in a monorepo. The nearest `package.json`
 * above the file names its package. Lookups are cached per directory.
 */
export declare function createLinkedDependencyMatcher(projectRoot: string): (relativePosixPath: string) => boolean;
