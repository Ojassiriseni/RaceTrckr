"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "attachRouteState", {
    enumerable: true,
    get: function() {
        return attachRouteState;
    }
});
function _reactfastcompare() {
    const data = /*#__PURE__*/ _interop_require_default(require("react-fast-compare"));
    _reactfastcompare = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function attachRouteState(route, action) {
    const state = action.payload?.state;
    if (state == null) {
        return route;
    }
    if (state.__internal__routerActionState !== true) {
        if (process.env.NODE_ENV !== 'production') {
            // TODO: Remove this warning once unmarked state-bearing actions are unsupported.
            console.warn('A navigation action carried state without the internal __internal__routerActionState marker. The state was ignored because only Expo Router can safely generate navigation state. Use Expo Router navigation APIs instead of dispatching state-bearing actions directly.');
        }
        return route;
    }
    // The marker proves the action's origin; it must not persist in navigation state.
    const nextState = stripStateMarkers(state);
    if (route.state !== undefined) {
        if ((0, _reactfastcompare().default)(route.state, nextState)) {
            return route;
        }
    }
    return {
        ...route,
        state: nextState
    };
}
function stripStateMarkers(state) {
    const { __internal__routerActionState, ...rest } = state;
    // Rebuilding routes preserves the input navigation-state subtype while removing its marker.
    return {
        ...rest,
        routes: state.routes.map((route)=>route.state === undefined ? route : {
                ...route,
                state: stripStateMarkers(route.state)
            })
    };
}

//# sourceMappingURL=attachRouteState.js.map
