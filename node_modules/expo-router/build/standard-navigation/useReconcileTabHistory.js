'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useReconcileTabHistory", {
    enumerable: true,
    get: function() {
        return useReconcileTabHistory;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _stateUtils = require("../global-state/stateUtils");
const _CanGoBackContext = require("../react-navigation/core/CanGoBackContext");
const _NavigationHelpersContext = require("../react-navigation/core/NavigationHelpersContext");
const _RootNavigationStateContext = require("../react-navigation/core/RootNavigationStateContext");
const _isArrayEqual = require("../react-navigation/core/isArrayEqual");
const _useClientLayoutEffect = require("../react-navigation/core/useClientLayoutEffect");
const _useNavigationState = require("../react-navigation/core/useNavigationState");
function useReconcileTabHistory(navigator) {
    const state = navigator?.state ?? (0, _react().use)(_useNavigationState.NavigatorStateContext);
    const navigation = navigator?.navigation ?? (0, _react().use)(_NavigationHelpersContext.NavigationHelpersContext);
    const rootState = (0, _react().use)(_RootNavigationStateContext.RootNavigationStateContext);
    if (!state || !navigation) {
        throw new Error('Could not reconcile the tab history because `unstable_useReconcileTabHistory` found no navigator. ' + 'Call it inside the content of a tab navigator, or pass the navigator `state` and `navigation`.');
    }
    // `useNavigationBuilder` derives `state` from this root-state slice.
    const committed = rootState && (0, _stateUtils.findStateByKey)(rootState, state.key);
    // Writes the derived history only when Back has a target, so a navigator that opens on its first
    // tab does not render again.
    (0, _useClientLayoutEffect.useClientLayoutEffect)(()=>{
        // `useNavigationBuilder` resets foreign types and dispatches route-name changes, which also
        // normalize history.
        if (!committed || committed.type !== state.type || !(0, _isArrayEqual.isArrayEqual)(committed.routeNames, state.routeNames) || committed.history != null || !(0, _CanGoBackContext.hasBackTarget)(committed) && !(0, _CanGoBackContext.hasBackTarget)(state)) {
            return;
        }
        navigation.dispatch({
            type: 'ROUTE_NAMES_CHANGED',
            payload: {
                routeNames: state.routeNames
            },
            target: committed.key
        });
    }, [
        committed,
        navigation,
        state
    ]);
}

//# sourceMappingURL=useReconcileTabHistory.js.map
