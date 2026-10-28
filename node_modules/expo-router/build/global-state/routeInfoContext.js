'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RouteInfoContext", {
    enumerable: true,
    get: function() {
        return RouteInfoContext;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _getRouteInfoFromState = require("./getRouteInfoFromState");
const RouteInfoContext = (0, _react().createContext)(_getRouteInfoFromState.defaultRouteInfo);

//# sourceMappingURL=routeInfoContext.js.map
