'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useCanGoBack", {
    enumerable: true,
    get: function() {
        return useCanGoBack;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _CanGoBackContext = require("../react-navigation/core/CanGoBackContext");
function useCanGoBack() {
    const canGoBack = (0, _react().use)(_CanGoBackContext.CanGoBackContext);
    if (canGoBack === undefined) {
        throw new Error('`useCanGoBack` was called from a component rendered outside the Expo Router root. Render the component inside `ExpoRoot`.');
    }
    return canGoBack;
}

//# sourceMappingURL=useCanGoBack.js.map
