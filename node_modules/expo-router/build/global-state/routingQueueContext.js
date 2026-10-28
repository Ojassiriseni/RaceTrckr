'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    ImperativeRoutingQueueBridge: null,
    NavigationPendingContext: null,
    PendingIntentsContext: null,
    RoutingQueueApiContext: null,
    RoutingQueueProvider: null,
    useEnqueueRoutingIntent: null,
    useSetRoutingTransitionMode: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ImperativeRoutingQueueBridge () {
        return ImperativeRoutingQueueBridge;
    },
    get NavigationPendingContext () {
        return NavigationPendingContext;
    },
    get PendingIntentsContext () {
        return PendingIntentsContext;
    },
    get RoutingQueueApiContext () {
        return RoutingQueueApiContext;
    },
    get RoutingQueueProvider () {
        return RoutingQueueProvider;
    },
    get useEnqueueRoutingIntent () {
        return useEnqueueRoutingIntent;
    },
    get useSetRoutingTransitionMode () {
        return useSetRoutingTransitionMode;
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
const _useClientLayoutEffect = require("../react-navigation/core/useClientLayoutEffect");
const _router = require("./router");
const _routingQueue = require("./routingQueue");
const EMPTY = [];
let boundBridges = 0;
const throwMissingRoutingQueue = ()=>{
    throw new Error('Attempted to navigate from a component rendered outside the Expo Router root. Render the component inside `ExpoRoot`. If this happened inside `ExpoRoot`, please report a bug at https://github.com/expo/expo/issues.');
};
const RoutingQueueApiContext = /*#__PURE__*/ (0, _react().createContext)(undefined);
const PendingIntentsContext = /*#__PURE__*/ (0, _react().createContext)(EMPTY);
const NavigationPendingContext = /*#__PURE__*/ (0, _react().createContext)(false);
function RoutingQueueProvider({ children }) {
    const [queue, setQueue] = (0, _react().useState)(EMPTY);
    const [isPending, startTransition] = (0, _react().useTransition)();
    const [transitionMode, setTransitionMode] = (0, _react().useState)(_router.getDefaultTransitionMode);
    const api = (0, _react().useMemo)(()=>({
            // Each enqueue has its own identity, including repeated uses of the same intent object.
            enqueue: (intent)=>{
                const queued = {
                    ...intent,
                    actionId: (0, _routingQueue.markActionEnqueuedAndReturnId)()
                };
                setQueue((previous)=>[
                        ...previous,
                        queued
                    ]);
            },
            // Keep intents added between the drained render and this state update.
            dequeue: (processed)=>setQueue((previous)=>{
                    const removed = new Set(processed);
                    const next = previous.filter((intent)=>!removed.has(intent));
                    return next.length === 0 ? EMPTY : next;
                }),
            startTransition,
            transitionMode,
            setTransitionMode
        }), [
        startTransition,
        transitionMode
    ]);
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(RoutingQueueApiContext.Provider, {
        value: api,
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(NavigationPendingContext.Provider, {
            value: isPending || queue.length > 0,
            children: /*#__PURE__*/ (0, _jsxruntime().jsx)(PendingIntentsContext.Provider, {
                value: queue,
                children: children
            })
        })
    });
}
function useEnqueueRoutingIntent() {
    const api = (0, _react().use)(RoutingQueueApiContext);
    if (api === undefined) {
        return throwMissingRoutingQueue;
    }
    return api.enqueue;
}
function useSetRoutingTransitionMode() {
    const api = (0, _react().use)(RoutingQueueApiContext);
    if (api === undefined) {
        return throwMissingRoutingQueue;
    }
    return api.setTransitionMode;
}
function ImperativeRoutingQueueBridge({ enqueue, setTransitionMode }) {
    (0, _useClientLayoutEffect.useClientLayoutEffect)(()=>{
        if (__DEV__ && boundBridges > 0) {
            console.error([
                'Looks like you have multiple navigation containers consuming the shared imperative routing queue. Only one container will receive queued actions. Make sure that:',
                "- You don't have multiple NavigationContainers in the app",
                '- Only a single instance of the root component is rendered'
            ].join('\n'));
        }
        boundBridges++;
        // The exported router identity must stay stable, so the bridge mutates it in place.
        Object.assign(_router.router, (0, _router.createImperativeRouter)(enqueue, setTransitionMode));
        return ()=>{
            boundBridges--;
            Object.assign(_router.router, _router.unboundRouter);
        };
    }, [
        enqueue,
        setTransitionMode
    ]);
    return null;
}

//# sourceMappingURL=routingQueueContext.js.map
