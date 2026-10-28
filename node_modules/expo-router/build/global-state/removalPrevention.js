'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    GlobalRemovalEventEmitterRegistryContext: null,
    GlobalRoutesWithRemovalPreventedContext: null,
    PreventRemovalProvider: null,
    RemovalPreventionProvider: null,
    ScreenRemovalPreventionSetterContext: null,
    useRoutesWithRemovalPrevented: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get GlobalRemovalEventEmitterRegistryContext () {
        return GlobalRemovalEventEmitterRegistryContext;
    },
    get GlobalRoutesWithRemovalPreventedContext () {
        return GlobalRoutesWithRemovalPreventedContext;
    },
    get PreventRemovalProvider () {
        return PreventRemovalProvider;
    },
    get RemovalPreventionProvider () {
        return RemovalPreventionProvider;
    },
    get ScreenRemovalPreventionSetterContext () {
        return ScreenRemovalPreventionSetterContext;
    },
    get useRoutesWithRemovalPrevented () {
        return useRoutesWithRemovalPrevented;
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
    const data = /*#__PURE__*/ _interop_require_wildcard(require("react"));
    _react = function() {
        return data;
    };
    return data;
}
const _IsPreloadedContext = require("../react-navigation/core/IsPreloadedContext");
const _useClientLayoutEffect = require("../react-navigation/core/useClientLayoutEffect");
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
const GlobalRoutesWithRemovalPreventedContext = /*#__PURE__*/ (0, _react().createContext)(undefined);
/** Publishes whether a route currently prevents removal. */ const GlobalRouteRemovalPreventionSetterContext = /*#__PURE__*/ (0, _react().createContext)(null);
const GlobalRemovalEventEmitterRegistryContext = /*#__PURE__*/ (0, _react().createContext)(null);
const ScreenRemovalPreventionSetterContext = /*#__PURE__*/ (0, _react().createContext)(undefined);
function RemovalEventEmitterRegistryProvider({ children }) {
    const emitters = _react().useRef(new Map());
    const emitterRegistry = (0, _react().useMemo)(()=>({
            registerRouteEmitter (routeKey, emitter) {
                emitters.current.set(routeKey, emitter);
            },
            unregisterRouteEmitter (routeKey, emitter) {
                // Route providers unmount before post-commit `removed` delivery. Keep this emitter through
                // the current task, unless another provider has already registered for the same route.
                queueMicrotask(()=>{
                    if (emitters.current.get(routeKey) === emitter) {
                        emitters.current.delete(routeKey);
                    }
                });
            },
            emitRemovalEvent (routeKey, type, action) {
                emitters.current.get(routeKey)?.(type, action);
            }
        }), []);
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(GlobalRemovalEventEmitterRegistryContext.Provider, {
        value: emitterRegistry,
        children: children
    });
}
function RoutesWithRemovalPreventedProvider({ children }) {
    const [preventedRoutes, setPreventedRoutes] = (0, _react().useState)(()=>new Map());
    const preventionSetter = _react().useCallback((routeKey, id, isPrevented)=>{
        setPreventedRoutes((previous)=>{
            const previousIds = previous.get(routeKey) ?? new Set();
            if (previousIds.has(id) === isPrevented) {
                return previous;
            }
            const nextIds = new Set(previousIds);
            if (isPrevented) {
                nextIds.add(id);
            } else {
                nextIds.delete(id);
            }
            const next = new Map(previous);
            if (nextIds.size > 0) {
                next.set(routeKey, nextIds);
            } else {
                next.delete(routeKey);
            }
            return next;
        });
    }, []);
    const preventedRouteKeys = (0, _react().useMemo)(()=>new Set(preventedRoutes.keys()), [
        preventedRoutes
    ]);
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(GlobalRouteRemovalPreventionSetterContext.Provider, {
        value: preventionSetter,
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(GlobalRoutesWithRemovalPreventedContext.Provider, {
            value: preventedRouteKeys,
            children: children
        })
    });
}
function RemovalPreventionProvider({ children }) {
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(RemovalEventEmitterRegistryProvider, {
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(RoutesWithRemovalPreventedProvider, {
            children: children
        })
    });
}
function useRegisterRouteEmitter(routeKey, emitRemovalEvent) {
    const emitterRegistry = (0, _react().use)(GlobalRemovalEventEmitterRegistryContext);
    const routeEmitter = _react().useCallback((type, action)=>emitRemovalEvent?.(routeKey, type, action), [
        emitRemovalEvent,
        routeKey
    ]);
    (0, _useClientLayoutEffect.useClientLayoutEffect)(()=>{
        if (!emitRemovalEvent || !emitterRegistry) {
            return;
        }
        emitterRegistry.registerRouteEmitter(routeKey, routeEmitter);
        return ()=>emitterRegistry.unregisterRouteEmitter(routeKey, routeEmitter);
    }, [
        emitRemovalEvent,
        emitterRegistry,
        routeEmitter,
        routeKey
    ]);
}
function useRouteRemovalPreventionSetter(routeKey) {
    const preventionSetter = (0, _react().use)(GlobalRouteRemovalPreventionSetterContext);
    const parentPreventionSetter = (0, _react().use)(ScreenRemovalPreventionSetterContext);
    const isPreloaded = (0, _react().use)(_IsPreloadedContext.IsPreloadedContext);
    return _react().useCallback((id, isPrevented, preventInPreloadedRoutes = false)=>{
        if (isPreloaded && !preventInPreloadedRoutes) {
            return;
        }
        preventionSetter?.(routeKey, id, isPrevented);
        parentPreventionSetter?.(`${routeKey}:${id}`, isPrevented, preventInPreloadedRoutes);
    }, [
        isPreloaded,
        parentPreventionSetter,
        preventionSetter,
        routeKey
    ]);
}
function PreventRemovalProvider({ routeKey, emitRemovalEvent, children }) {
    useRegisterRouteEmitter(routeKey, emitRemovalEvent);
    const setPrevented = useRouteRemovalPreventionSetter(routeKey);
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(ScreenRemovalPreventionSetterContext.Provider, {
        value: setPrevented,
        children: children
    });
}
function useRoutesWithRemovalPrevented() {
    return (0, _react().use)(GlobalRoutesWithRemovalPreventedContext) ?? EMPTY_SET;
}
const EMPTY_SET = new Set();

//# sourceMappingURL=removalPrevention.js.map
