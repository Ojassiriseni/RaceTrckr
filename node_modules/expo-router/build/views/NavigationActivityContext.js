'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    NavigationActivityProvider: null,
    useActivityThreshold: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get NavigationActivityProvider () {
        return NavigationActivityProvider;
    },
    get useActivityThreshold () {
        return useActivityThreshold;
    }
});
function _jsxruntime() {
    const data = require("react/jsx-runtime");
    _jsxruntime = function() {
        return data;
    };
    return data;
}
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const ActivityThresholdContext = /*#__PURE__*/ (0, _react().createContext)(undefined);
function NavigationActivityProvider({ activityThreshold, children }) {
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(ActivityThresholdContext, {
        value: activityThreshold,
        children: children
    });
}
function useActivityThreshold() {
    return (0, _react().use)(ActivityThresholdContext);
}

//# sourceMappingURL=NavigationActivityContext.js.map
