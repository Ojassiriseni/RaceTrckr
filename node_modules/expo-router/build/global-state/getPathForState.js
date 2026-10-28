"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getPathForState: null,
    resolvePathLinking: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get getPathForState () {
        return getPathForState;
    },
    get resolvePathLinking () {
        return resolvePathLinking;
    }
});
function _reactfastcompare() {
    const data = /*#__PURE__*/ _interop_require_default(require("react-fast-compare"));
    _reactfastcompare = function() {
        return data;
    };
    return data;
}
const _findFocusedRoute = require("../fork/findFocusedRoute");
const _getPathFromState = require("../fork/getPathFromState");
const _getStateFromPath = require("../fork/getStateFromPath");
const _getRouteInfoFromState = require("./getRouteInfoFromState");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function resolvePathLinking(linking) {
    return {
        getStateFromPath: linking?.getStateFromPath ?? _getStateFromPath.getStateFromPath,
        getPathFromState: linking?.getPathFromState ?? _getPathFromState.getPathFromState
    };
}
function getPathForState(state, linking) {
    const { getStateFromPath, getPathFromState } = resolvePathLinking(linking);
    const route = (0, _findFocusedRoute.findFocusedRoute)(state);
    // Preserve the original URL for wildcard routes while the route and params still match.
    if (route?.path) {
        const stateForPath = getStateFromPath(route.path, linking?.config, (0, _getRouteInfoFromState.getRouteSegmentsFromState)(state));
        const focusedRoute = stateForPath ? (0, _findFocusedRoute.findFocusedRoute)(stateForPath) : undefined;
        if (focusedRoute && focusedRoute.name === route.name && (0, _reactfastcompare().default)({
            ...focusedRoute.params
        }, {
            ...route.params
        })) {
            return (0, _getPathFromState.appendBaseUrl)(route.path);
        }
    }
    return getPathFromState(state, linking?.config);
}

//# sourceMappingURL=getPathForState.js.map
