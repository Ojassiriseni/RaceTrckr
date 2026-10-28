"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getRouteInfoForMatchedRoute", {
    enumerable: true,
    get: function() {
        return getRouteInfoForMatchedRoute;
    }
});
const _constants = require("../constants");
const _getStateFromPathforks = require("../fork/getStateFromPath-forks");
const _getRouteInfoFromState = require("../global-state/getRouteInfoFromState");
const _matchers = require("../matchers");
function getRouteInfoForMatchedRoute(route, params, location) {
    const path = `${location.pathname}${location.search}`;
    const routeInfo = (0, _getRouteInfoFromState.getRouteInfoFromState)(route.generated ? createGeneratedRouteState(route.page, path) : createMatchedRouteState(route.page, params, path));
    return {
        pathname: routeInfo.pathname,
        params: routeInfo.params,
        searchParams: routeInfo.searchParams
    };
}
/** The state `getStateFromPath` produces for a route file. */ function createMatchedRouteState(page, params, path) {
    const name = page.replace(/^\//, '');
    const pathParams = decodePathParams(name, params);
    const queryParams = (0, _getStateFromPathforks.parseQueryParams)(path, {
        name,
        params: pathParams
    });
    return {
        routes: [
            {
                name: _constants.INTERNAL_SLOT_NAME,
                state: {
                    routes: [
                        {
                            name,
                            params: {
                                ...pathParams,
                                ...queryParams
                            }
                        }
                    ]
                }
            }
        ]
    };
}
/** The root-level state `getStateFromPath` produces for generated routes. */ function createGeneratedRouteState(page, path) {
    const name = page === `/${_constants.SITEMAP_ROUTE_NAME}` ? _constants.SITEMAP_ROUTE_NAME : _constants.NOT_FOUND_ROUTE_NAME;
    return {
        routes: [
            {
                name,
                path: (0, _getStateFromPathforks.getUrlWithReactNavigationConcessions)(path).pathWithoutGroups
            }
        ]
    };
}
/** @see import('../fork/getStateFromPath').matchAgainstConfigs */ function decodePathParams(name, captures) {
    const params = {};
    for (const segment of name.split('/')){
        const dynamic = segment === '+not-found' ? {
            name: 'not-found',
            deep: true
        } : (0, _matchers.matchDynamicName)(segment);
        const value = dynamic ? captures[dynamic.name] : undefined;
        if (!dynamic || value == null) {
            continue;
        }
        const decoded = (Array.isArray(value) ? value : [
            value
        ]).map(_getStateFromPathforks.safelyDecodeURIComponent).join('/');
        params[dynamic.name] = dynamic.deep ? decoded.split('/').filter(Boolean) : decoded;
    }
    return params;
}

//# sourceMappingURL=getRouteInfoForMatchedRoute.js.map
