'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useRouterActions", {
    enumerable: true,
    get: function() {
        return useRouterActions;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _router = require("./router");
const _routingQueueContext = require("./routingQueueContext");
function useRouterActions() {
    const enqueue = (0, _routingQueueContext.useEnqueueRoutingIntent)();
    const setTransitionMode = (0, _routingQueueContext.useSetRoutingTransitionMode)();
    return (0, _react().useMemo)(()=>(0, _router.createImperativeRouter)(enqueue, setTransitionMode), [
        enqueue,
        setTransitionMode
    ]);
}

//# sourceMappingURL=useRouterActions.js.map
