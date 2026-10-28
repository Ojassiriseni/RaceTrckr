"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveLoaderPath", {
    enumerable: true,
    get: function() {
        return resolveLoaderPath;
    }
});
const _getSingularId = require("../utils/getSingularId");
function resolveLoaderPath(contextKey, routeInfo) {
    const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
    const resolvedPathname = `/${(0, _getSingularId.getSingularId)(contextPath, {
        params: routeInfo?.params ?? {}
    })}`;
    const searchString = routeInfo?.searchParams?.toString() || '';
    return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
}

//# sourceMappingURL=resolveLoaderPath.js.map
