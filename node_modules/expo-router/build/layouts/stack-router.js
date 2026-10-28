"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    StackRouter: null,
    stackRouterOverride: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get StackRouter () {
        return StackRouter;
    },
    get stackRouterOverride () {
        return stackRouterOverride;
    }
});
const _navigationParams = require("../navigationParams");
const _native = require("../react-navigation/native");
const _StackRouter = require("../react-navigation/routers/StackRouter");
const _attachRouteState = require("../react-navigation/routers/attachRouteState");
const _ensureStateType = require("../react-navigation/routers/ensureStateType");
const _stateKeys = require("../react-navigation/routers/stateKeys");
const _utils = require("../react-navigation/routers/utils");
const _getSingularId = require("../utils/getSingularId");
function isStackAction(action) {
    return action.type === 'PUSH' || action.type === 'NAVIGATE' || action.type === 'POP' || action.type === 'POP_TO_TOP' || action.type === 'REPLACE' || action.type === 'PRELOAD';
}
const getPreviewKey = (action)=>{
    const payload = action.payload;
    return payload && '__internal__PreviewKey' in payload && typeof payload.__internal__PreviewKey === 'string' ? payload.__internal__PreviewKey : undefined;
};
const getZoomTransitionIdFromAction = (action)=>{
    const allParams = !!action.payload && 'params' in action.payload && typeof action.payload.params === 'object' ? action.payload.params : undefined;
    const internalParams = (0, _navigationParams.getInternalExpoRouterParams)(allParams ?? undefined);
    const val = internalParams[_navigationParams.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
    if (val && typeof val === 'string') {
        return val;
    }
    return undefined;
};
const stackRouterOverride = (original)=>{
    return {
        getStateForAction: (state, action, options)=>{
            state = (0, _ensureStateType.ensureStateType)(state, 'stack');
            if (action.target && action.target !== state.key) {
                return _native.RouterActionHandling.Unhandled;
            }
            if (!isStackAction(action)) {
                return original.getStateForAction(state, action, options);
            }
            // The dynamic getId added to an action, `router.push('screen', { singular: true })`
            const actionSingularOptions = action.payload && 'singular' in action.payload ? action.payload.singular : undefined;
            // Handle if 'getID' or 'singular' is set.
            function getIdFunction() {
                // Actions can be fired by the user, so we do need to validate their structure.
                if (!('payload' in action) || !action.payload || !('name' in action.payload) || typeof action.payload.name !== 'string') {
                    return;
                }
                const actionName = action.payload.name;
                return(// The dynamic singular added to an action, `router.push('screen', { singular: () => 'id' })`
                getActionSingularIdFn(actionSingularOptions, actionName) || // The static getId added as a prop to `<Screen singular />` or `<Screen getId={} />`
                options.routeGetIdList[actionName]);
            }
            switch(action.type){
                case 'PUSH':
                case 'NAVIGATE':
                    {
                        if (!state.routeNames.includes(action.payload.name)) {
                            return _native.RouterActionHandling.Unhandled;
                        }
                        const getId = getIdFunction();
                        const id = getId?.({
                            params: action.payload.params
                        });
                        const activeRoutes = state.routes.slice(0, state.index + 1);
                        const preloadedRoutes = state.routes.slice(state.index + 1);
                        const previewKey = getPreviewKey(action);
                        const previewRoute = preloadedRoutes.find((route)=>route.key === previewKey && route.name === action.payload.name);
                        const currentRoute = activeRoutes[state.index];
                        const shouldCreateSingularRoute = action.type === 'NAVIGATE' && !previewRoute && id === undefined && currentRoute.name === action.payload.name && (0, _getSingularId.getSingularId)(currentRoute.name, {
                            params: currentRoute.params
                        }) !== (0, _getSingularId.getSingularId)(action.payload.name, {
                            params: action.payload.params
                        });
                        const routeGetIdList = {
                            ...options.routeGetIdList
                        };
                        if (getId) {
                            routeGetIdList[action.payload.name] = getId;
                        }
                        let actionResult;
                        if (previewRoute) {
                            // Native committed this exact React child. Name/getId matching can select a
                            // different preload after reopen, or an active route in a nested navigator.
                            const route = (0, _attachRouteState.attachRouteState)({
                                ...previewRoute,
                                path: (action.type === 'NAVIGATE' ? action.payload.path : undefined) ?? previewRoute.path,
                                params: {
                                    ...action.type === 'NAVIGATE' && action.payload.merge ? previewRoute.params : {},
                                    ...action.payload.params,
                                    [_navigationParams.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true
                                }
                            }, action);
                            actionResult = {
                                state: {
                                    ...state,
                                    index: activeRoutes.length,
                                    routes: activeRoutes.concat(route, preloadedRoutes.filter((r)=>r.key !== previewKey))
                                },
                                affectedRouteKey: route.key
                            };
                        } else if (shouldCreateSingularRoute) {
                            const minter = (0, _stateKeys.createRouteKeyMinter)(state);
                            const params = action.payload.merge ? {
                                ...currentRoute.params,
                                ...action.payload.params
                            } : action.payload.params;
                            const route = (0, _attachRouteState.attachRouteState)({
                                key: minter.mint(action.payload.name),
                                name: currentRoute.name,
                                path: action.payload.path ?? currentRoute.path,
                                params
                            }, action);
                            actionResult = {
                                state: {
                                    ...state,
                                    routeKeySeq: minter.routeKeySeq,
                                    index: activeRoutes.length,
                                    routes: activeRoutes.concat(route, preloadedRoutes)
                                },
                                affectedRouteKey: route.key,
                                browserHistory: {
                                    type: 'push'
                                }
                            };
                        } else {
                            actionResult = original.getStateForAction(state, action, {
                                ...options,
                                routeGetIdList
                            });
                        }
                        if (!(0, _utils.isActionHandled)(actionResult)) {
                            return actionResult;
                        }
                        const affectedRouteKey = actionResult.affectedRouteKey;
                        const result = actionResult.state;
                        if (actionSingularOptions) {
                            const filteredState = filterSingular(result, getId);
                            return {
                                ...actionResult,
                                state: filteredState,
                                browserHistory: (0, _StackRouter.getStackBrowserHistoryAction)(state, filteredState, action)
                            };
                        }
                        const zoomTransitionId = getZoomTransitionIdFromAction(action);
                        if (zoomTransitionId) {
                            const lastRoute = result.routes[result.index];
                            const modifiedLastRoute = {
                                ...lastRoute,
                                params: {
                                    ...lastRoute.params,
                                    [_navigationParams.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: affectedRouteKey
                                }
                            };
                            return {
                                ...actionResult,
                                state: {
                                    ...result,
                                    routes: result.routes.map((route, index)=>index === result.index ? modifiedLastRoute : route)
                                },
                                affectedRouteKey
                            };
                        }
                        return actionResult;
                    }
                case 'PRELOAD':
                    {
                        if (!state.routeNames.includes(action.payload.name)) {
                            return _native.RouterActionHandling.Unhandled;
                        }
                        const actionResult = original.getStateForAction(state, action, options);
                        if (!(0, _utils.isActionHandled)(actionResult)) {
                            return actionResult;
                        }
                        const affectedRouteKey = actionResult.affectedRouteKey;
                        const affectedIndex = actionResult.state.routes.findIndex((route)=>route.key === affectedRouteKey);
                        const preloadZoomTransitionId = getZoomTransitionIdFromAction(action);
                        let routes = actionResult.state.routes;
                        if (affectedIndex > state.index + 1) {
                            const affectedRoute = routes[affectedIndex];
                            routes = routes.toSpliced(affectedIndex, 1).toSpliced(state.index + 1, 0, affectedRoute);
                        }
                        if (preloadZoomTransitionId) {
                            routes = routes.map((route)=>route.key === affectedRouteKey ? {
                                    ...route,
                                    params: {
                                        ...route.params,
                                        [_navigationParams.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: affectedRouteKey
                                    }
                                } : route);
                        }
                        return {
                            ...actionResult,
                            state: routes === actionResult.state.routes ? actionResult.state : {
                                ...actionResult.state,
                                routes
                            },
                            affectedRouteKey
                        };
                    }
                default:
                    {
                        return original.getStateForAction(state, action, options);
                    }
            }
        }
    };
};
function getActionSingularIdFn(actionGetId, name) {
    if (typeof actionGetId === 'function') {
        return (options)=>actionGetId(name, options.params ?? {});
    } else if (actionGetId === true) {
        return (options)=>(0, _getSingularId.getSingularId)(name, options);
    }
    return undefined;
}
/**
 * If there is a dynamic singular on an action, then we need to filter the state to only have singular screens.
 * As multiples may have been added before we did the singular navigation.
 */ function filterSingular(state, getId) {
    if (!state) {
        return state;
    }
    if (!state.routes) {
        return state;
    }
    // TODO(@kitten): This looks wrong as it's defaulting `index === 0`
    const currentIndex = state.index ?? state.routes.length - 1;
    const activeRoutes = state.routes.slice(0, currentIndex + 1);
    const preloadedRoutes = state.routes.slice(currentIndex + 1);
    const current = activeRoutes[currentIndex];
    const name = current.name;
    const id = getId?.({
        params: current.params
    });
    if (!id) {
        return state;
    }
    // TypeScript needs a type assertion here for the filter to work.
    let routes = activeRoutes;
    routes = routes.filter((route, index)=>{
        // If the route is the current route, keep it.
        if (index === currentIndex) {
            return true;
        }
        // Remove all other routes with the same name and id.
        return name !== route.name || id !== getId?.({
            params: route.params
        });
    });
    return {
        ...state,
        index: routes.length - 1,
        // Filtering preserves the input state's route type even though TypeScript widens it to partial routes.
        routes: [
            ...routes,
            ...preloadedRoutes
        ]
    };
}
const StackRouter = (0, _native.extendRouter)(_native.StackRouter, ({ baseRouter })=>stackRouterOverride(baseRouter));

//# sourceMappingURL=stack-router.js.map
