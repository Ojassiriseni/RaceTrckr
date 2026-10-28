'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useIsNavigating", {
    enumerable: true,
    get: function() {
        return useIsNavigating;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _routingQueueContext = require("./routingQueueContext");
function useIsNavigating() {
    return (0, _react().use)(_routingQueueContext.NavigationPendingContext);
}

//# sourceMappingURL=useIsNavigating.js.map
