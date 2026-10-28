"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    completeNavigationState: null,
    completeParsedState: null,
    createSeededNavigationState: null,
    createSeededRootState: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get completeNavigationState () {
        return completeNavigationState;
    },
    get completeParsedState () {
        return completeParsedState;
    },
    get createSeededNavigationState () {
        return createSeededNavigationState;
    },
    get createSeededRootState () {
        return createSeededRootState;
    }
});
const _Route = require("../Route");
const _constants = require("../constants");
const _createInitialState = require("../react-navigation/core/createInitialState");
const _stateKeys = require("../react-navigation/routers/stateKeys");
const _routeNode = require("../routeNode");
const _utils = require("./utils");
function createSeededRootState(targetState, rootRouteNode) {
    return createSeededState({
        targetState,
        routeNames: (0, _utils.getRootStackRouteNames)(),
        initialRouteName: undefined,
        anchorParams: undefined,
        parentChain: _stateKeys.ROOT_CHAIN,
        findChildNode: (routeName)=>routeName === _constants.INTERNAL_SLOT_NAME ? rootRouteNode : undefined
    });
}
function completeNavigationState(state, rootRouteNode) {
    return completeExistingState(state, (0, _utils.getRootStackRouteNames)(), _stateKeys.ROOT_CHAIN, (routeName)=>routeName === _constants.INTERNAL_SLOT_NAME ? rootRouteNode : undefined);
}
function completeParsedState(targetState, parentChain) {
    if (!targetState) {
        return undefined;
    }
    const key = targetState.key ?? (0, _stateKeys.createNavigatorStateKey)(parentChain);
    const minter = (0, _stateKeys.createRouteKeyMinter)({
        key,
        routeKeySeq: targetState.routeKeySeq ?? 0
    });
    const routes = targetState.routes.map((route)=>{
        const routeKey = route.key ?? minter.mint(route.name);
        return {
            ...route,
            key: routeKey,
            ...route.state ? {
                state: completeParsedState(route.state, (0, _stateKeys.getChainFromRouteKey)(routeKey))
            } : undefined
        };
    });
    return {
        ...targetState,
        stale: false,
        key,
        routeKeySeq: minter.routeKeySeq,
        index: targetState.index ?? routes.length - 1,
        routeNames: targetState.routeNames ?? [
            ...new Set(routes.map((route)=>route.name))
        ],
        routes
    };
}
function createSeededNavigationState(targetState, routeNode, parentChain, anchorParams) {
    const initialRouteName = (0, _routeNode.getValidInitialRouteName)(routeNode);
    const routeNames = [
        ...routeNode.children
    ].sort((0, _Route.sortRoutesWithInitial)(initialRouteName)).map((child)=>child.route);
    return createSeededState({
        targetState,
        routeNames,
        initialRouteName,
        anchorParams,
        parentChain,
        findChildNode: (routeName)=>(0, _routeNode.findRouteNodeByName)(routeNode, routeName)
    });
}
// TODO(@ubax): consider replacing findChildNode here and in other places
// by passing the node directly
function completeExistingState(state, fallbackRouteNames, parentChain, findChildNode) {
    const key = state.key ?? (0, _stateKeys.createNavigatorStateKey)(parentChain);
    const minter = (0, _stateKeys.createRouteKeyMinter)({
        key,
        routeKeySeq: state.routeKeySeq ?? 0
    });
    let routesChanged = false;
    const routes = state.routes.map((route)=>{
        const childNode = findChildNode(route.name);
        const routeKey = route.key ?? minter.mint(route.name);
        // `PartialState` keeps the route union partial after the key check, but this branch proves it is complete.
        const completeRoute = route.key === undefined ? {
            ...route,
            key: routeKey
        } : route;
        if (route.key === undefined) {
            routesChanged = true;
        }
        if (!childNode || childNode.children.length === 0) {
            return completeRoute;
        }
        const initialRouteName = (0, _routeNode.getValidInitialRouteName)(childNode);
        const childRouteNames = [
            ...childNode.children
        ].sort((0, _Route.sortRoutesWithInitial)(initialRouteName)).map((child)=>child.route);
        const childState = route.state ? completeExistingState(route.state, childRouteNames, (0, _stateKeys.getChainFromRouteKey)(routeKey), (routeName)=>(0, _routeNode.findRouteNodeByName)(childNode, routeName)) : createSeededNavigationState(undefined, childNode, (0, _stateKeys.getChainFromRouteKey)(routeKey));
        if (childState === route.state && routeKey === route.key) {
            return completeRoute;
        }
        routesChanged = true;
        return {
            ...completeRoute,
            state: childState
        };
    });
    if (!routesChanged && state.stale === false && state.key !== undefined && state.routeKeySeq === minter.routeKeySeq && state.index !== undefined && state.routeNames !== undefined) {
        return state;
    }
    return {
        ...state,
        stale: false,
        key,
        routeKeySeq: minter.routeKeySeq,
        index: state.index ?? routes.length - 1,
        routeNames: state.routeNames ?? fallbackRouteNames,
        routes
    };
}
function createSeededState({ targetState, routeNames, initialRouteName, anchorParams, parentChain, findChildNode }) {
    const initialState = (0, _createInitialState.createInitialState)({
        routeNames: [],
        parentChain
    });
    let targetRoutes = targetState?.routes ?? [];
    const unknownRoute = targetRoutes.find((route)=>!routeNames.includes(route.name));
    if (unknownRoute) {
        console.warn(`The initial navigation state contains the unknown route "${unknownRoute.name}". The route is not registered by its navigator, so Expo Router will use the navigator's initial route instead. Check that your linking configuration only returns registered routes.`);
        targetRoutes = [];
    }
    const routesToCreate = getRoutesToCreate(targetRoutes, routeNames, initialRouteName, anchorParams);
    const minter = (0, _stateKeys.createRouteKeyMinter)(initialState);
    const routes = routesToCreate.map((targetRoute)=>{
        const key = minter.mint(targetRoute.name);
        const childNode = findChildNode(targetRoute.name);
        const childState = childNode && childNode.children.length > 0 ? createSeededNavigationState('state' in targetRoute ? targetRoute.state : undefined, childNode, (0, _stateKeys.getChainFromRouteKey)(key), 'params' in targetRoute ? targetRoute.params : undefined) : undefined;
        return {
            key,
            name: targetRoute.name,
            ...'path' in targetRoute ? {
                path: targetRoute.path
            } : undefined,
            ...'params' in targetRoute ? {
                params: targetRoute.params
            } : undefined,
            ...childState ? {
                state: childState
            } : undefined
        };
    });
    let index = -1;
    if (targetRoutes.length > 0) {
        // The anchor added in front of the target routes moves the focused route by one.
        const addedAnchorCount = routes.length - targetRoutes.length;
        index = addedAnchorCount + (targetState?.index ?? targetRoutes.length - 1);
    } else if (routes.length > 0) {
        index = 0;
    }
    return {
        ...initialState,
        routeKeySeq: minter.routeKeySeq,
        routeNames,
        index,
        routes
    };
}
/**
 * Returns the target routes with the anchor in front of them, so Back can return to the anchor.
 * Without target routes, returns only the anchor, or the first route when there is no anchor.
 */ function getRoutesToCreate(targetRoutes, routeNames, initialRouteName, anchorParams) {
    if (targetRoutes.length === 0) {
        const defaultRouteName = initialRouteName ?? routeNames[0];
        if (defaultRouteName === undefined) {
            return [];
        }
        return [
            {
                name: defaultRouteName
            }
        ];
    }
    if (initialRouteName && !targetRoutes.some((route)=>route.name === initialRouteName)) {
        return [
            {
                name: initialRouteName,
                params: anchorParams
            },
            ...targetRoutes
        ];
    }
    return targetRoutes;
}

//# sourceMappingURL=createSeededNavigationState.js.map
