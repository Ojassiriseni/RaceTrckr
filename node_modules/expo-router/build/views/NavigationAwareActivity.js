'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    NavigationAwareActivity: null,
    useActivityMode: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get NavigationAwareActivity () {
        return NavigationAwareActivity;
    },
    get useActivityMode () {
        return useActivityMode;
    }
});
function _jsxruntime() {
    const data = require("react/jsx-runtime");
    _jsxruntime = function() {
        return data;
    };
    return data;
}
const _Route = require("../Route");
const _native = require("../react-navigation/native");
const _ActivityContents = require("./ActivityContents");
function useActivityMode(hideWhenNestedAtLevel = 2) {
    const route = (0, _native.useRoute)();
    const isFocused = (0, _native.useIsFocused)();
    const screensAbove = (0, _native.useNavigationState)((state)=>{
        if (state.type !== 'stack') {
            return 0;
        }
        const ownIndex = state.routes.findIndex(({ key })=>key === route.key);
        return ownIndex < 0 ? 0 : Math.max(0, state.index - ownIndex);
    });
    return hideWhenNestedAtLevel <= 1 ? isFocused ? 'visible' : 'hidden' : screensAbove >= hideWhenNestedAtLevel ? 'hidden' : 'visible';
}
function NavigationAwareActivity({ hideWhenNestedAtLevel = 2, children }) {
    const routeNode = (0, _Route.useRouteNode)();
    if (routeNode?.type !== 'route') {
        throw new Error('NavigationAwareActivity must be rendered inside a screen component.');
    }
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(NavigationAwareScreenActivity, {
        hideWhenNestedAtLevel: hideWhenNestedAtLevel,
        children: children
    });
}
function NavigationAwareScreenActivity({ hideWhenNestedAtLevel, children }) {
    const mode = useActivityMode(hideWhenNestedAtLevel);
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(_ActivityContents.ActivityContents, {
        mode: mode,
        children: children
    });
}

//# sourceMappingURL=NavigationAwareActivity.js.map
