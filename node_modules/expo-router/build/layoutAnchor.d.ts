import type { RouteNode } from './Route';
/**
 * Returns the route name of the layout's anchor. In async import mode, a layout that is not
 * loaded yet has no known anchor; the read starts its download and records it as missing.
 */
export declare function getLayoutAnchor(node: RouteNode): string | undefined;
/**
 * Runs `fn` and returns the layouts whose anchors it needed but could not read.
 * Layouts in `skipped` failed to load, so their anchors are skipped without recording them.
 */
export declare function collectMissingLayouts<T>(fn: () => T, skipped?: ReadonlySet<RouteNode>): {
    value: T;
    missing: RouteNode[];
};
/** Loads the layouts and returns the ones that failed to load. */
export declare function loadLayouts(nodes: RouteNode[]): Promise<RouteNode[]>;
/** Runs `fn` again after each load until no layout it needs is missing. */
export declare function withLoadedLayouts<T>(fn: () => T, skipped?: ReadonlySet<RouteNode>): T | Promise<T>;
