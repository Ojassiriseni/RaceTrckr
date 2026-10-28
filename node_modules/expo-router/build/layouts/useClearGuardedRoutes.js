'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useClearGuardedRoutes", {
    enumerable: true,
    get: function() {
        return useClearGuardedRoutes;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _GuardContext = require("./GuardContext");
function useClearGuardedRoutes(removeRoutesFromState) {
    const guards = (0, _react().use)(_GuardContext.GuardContext);
    const removeRoutes = (0, _react().useEffectEvent)(removeRoutesFromState);
    (0, _react().useEffect)(()=>{
        if (!guards?.size) {
            return;
        }
        const routeNames = Array.from(guards.keys()).flatMap((name)=>{
            const normalizedName = (0, _GuardContext.normalizeRouteName)(name);
            return [
                normalizedName,
                `${normalizedName}/index`
            ];
        });
        removeRoutes(routeNames);
    }, [
        guards
    ]);
}

//# sourceMappingURL=useClearGuardedRoutes.js.map
