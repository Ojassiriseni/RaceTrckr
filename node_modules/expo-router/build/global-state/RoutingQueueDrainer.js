'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    RoutingQueueDrainer: null,
    shouldUseTransition: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get RoutingQueueDrainer () {
        return RoutingQueueDrainer;
    },
    get shouldUseTransition () {
        return shouldUseTransition;
    }
});
function _react() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react"));
    _react = function() {
        return data;
    };
    return data;
}
const _routingQueueContext = require("./routingQueueContext");
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
function shouldUseTransition(intents, mode) {
    if (mode === 'never') return false;
    if (intents.some((intent)=>intent.inTransition === false)) return false;
    if (mode === 'always') return true;
    mode;
    return intents.every((intent)=>intent.inTransition === true || isPreloadIntent(intent));
}
function isPreloadIntent(intent) {
    return intent.type === 'NAVIGATE_TO_HREF' && intent.payload.options.event === 'PRELOAD';
}
function RoutingQueueDrainer({ processIntent }) {
    const intents = _react().use(_routingQueueContext.PendingIntentsContext);
    const { dequeue, startTransition, transitionMode } = _react().use(_routingQueueContext.RoutingQueueApiContext);
    const lastProcessed = _react().useRef(undefined);
    _react().useEffect(()=>{
        if (intents.length === 0 || lastProcessed.current === intents) {
            return;
        }
        // Strict Mode re-runs the mount effect with the same array before `dequeue` updates state.
        lastProcessed.current = intents;
        // TODO(@ubax): Navigation runs in a transition, so a destination that suspends keeps the
        // current screen visible and never renders `SuspenseFallback` (including the web dev
        // "Bundling..." toast for async routes). Design a fallback UX for pending navigation.
        // Dequeue urgently so a later enqueue is not rebased on a stale queue.
        dequeue(intents);
        const inTransition = shouldUseTransition(intents, transitionMode);
        const process = ()=>{
            for (const intent of intents){
                // Only catches errors thrown while dispatching. The navigation reducer runs
                // during the next render, so errors from it surface there, not here.
                try {
                    processIntent(intent, inTransition);
                } catch (error) {
                    const message = typeof error === 'object' && error != null && 'message' in error ? error.message : error;
                    console.warn(`An error occurred when trying to handle navigation action ${JSON.stringify(intent)}: ${message}`);
                }
            }
        };
        if (inTransition) {
            startTransition(process);
        } else {
            process();
        }
    }, [
        dequeue,
        intents,
        processIntent,
        startTransition,
        transitionMode
    ]);
    return null;
}

//# sourceMappingURL=RoutingQueueDrainer.js.map
