"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoaderRouteLifecycle", {
    enumerable: true,
    get: function() {
        return LoaderRouteLifecycle;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _LoaderContext = require("./LoaderContext");
const _abandonLoaderPath = require("./abandonLoaderPath");
const scheduledAbandonments = new Map();
function cancelScheduledAbandonment(path) {
    const scheduled = scheduledAbandonments.get(path);
    if (!scheduled) {
        return;
    }
    scheduled.cancel();
    scheduledAbandonments.delete(path);
}
function scheduleRouteAbandonment(ctx, path) {
    cancelScheduledAbandonment(path);
    const scheduled = {
        cancel: (0, _abandonLoaderPath.scheduleAbandonLoaderPath)(ctx, path)
    };
    scheduledAbandonments.set(path, scheduled);
    queueMicrotask(()=>{
        if (scheduledAbandonments.get(path) === scheduled) {
            scheduledAbandonments.delete(path);
        }
    });
}
function LoaderRouteLifecycle({ path }) {
    const ctx = (0, _react().use)(_LoaderContext.LoaderContext);
    (0, _react().useEffect)(()=>{
        cancelScheduledAbandonment(path);
        return ()=>{
            scheduleRouteAbandonment(ctx, path);
        };
    }, [
        ctx,
        path
    ]);
    return null;
}

//# sourceMappingURL=LoaderRouteLifecycle.js.map
