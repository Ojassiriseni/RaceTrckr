'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useNavigationTreeReportEvents", {
    enumerable: true,
    get: function() {
        return useNavigationTreeReportEvents;
    }
});
function _react() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react"));
    _react = function() {
        return data;
    };
    return data;
}
const _performance = require("../performance");
const _useClientLayoutEffect = require("../react-navigation/core/useClientLayoutEffect");
const _internalNavigationEvents = require("./internalNavigationEvents");
const _removalPrevention = require("./removalPrevention");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const warnedActions = new WeakSet();
function warnUnhandledAction(action) {
    if (process.env.NODE_ENV === 'production' || warnedActions.has(action)) {
        return;
    }
    warnedActions.add(action);
    const payload = typeof action.payload === 'object' && action.payload !== null ? action.payload : undefined;
    let message = `The action '${action.type}'${payload ? ` with payload ${JSON.stringify(payload)}` : ''} was not handled by any navigator.`;
    switch(action.type){
        case 'NAVIGATE':
        case 'PUSH':
        case 'REPLACE':
        case 'JUMP_TO':
            if (payload && 'name' in payload && typeof payload.name === 'string') {
                message += `\n\nDo you have a route named '${payload.name}'?`;
            } else {
                message += '\n\nYou need to pass the name of the screen to navigate to. This may be a bug.';
            }
            break;
        case 'GO_BACK':
        case 'POP':
        case 'POP_TO_TOP':
            message += '\n\nIs there any screen to go back to?';
            break;
        case 'OPEN_DRAWER':
        case 'CLOSE_DRAWER':
        case 'TOGGLE_DRAWER':
            message += '\n\nIs your screen inside a Drawer navigator?';
            break;
    }
    console.error(`${message}\n\nThis is a development-only warning and won't be shown in production.`);
}
function useNavigationTreeReportEvents(report, consumeReportEvents, browserHistory) {
    const emitterRegistry = _react().use(_removalPrevention.GlobalRemovalEventEmitterRegistryContext);
    const consumedIds = _react().useRef(new Set());
    (0, _useClientLayoutEffect.useClientLayoutEffect)(()=>{
        const reportIds = new Set(report?.events.map((event)=>event.id));
        for (const id of consumedIds.current){
            if (!reportIds.has(id)) {
                consumedIds.current.delete(id);
            }
        }
        if (report === undefined) {
            return;
        }
        const ids = [];
        for (const event of report.events){
            if (consumedIds.current.has(event.id)) {
                continue;
            }
            consumedIds.current.add(event.id);
            ids.push(event.id);
            // A listener that throws must not stop the remaining events from being delivered.
            try {
                switch(event.type){
                    case 'unhandled-action':
                        warnUnhandledAction(event.action);
                        break;
                    case 'prevented-routes':
                        for (const routeKey of event.routeKeys){
                            emitterRegistry.emitRemovalEvent(routeKey, 'removePrevented', event.action);
                        }
                        break;
                    case 'removed-routes':
                        for (const routeKey of event.routeKeys){
                            emitterRegistry.emitRemovalEvent(routeKey, 'removed', event.action);
                        }
                        break;
                    case 'action-dispatched':
                        // `mark` does not throw, so it runs first and a throwing listener cannot skip it.
                        (0, _performance.mark)('expo-router:action-dispatched', {
                            actionType: event.action.type,
                            actionId: event.actionId
                        });
                        _internalNavigationEvents.internalNavigationEvents.emit('actionDispatched', {
                            actionType: event.action.type,
                            payload: event.action.payload,
                            state: event.state
                        });
                        break;
                    case 'browser-history':
                        browserHistory.apply(event);
                        break;
                    case 'route-preloaded':
                        _internalNavigationEvents.internalNavigationEvents.emit('routePreloaded', {
                            routeKey: event.routeKey,
                            state: event.state
                        });
                        break;
                }
            } catch (error) {
                const message = typeof error === 'object' && error != null && 'message' in error ? error.message : error;
                console.warn(`An error occurred in a navigation event listener while handling ${event.type}: ${message}`);
            }
        }
        if (ids.length > 0) {
            consumeReportEvents(ids);
        }
    }, [
        browserHistory,
        consumeReportEvents,
        emitterRegistry,
        report
    ]);
}

//# sourceMappingURL=useNavigationTreeReportEvents.js.map
