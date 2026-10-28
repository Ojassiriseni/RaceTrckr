"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getBrowserHistoryForHistoryChange", {
    enumerable: true,
    get: function() {
        return getBrowserHistoryForHistoryChange;
    }
});
// A placeholder entry for an unvisited tab has no route, so it has no browser entry.
const countBrowserEntries = (state)=>state.history?.filter((item)=>item.type !== 'route' || state.routes.some((route)=>route.key === item.key)).length ?? 0;
function getBrowserHistoryForHistoryChange(previous, next) {
    const delta = countBrowserEntries(next) - countBrowserEntries(previous);
    if (delta > 0) {
        return {
            type: 'push'
        };
    }
    if (delta < 0) {
        return {
            type: 'pop',
            count: -delta,
            target: {
                navigatorKey: next.key,
                routeKey: next.routes[next.index].key
            }
        };
    }
    return undefined;
}

//# sourceMappingURL=getBrowserHistoryForHistoryChange.js.map
