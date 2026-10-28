"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "usePreloadPlaceholderRoutes", {
    enumerable: true,
    get: function() {
        return usePreloadPlaceholderRoutes;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
function usePreloadPlaceholderRoutes({ routes, descriptors, preload, lazyByDefault }) {
    (0, _react().useEffect)(()=>{
        for (const route of routes){
            const descriptor = descriptors[route.key];
            // Options stay generic so navigators without `lazy` remain assignable; tab options may define it.
            const lazy = descriptor?.options?.lazy;
            if (descriptor?.route?.key === undefined && !(lazy ?? lazyByDefault)) {
                preload(route.name);
            }
        }
    }, [
        descriptors,
        lazyByDefault,
        preload,
        routes
    ]);
}

//# sourceMappingURL=usePreloadPlaceholderRoutes.js.map
