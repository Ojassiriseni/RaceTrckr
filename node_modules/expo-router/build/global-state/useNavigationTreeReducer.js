'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    replaceNavigationState: null,
    useNavigationTreeReducer: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get replaceNavigationState () {
        return replaceNavigationState;
    },
    get useNavigationTreeReducer () {
        return useNavigationTreeReducer;
    }
});
function _nonsecure() {
    const data = require("nanoid/non-secure");
    _nonsecure = function() {
        return data;
    };
    return data;
}
function _react() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react"));
    _react = function() {
        return data;
    };
    return data;
}
const _layoutAnchor = require("../layoutAnchor");
const _navigationParams = require("../navigationParams");
const _deepFreeze = require("../react-navigation/core/deepFreeze");
const _stateKeys = require("../react-navigation/routers/stateKeys");
const _useLatestCallback = /*#__PURE__*/ _interop_require_default(require("../utils/useLatestCallback"));
const _browserHistory = require("./browserHistory");
const _createSeededNavigationState = require("./createSeededNavigationState");
const _getNavigationAction = require("./getNavigationAction");
const _reduceNavigationTree = require("./reduceNavigationTree");
const _routingQueue = require("./routingQueue");
const _stateUtils = require("./stateUtils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// React IDs can repeat after a reload; the session prefix keeps old browser entries distinct.
const browserHistorySessionId = (0, _nonsecure().nanoid)();
const ACTIONS_WITHOUT_REMOVAL_PREVENTION = new Set([
    'ROUTE_NAMES_CHANGED'
]);
function warnIfStaleState(state) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    let focusedState = state;
    while(focusedState){
        if (focusedState.stale || focusedState.index === undefined) {
            console.error('Detected stale state. This is likely a bug in Expo Router.');
            return;
        }
        focusedState = focusedState.routes[focusedState.index]?.state;
    }
}
function navigationTreeReducer(result, operation, config) {
    if (operation.type === 'RESUME') {
        if (!result.deferred) {
            return result;
        }
        // Replays go through the same path, so an operation that needs another layout waits again.
        const failed = new Set(operation.failed);
        return result.deferred.operations.reduce((current, deferred)=>reduceQueuedOperation(current, deferred, config, failed), {
            ...result,
            deferred: undefined
        });
    }
    if (operation.type === 'BROWSER_HISTORY_CHANGED') {
        const { commitedTreeResult, ...change } = operation;
        // Waiting operations never reached the screen or the browser, so the browser change drops them.
        result = commitedTreeResult ? {
            ...commitedTreeResult,
            eventSeq: result.eventSeq,
            deferred: undefined
        } : {
            ...result,
            deferred: undefined
        };
        return reduceQueuedOperation(result, change, config);
    }
    if ('deferrable' in operation && operation.deferrable) {
        return reduceQueuedOperation(result, operation, config);
    }
    const { value, missing } = (0, _layoutAnchor.collectMissingLayouts)(()=>reduceOperation(result, operation, config));
    if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
        // TODO(@ubax): move console side effects out of the reducer.
        console.warn(`Expo Router handled "${operation.type === 'ACTION' ? operation.payload.action.type : operation.type}" before the layouts ${missing.map((node)=>`"${node.contextKey}"`).join(', ')} loaded, so their \`unstable_settings.anchor\` is skipped.`);
    }
    return value;
}
function reduceQueuedOperation(result, operation, config, failedLayouts) {
    const inTransition = operation.deferrable?.inTransition ?? false;
    if (result.deferred) {
        const { operations, missing } = result.deferred;
        return {
            ...result,
            deferred: {
                operations: [
                    ...operations,
                    operation
                ],
                missing,
                inTransition: result.deferred.inTransition && inTransition
            }
        };
    }
    const { value, missing } = (0, _layoutAnchor.collectMissingLayouts)(()=>reduceOperation(result, operation, config), failedLayouts);
    if (missing.length === 0) {
        return value;
    }
    // TODO(@ubax): show a pending UI or a Suspense fallback while the layout chunk loads.
    return {
        ...result,
        deferred: {
            operations: [
                operation
            ],
            missing,
            inTransition
        }
    };
}
// Browser changes restore a saved navigation state. Other operations update navigation first,
// then queue the matching browser command to run after React commits.
function reduceOperation(result, operation, config) {
    if (operation.type === 'BROWSER_HISTORY_CHANGED') {
        if (!result.history) {
            return result;
        }
        const restored = (0, _browserHistory.restoreNavigationFromBrowser)(result.history, result, operation.payload, config, (current, intent)=>reduceTree(current, {
                ...intent,
                actionId: operation.actionId
            }, config));
        return appendReportEvents({
            ...restored.result,
            history: restored.history
        }, restored.events);
    }
    const next = reduceTree({
        ...result,
        browserHistoryAction: undefined
    }, operation, config);
    if (next.state === result.state || !next.history) {
        return next;
    }
    // Structural repairs are not navigations, so they never move the browser.
    const projected = operation.type === 'NAVIGATOR_UNMOUNTED' || operation.type === 'NAVIGATOR_CHANGED' ? (0, _browserHistory.updateCurrentHistoryEntry)(next.history, next.state, config) : (0, _browserHistory.applyRouterHistoryAction)(next.history, next.state, config, next.browserHistoryAction);
    return appendReportEvents({
        ...next,
        history: projected.history
    }, projected.events);
}
// Browser changes are handled above because they restore tracked history and may call this
// helper with a generated navigation intent. Excluding them prevents a recursive restore.
function reduceTree(result, operation, config) {
    const state = result.state;
    switch(operation.type){
        case 'NAVIGATE_TO_HREF':
            {
                const { href, options } = operation.payload;
                let resolution;
                try {
                    resolution = (0, _getNavigationAction.getNavigateAction)(href, options, config, options.event, options.withAnchor, options.dangerouslySingular, options.__internal__PreviewKey, state);
                } catch (error) {
                    const message = typeof error === 'object' && error != null && 'message' in error ? error.message : error;
                    // TODO(@ubax): move console side effects out of the reducer.
                    console.warn(`An error occurred when trying to handle navigation action ${JSON.stringify(operation)}: ${message}`);
                    return result;
                }
                if (resolution.status === 'invalid') {
                    const invalidHref = operation.payload.originalHref ?? resolution.href;
                    // TODO(@ubax): move console side effects out of the reducer.
                    console.warn(`Could not generate a valid navigation state for the given path: ${invalidHref}`);
                    return result;
                }
                return reduceTree(result, {
                    type: 'ACTION',
                    payload: {
                        action: resolution.action
                    },
                    actionId: operation.actionId
                }, config);
            }
        case 'COMPUTED_ACTION':
            {
                let action;
                try {
                    action = operation.payload.compute(state, config.registry);
                } catch (error) {
                    const message = typeof error === 'object' && error != null && 'message' in error ? error.message : error;
                    // TODO(@ubax): move console side effects out of the reducer.
                    console.warn(`An error occurred when trying to handle navigation action ${JSON.stringify(operation)}: ${message}`);
                    return result;
                }
                if (!action) {
                    return result;
                }
                return reduceTree(result, {
                    type: 'ACTION',
                    payload: {
                        action,
                        originKey: operation.payload.originKey
                    },
                    actionId: operation.actionId
                }, config);
            }
        case 'ACTION':
            {
                const tree = (0, _reduceNavigationTree.indexNavigationTree)(state);
                const origin = (0, _reduceNavigationTree.resolveOrigin)(tree.rootNode, tree.nodes, config.registry, operation.payload.originKey);
                if (!origin) {
                    return reportUnhandledAction(result, operation.payload.action);
                }
                const reduction = (0, _reduceNavigationTree.reduceNavigationTree)(operation.payload.action, config.registry, {
                    origin,
                    tree
                });
                if (!reduction.handled) {
                    return reportUnhandledAction(result, operation.payload.action);
                }
                const nextState = config.routeNode ? (0, _createSeededNavigationState.completeNavigationState)(reduction.nextState, config.routeNode) : reduction.nextState;
                if (nextState === state) {
                    return result;
                }
                const removedRoutes = getRemovedRouteKeys(state, nextState);
                const preventedRoutes = ACTIONS_WITHOUT_REMOVAL_PREVENTION.has(operation.payload.action.type) ? [] : removedRoutes.filter((routeKey)=>config.routesWithRemovalPrevented.has(routeKey));
                const committedState = preventedRoutes.length > 0 ? state : (0, _deepFreeze.deepFreeze)(nextState);
                // TODO(@ubax): add dev-only diagnostics to events for dev-tools.
                const eventsWithoutIds = preventedRoutes.length > 0 ? [
                    {
                        type: 'prevented-routes',
                        routeKeys: preventedRoutes,
                        action: operation.payload.action
                    }
                ] : [
                    ...removedRoutes.length > 0 ? [
                        {
                            type: 'removed-routes',
                            routeKeys: removedRoutes,
                            action: operation.payload.action
                        }
                    ] : [],
                    ...operation.payload.action.type === 'PRELOAD' && reduction.affectedRouteKey !== undefined ? [
                        {
                            type: 'route-preloaded',
                            routeKey: reduction.affectedRouteKey,
                            state: committedState
                        }
                    ] : [],
                    {
                        type: 'action-dispatched',
                        action: operation.payload.action,
                        state: committedState,
                        actionId: operation.actionId
                    }
                ];
                return appendReportEvents({
                    ...result,
                    state: committedState,
                    browserHistoryAction: reduction.browserHistory
                }, eventsWithoutIds);
            }
        case 'NAVIGATOR_UNMOUNTED':
            {
                // A still-registered key re-registered before this operation reduced, so it did not unmount.
                if (config.registry.has(operation.stateKey) || !(0, _stateUtils.findStateByKey)(state, operation.stateKey)) {
                    return result;
                }
                const replacement = (0, _createSeededNavigationState.createSeededNavigationState)(undefined, operation.routeNode, (0, _stateKeys.getChainFromStateKey)(operation.stateKey));
                const nextState = replaceNavigationState(state, operation.stateKey, replacement);
                const completeState = config.routeNode ? (0, _createSeededNavigationState.completeNavigationState)(nextState, config.routeNode) : nextState;
                return {
                    ...result,
                    state: (0, _deepFreeze.deepFreeze)(completeState)
                };
            }
        case 'NAVIGATOR_CHANGED':
            {
                const navigatorState = (0, _stateUtils.findStateByKey)(state, operation.stateKey);
                if (!navigatorState) {
                    return result;
                }
                const replacement = (0, _stateUtils.resetNavigatorState)(navigatorState, operation.routerType);
                const nextState = replaceNavigationState(state, operation.stateKey, replacement);
                const completeState = config.routeNode ? (0, _createSeededNavigationState.completeNavigationState)(nextState, config.routeNode) : nextState;
                return {
                    ...result,
                    state: (0, _deepFreeze.deepFreeze)(completeState)
                };
            }
        case 'REPORT_CONSUMED':
            {
                if (!result.report) {
                    return result;
                }
                const consumedIds = new Set(operation.eventIds);
                const events = result.report.events.filter((event)=>!consumedIds.has(event.id));
                if (events.length === result.report.events.length) {
                    return result;
                }
                return {
                    ...result,
                    report: events.length > 0 ? {
                        events
                    } : undefined
                };
            }
    }
}
function reportUnhandledAction(result, action) {
    return process.env.NODE_ENV === 'production' ? result : appendReportEvents(result, [
        {
            type: 'unhandled-action',
            action
        }
    ]);
}
function appendReportEvents(result, events) {
    if (events.length === 0) {
        return result;
    }
    const eventsWithIds = events.map((event, index)=>({
            ...event,
            id: result.eventSeq + index
        }));
    return {
        ...result,
        report: {
            events: result.report ? [
                ...result.report.events,
                ...eventsWithIds
            ] : eventsWithIds
        },
        eventSeq: result.eventSeq + eventsWithIds.length
    };
}
function useNavigationTreeReducer({ initialState, routeNode, registry, routesWithRemovalPrevented = EMPTY_SET, linking, redirects }) {
    const browserHistoryIdPrefix = `${browserHistorySessionId}:${_react().useId()}`;
    const config = {
        registry,
        routesWithRemovalPrevented,
        routeNode,
        linking,
        redirects,
        browserHistoryIdPrefix
    };
    const [result, reactDispatch] = _react().useReducer((result, operation)=>navigationTreeReducer(result, operation, config), initialState, (value)=>{
        validateInitialState(value);
        if (value == null) {
            throw new Error('The navigation container is missing its initial state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.');
        }
        // TODO(@ubax): check if deepFreeze is needed here.
        const state = (0, _deepFreeze.deepFreeze)(value);
        const initial = (0, _browserHistory.createBrowserHistory)(state, config);
        return appendReportEvents({
            state,
            report: undefined,
            eventSeq: 0,
            history: initial.history
        }, initial.events);
    });
    const [previousRegistry, setPreviousRegistry] = _react().useState(registry);
    if (previousRegistry !== registry) {
        setPreviousRegistry(registry);
        // Reconcile before commit so registry membership and navigation state stay in sync.
        for (const [stateKey, entry] of previousRegistry){
            if (!registry.has(stateKey) && entry.routeNode) {
                reactDispatch({
                    type: 'NAVIGATOR_UNMOUNTED',
                    stateKey,
                    routeNode: entry.routeNode
                });
            }
        }
    }
    const handleAction = (0, _useLatestCallback.default)((action, originKey)=>{
        const payload = typeof action.payload === 'object' && action.payload !== null ? action.payload : undefined;
        const params = payload && 'params' in payload && typeof payload.params === 'object' && payload.params !== null ? payload.params : undefined;
        (0, _navigationParams.warnIfScreenParam)(params);
        reactDispatch({
            type: 'ACTION',
            payload: {
                action,
                originKey
            },
            // Sync dispatches skip the routing queue, so mark the enqueue here.
            actionId: (0, _routingQueue.markActionEnqueuedAndReturnId)()
        });
    });
    const resetNavigator = (0, _useLatestCallback.default)((stateKey, routerType)=>{
        reactDispatch({
            type: 'NAVIGATOR_CHANGED',
            stateKey,
            routerType
        });
    });
    const consumeReportEvents = (0, _useLatestCallback.default)((eventIds)=>{
        reactDispatch({
            type: 'REPORT_CONSUMED',
            eventIds
        });
    });
    const processIntent = (0, _useLatestCallback.default)((intent, inTransition = false)=>{
        const deferrable = {
            inTransition
        };
        if (intent.type === 'BROWSER_HISTORY_CHANGED') {
            // Example: A is visible while a push to B is suspended. Browser Back starts from A,
            // so restore from A's committed result, not the reducer's pending B state.
            // useLatestCallback keeps `result` at the last commit; the browser's ID and URL still pass through.
            reactDispatch({
                ...intent,
                commitedTreeResult: result,
                deferrable
            });
            return;
        }
        reactDispatch({
            ...intent,
            deferrable
        });
    });
    const resume = _react().useEffectEvent((failed)=>{
        const dispatchResume = ()=>reactDispatch({
                type: 'RESUME',
                failed
            });
        if (result.deferred?.inTransition) {
            _react().startTransition(dispatchResume);
        } else {
            dispatchResume();
        }
    });
    const missingLayouts = result.deferred?.missing;
    _react().useEffect(()=>{
        if (!missingLayouts) {
            return;
        }
        let cancelled = false;
        (0, _layoutAnchor.loadLayouts)(missingLayouts).then((failed)=>{
            if (!cancelled) {
                resume(failed);
            }
        });
        return ()=>{
            cancelled = true;
        };
    }, [
        missingLayouts
    ]);
    _react().useInsertionEffect(()=>{
        warnIfStaleState(result.state);
    }, [
        result.state
    ]);
    return {
        state: result.state,
        isWaitingForLayouts: result.deferred !== undefined,
        report: result.report,
        consumeReportEvents,
        resetNavigator,
        handleAction,
        processIntent
    };
}
const EMPTY_SET = new Set();
function getRemovedRouteKeys(current, next) {
    const nextRouteKeys = new Set();
    visitRoutes(next, true, (routeKey)=>nextRouteKeys.add(routeKey));
    const removedRoutes = [];
    visitRoutes(current, true, (routeKey)=>{
        if (!nextRouteKeys.has(routeKey)) {
            removedRoutes.push(routeKey);
        }
    });
    return removedRoutes;
}
function visitRoutes(state, excludePreloaded, visit) {
    const routes = excludePreloaded ? state.routes.filter((route)=>!route.isPreloaded) : state.routes;
    for(let index = routes.length - 1; index >= 0; index--){
        const route = routes[index];
        if (route.state?.stale === false) {
            visitRoutes(route.state, excludePreloaded, visit);
        }
        visit(route.key);
    }
}
function validateInitialState(state) {
    if (state === undefined) {
        return;
    }
    const index = 'index' in state ? state.index : undefined;
    const routeNames = 'routeNames' in state ? state.routeNames : undefined;
    const routeKeySeq = 'routeKeySeq' in state ? state.routeKeySeq : undefined;
    if (!('stale' in state) || state.stale !== false || !('key' in state) || typeof state.key !== 'string' || !Number.isInteger(index) || !Number.isInteger(routeKeySeq) || routeKeySeq < 0 || !Array.isArray(routeNames) || state.routes.some((route)=>!('key' in route) || typeof route.key !== 'string' || !routeNames?.includes(route.name)) || (state.routes.length === 0 ? index !== -1 : index < 0 || index >= state.routes.length)) {
        throw new Error('The navigation container received an incomplete initial state. Expo Router always seeds a complete initial state with valid `key`, `routeKeySeq`, `index`, `routeNames`, route keys, and `stale: false` at every level, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.');
    }
    for (const route of state.routes){
        validateInitialState(route.state);
    }
}
function replaceNavigationState(state, stateKey, replacement) {
    if (state.key === stateKey) {
        return replacement;
    }
    let changed = false;
    const routes = state.routes.map((route)=>{
        if (route.state?.stale !== false) {
            return route;
        }
        const nextState = replaceNavigationState(route.state, stateKey, replacement);
        if (nextState === route.state) {
            return route;
        }
        changed = true;
        return {
            ...route,
            state: nextState
        };
    });
    return changed ? {
        ...state,
        routes
    } : state;
}

//# sourceMappingURL=useNavigationTreeReducer.js.map
