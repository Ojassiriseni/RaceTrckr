import type { NavigationAction, NavigationState, RouterBrowserHistoryAction } from '../react-navigation/routers';
import type { RouterRegistry } from './routerRegistry';
export type TreeNode = {
    state: NavigationState;
    parent?: TreeNode;
    parentRouteIndex?: number;
};
export type NavigationTreeIndex = {
    nodes: Map<string, TreeNode>;
    rootNode: TreeNode;
};
export type NavigationTreeReduction = {
    handled: false;
} | {
    handled: true;
    nextState: NavigationState;
    browserHistory?: RouterBrowserHistoryAction;
    affectedRouteKey: string | undefined;
};
export declare function indexNavigationTree(root: NavigationState): NavigationTreeIndex;
/**
 * The origin is the navigator where action handling starts before bubbling through its ancestors.
 * An explicit origin comes from the dispatching navigator; otherwise it is the deepest focused
 * navigator that has registered its router.
 */
export declare function resolveOrigin(rootNode: TreeNode, nodes: Map<string, TreeNode>, registry: RouterRegistry, originKey?: string): TreeNode | undefined;
export declare function reduceNavigationTree(action: NavigationAction, registry: RouterRegistry, { origin, tree }: {
    origin: TreeNode;
    tree: NavigationTreeIndex;
}): NavigationTreeReduction;
