'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BrowserHistorySync", {
    enumerable: true,
    get: function() {
        return BrowserHistorySync;
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
function BrowserHistorySync({ adapter }) {
    const enqueue = (0, _routingQueueContext.useEnqueueRoutingIntent)();
    (0, _react().useEffect)(()=>adapter.listen((change)=>{
            enqueue({
                type: 'BROWSER_HISTORY_CHANGED',
                payload: change
            });
        }), [
        adapter,
        enqueue
    ]);
    return null;
}

//# sourceMappingURL=BrowserHistorySync.js.map
