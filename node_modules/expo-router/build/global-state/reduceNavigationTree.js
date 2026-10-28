"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    indexNavigationTree: null,
    reduceNavigationTree: null,
    resolveOrigin: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get indexNavigationTree () {
        return indexNavigationTree;
    },
    get reduceNavigationTree () {
        return reduceNavigationTree;
    },
    get resolveOrigin () {
        return resolveOrigin;
    }
});
const _utils = require("../react-navigation/routers/utils");
function indexNavigationTree(root) {
    // Index parent links once so finding a handler and rebuilding its ancestors don't rescan the tree.
    assertCompleteState(root);
    const nodes = new Map();
    const indexState = (state, parent, parentRouteIndex)=>{
        const node = {
            state,
            parent,
            parentRouteIndex
        };
        nodes.set(state.key, node);
        state.routes.forEach((route, index)=>{
            if (route.state) {
                assertCompleteState(route.state);
                indexState(route.state, node, index);
            }
        });
        return node;
    };
    return {
        nodes,
        rootNode: indexState(root)
    };
}
function resolveOrigin(rootNode, nodes, registry, originKey) {
    if (originKey !== undefined) {
        const origin = nodes.get(originKey);
        return origin && registry.has(origin.state.key) ? origin : undefined;
    }
    let origin;
    let current = rootNode;
    while(current){
        if (registry.has(current.state.key)) {
            origin = current;
        }
        // `indexNavigationTree` already proved every nested state is complete.
        const focusedState = current.state.routes[current.state.index]?.state;
        current = focusedState ? nodes.get(focusedState.key) : undefined;
    }
    return origin;
}
function findActionHandler(origin, nodes, action, registry) {
    let handler;
    const attempt = (node)=>{
        const entry = registry.get(node.state.key);
        if (!entry) {
            return false;
        }
        const reduced = entry.reduce(node.state, action);
        const result = (0, _utils.isActionHandled)(reduced) ? reduced : undefined;
        // Unsupported untargeted actions bubble. An action explicitly addressed to this navigator
        // stops here as a handled no-op instead of escaping to another navigator.
        if (!result && action.target !== node.state.key) {
            return false;
        }
        const nextSlice = result?.state ?? node.state;
        handler = {
            node,
            nextSlice,
            browserHistory: result?.browserHistory,
            shouldFocus: entry.shouldActionChangeFocus?.(action) ?? false,
            affectedRouteKey: result?.affectedRouteKey
        };
        return true;
    };
    if (typeof action.target === 'string') {
        const target = nodes.get(action.target);
        return target && attempt(target) ? handler : undefined;
    }
    for(let node = origin; node; node = node.parent){
        if (attempt(node)) {
            return handler;
        }
    }
    return undefined;
}
function rebuildTreeWithSlice(handler, registry) {
    let browserHistory = handler.browserHistory;
    let nextState = handler.nextSlice;
    let child = handler.node;
    while(child.parent){
        const parent = child.parent;
        const routeIndex = child.parentRouteIndex;
        const route = parent.state.routes[routeIndex];
        let nextParent = route.state === nextState ? parent.state : {
            ...parent.state,
            routes: parent.state.routes.map((item, index)=>index === routeIndex ? {
                    ...item,
                    state: nextState
                } : item)
        };
        if (handler.shouldFocus) {
            const entry = registry.get(parent.state.key);
            if (entry?.getStateForRouteFocus) {
                const previousParent = nextParent;
                nextParent = entry.getStateForRouteFocus(nextParent, route.key);
                const focusHistory = entry.getBrowserHistoryForRouteFocus?.(previousParent, nextParent, browserHistory);
                browserHistory = focusHistory ?? browserHistory;
            }
        }
        nextState = nextParent;
        child = parent;
    }
    return {
        nextState,
        ...browserHistory && {
            browserHistory
        }
    };
}
function reduceNavigationTree(action, registry, { origin, tree }) {
    const handler = findActionHandler(origin, tree.nodes, action, registry);
    if (!handler) {
        return {
            handled: false
        };
    }
    return {
        handled: true,
        ...rebuildTreeWithSlice(handler, registry),
        affectedRouteKey: handler.affectedRouteKey
    };
}
function assertCompleteState(state) {
    if (state.stale !== false) {
        throw new Error('Cannot reduce a stale navigation state. Expo Router requires a complete state tree before handling actions, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.');
    }
}

//# sourceMappingURL=reduceNavigationTree.js.map
