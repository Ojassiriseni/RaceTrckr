"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    extendRouter: null,
    extendRouterActions: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get extendRouter () {
        return extendRouter;
    },
    get extendRouterActions () {
        return extendRouterActions;
    }
});
const _ensureStateType = require("./ensureStateType");
const _stateKeys = require("./stateKeys");
const _types = require("./types");
const _utils = require("./utils");
function extendRouter(base, extension, { type: extendedType } = {}) {
    // Warns once per router factory, so a deprecated result does not log on every action.
    let warnedNull = false;
    return (options)=>{
        // The extension owns the state and action types of the router it produces. The base router
        // is created for the base types and the extension decides which of its members still apply.
        const baseRouter = base(options);
        const type = extendedType ?? baseRouter.type;
        const ensureType = (state)=>type === undefined ? state : (0, _ensureStateType.ensureStateType)(state, type);
        // The call in progress. One counter is shared by `nextKey` and delegation to the base router,
        // so keys minted on either side never collide regardless of the order they are used in.
        let current = {
            key: '',
            routeKeySeq: 0
        };
        const start = (state, config)=>{
            current = {
                key: state.key,
                routeKeySeq: state.routeKeySeq,
                config
            };
            return state;
        };
        const stamp = (state)=>state.routeKeySeq < current.routeKeySeq ? {
                ...state,
                routeKeySeq: current.routeKeySeq
            } : state;
        // Every returned state gets the shared sequence, the type of the state it was derived from
        // (an outer router in the chain may have stamped it before delegating), and the effective
        // `normalizeState` (the extension's, else the base router's). States routed through
        // `context.baseRouter` were already normalized by the base router.
        const finish = (state, stateType)=>{
            const stamped = stamp(state);
            const typed = stateType === undefined ? stamped : (0, _ensureStateType.ensureStateType)(stamped, stateType);
            return normalizeState ? normalizeState(typed) : typed;
        };
        const delegate = {
            ...baseRouter,
            getStateForAction (state, action, config = current.config) {
                if (config === undefined) {
                    throw new Error('`baseRouter.getStateForAction` needs the `config` argument when it is called outside of `getStateForAction`, because only that method receives one from the navigator. Pass the config explicitly.');
                }
                const result = baseRouter.getStateForAction(stamp(state), action, config);
                // A custom base router may still return the deprecated `null`.
                if (!(0, _utils.isActionHandled)(result)) {
                    return _types.RouterActionHandling.Unhandled;
                }
                current.routeKeySeq = Math.max(current.routeKeySeq, result.state.routeKeySeq);
                return result;
            }
        };
        const nextKey = (name)=>{
            const minter = (0, _stateKeys.createRouteKeyMinter)(current);
            const key = minter.mint(name);
            current.routeKeySeq = minter.routeKeySeq;
            return key;
        };
        const router = {
            ...delegate,
            ...extension({
                baseRouter: delegate,
                options,
                nextKey
            }),
            type
        };
        const { normalizeState } = router;
        return {
            ...router,
            getStateForDeclaredRoutes (state, routeNames) {
                // Render-phase fallback: the seeded state keeps its own `type` until an action stamps it.
                return finish(router.getStateForDeclaredRoutes(start(state), routeNames), state.type);
            },
            getStateForRouteFocus (state, key) {
                const typedState = ensureType(start(state));
                return finish(router.getStateForRouteFocus(typedState, key), typedState.type);
            },
            getStateForAction (state, action, config) {
                const typedState = ensureType(start(state, config));
                const result = router.getStateForAction(typedState, action, config);
                if (result === null && process.env.NODE_ENV !== 'production' && !warnedNull) {
                    warnedNull = true;
                    console.warn(`An \`extendRouter\` extension or \`extendRouterActions\` reducer returned \`null\` for the "${action.type}" action. Returning \`null\` is deprecated. Return \`RouterActionHandling.Unhandled\` to leave the action unhandled, and use \`isActionHandled\` to check whether a router handled an action.`);
                }
                const resolved = result === _types.RouterActionHandling.Delegate ? delegate.getStateForAction(typedState, action, config) : result;
                if (!(0, _utils.isActionHandled)(resolved)) {
                    return _types.RouterActionHandling.Unhandled;
                }
                const finishedState = finish(resolved.state, typedState.type);
                if (router.getBrowserHistoryForAction) {
                    const browserHistory = router.getBrowserHistoryForAction(typedState, finishedState, action);
                    if (browserHistory !== resolved.browserHistory) {
                        return {
                            ...resolved,
                            state: finishedState,
                            browserHistory
                        };
                    }
                }
                return finishedState === resolved.state ? resolved : {
                    ...resolved,
                    state: finishedState
                };
            }
        };
    };
}
function extendRouterActions(base, reducer) {
    // Warns once per router factory, so a deprecated result does not log on every action.
    let warnedUndefined = false;
    return extendRouter(base, ({ baseRouter, options, nextKey })=>{
        // `Router` requires `type` conditionally on `State`, which TypeScript cannot resolve for a
        // generic `State`; the override never sets `type`, so the shape is compatible.
        const overrides = {
            getStateForAction (state, action, config) {
                const result = reducer(state, action, {
                    ...config,
                    baseRouter,
                    options,
                    nextKey
                });
                if (result !== undefined) {
                    return result;
                }
                if (process.env.NODE_ENV !== 'production' && !warnedUndefined) {
                    warnedUndefined = true;
                    console.warn(`An \`extendRouterActions\` reducer returned \`undefined\` for the "${action.type}" action. Returning \`undefined\` is deprecated. Return \`RouterActionHandling.Delegate\` to let the base router handle the action.`);
                }
                return _types.RouterActionHandling.Delegate;
            }
        };
        return overrides;
    });
}

//# sourceMappingURL=extendRouter.js.map
