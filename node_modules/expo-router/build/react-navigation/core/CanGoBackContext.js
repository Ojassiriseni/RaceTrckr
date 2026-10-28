'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    CanGoBackContext: null,
    getFocusedCanGoBack: null,
    hasBackTarget: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CanGoBackContext () {
        return CanGoBackContext;
    },
    get getFocusedCanGoBack () {
        return getFocusedCanGoBack;
    },
    get hasBackTarget () {
        return hasBackTarget;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const CanGoBackContext = /*#__PURE__*/ (0, _react().createContext)(undefined);
function hasBackTarget(state) {
    return state.history != null ? state.history.length > 1 : (state.index ?? 0) > 0;
}
function getFocusedCanGoBack(rootState) {
    let state = rootState;
    while(state){
        if (hasBackTarget(state)) {
            return true;
        }
        state = state.routes[state.index ?? 0]?.state;
    }
    return false;
}

//# sourceMappingURL=CanGoBackContext.js.map
