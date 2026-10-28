'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    RouterRegistrySettersContext: null,
    useRegisterRouter: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get RouterRegistrySettersContext () {
        return RouterRegistrySettersContext;
    },
    get useRegisterRouter () {
        return useRegisterRouter;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _useClientLayoutEffect = require("../react-navigation/core/useClientLayoutEffect");
const RouterRegistrySettersContext = /*#__PURE__*/ (0, _react().createContext)(undefined);
function useRegisterRouter(stateKey, entry) {
    const setters = (0, _react().use)(RouterRegistrySettersContext);
    (0, _useClientLayoutEffect.useClientLayoutEffect)(()=>{
        if (setters === undefined) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Router registry is unavailable. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.');
            }
            return;
        }
        setters.register(stateKey, entry);
        return ()=>setters.unregister(stateKey, entry);
    }, [
        entry,
        setters,
        stateKey
    ]);
}

//# sourceMappingURL=routerRegistry.js.map
