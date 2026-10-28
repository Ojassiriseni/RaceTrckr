'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    GuardContext: null,
    GuardContextProvider: null,
    isRouteGuarded: null,
    normalizeRouteName: null,
    useGuardRedirect: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get GuardContext () {
        return GuardContext;
    },
    get GuardContextProvider () {
        return GuardContextProvider;
    },
    get isRouteGuarded () {
        return isRouteGuarded;
    },
    get normalizeRouteName () {
        return normalizeRouteName;
    },
    get useGuardRedirect () {
        return useGuardRedirect;
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
const _Route = require("../Route");
const _matchers = require("../matchers");
const _routeNode = require("../routeNode");
const GuardContext = /*#__PURE__*/ (0, _react().createContext)(null);
const GuardRedirectFallbackContext = /*#__PURE__*/ (0, _react().createContext)([]);
function GuardContextProvider({ node, guardedRedirects, children }) {
    const parentFallbacks = (0, _react().use)(GuardRedirectFallbackContext);
    const params = (0, _react().use)(_Route.LocalRouteParamsContext);
    const guardConfigurationKey = serializeGuardedRedirects(guardedRedirects);
    const { fallbacks, resolvedGuards } = (0, _react().useMemo)(()=>computeGuardState(node, guardedRedirects, params, parentFallbacks), [
        node,
        node?.children,
        node?.contextKey,
        params,
        parentFallbacks,
        guardConfigurationKey
    ]);
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(GuardRedirectFallbackContext, {
        value: fallbacks,
        children: /*#__PURE__*/ (0, _jsxruntime().jsx)(GuardContext, {
            value: resolvedGuards,
            children: children
        })
    });
}
function computeGuardState(node, guardedRedirects, params, parentFallbacks) {
    const navigatorFallback = getNavigatorFallback(node, guardedRedirects, params);
    const inheritedFallbacks = removeFallbacksTargetingNavigator(parentFallbacks, node);
    const fallbacks = navigatorFallback ? [
        navigatorFallback,
        ...inheritedFallbacks
    ] : inheritedFallbacks;
    return {
        fallbacks,
        resolvedGuards: resolveGuardRedirects(guardedRedirects, fallbacks[0]?.href)
    };
}
function useGuardRedirect(routeName) {
    const guards = (0, _react().use)(GuardContext);
    if (!guards) {
        return undefined;
    }
    if (guards.has(routeName)) {
        return guards.get(routeName) ?? null;
    }
    const normalizedRouteName = normalizeRouteName(routeName);
    return guards.has(normalizedRouteName) ? guards.get(normalizedRouteName) ?? null : undefined;
}
function normalizeRouteName(routeName) {
    return routeName.replace(/\/index$/, '');
}
function getNavigatorFallback(node, guardedRedirects, params) {
    if (!node) {
        return {
            href: '/',
            targetRouteContextKey: null
        };
    }
    const route = findDefaultRedirectRouteInNavigator(node, guardedRedirects);
    if (!route) {
        return undefined;
    }
    const pathname = normalizeRouteName((0, _matchers.getContextKey)(route.contextKey)) || '/';
    return {
        href: Object.keys(params ?? {}).length ? {
            pathname,
            params
        } : pathname,
        targetRouteContextKey: route.contextKey
    };
}
function removeFallbacksTargetingNavigator(fallbacks, node) {
    // Route identity is required because pathless groups can share the same visible URL.
    return fallbacks.filter((fallback)=>fallback.targetRouteContextKey !== node?.contextKey);
}
function findDefaultRedirectRouteInNavigator(node, guardedRedirects) {
    const anchor = (0, _routeNode.getValidInitialRoute)(node);
    const children = [
        ...node.children
    ].sort((0, _Route.sortRoutesWithInitial)(anchor?.route));
    if (anchor && !isRouteGuarded(anchor.route, guardedRedirects)) {
        return anchor;
    }
    return children.find((child)=>!isRouteGuarded(child.route, guardedRedirects));
}
function isRouteGuarded(routeName, guards) {
    return guards.has(routeName) || guards.has(normalizeRouteName(routeName));
}
function resolveGuardRedirects(guardedRedirects, fallbackHref) {
    return new Map(Array.from(guardedRedirects, ([name, redirectTo])=>[
            name,
            redirectTo ?? fallbackHref ?? null
        ]));
}
function serializeGuardedRedirects(guardedRedirects) {
    return JSON.stringify(Array.from(guardedRedirects.entries()));
}

//# sourceMappingURL=GuardContext.js.map
