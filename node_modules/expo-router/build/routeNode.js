"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    findRouteNodeAndParamsForState: null,
    findRouteNodeByName: null,
    getValidInitialRoute: null,
    getValidInitialRouteName: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get findRouteNodeAndParamsForState () {
        return findRouteNodeAndParamsForState;
    },
    get findRouteNodeByName () {
        return findRouteNodeByName;
    },
    get getValidInitialRoute () {
        return getValidInitialRoute;
    },
    get getValidInitialRouteName () {
        return getValidInitialRouteName;
    }
});
const _layoutAnchor = require("./layoutAnchor");
function findRouteNodeByName(node, name) {
    return node?.children.find((child)=>child.route === name);
}
function findRouteNodeAndParamsForState(node, state) {
    const params = {};
    if (!state) {
        return {
            routeNode: undefined,
            params
        };
    }
    let routeNode = node ?? undefined;
    while(state){
        const route = state.routes[state.index ?? state.routes.length - 1];
        Object.assign(params, route?.params);
        routeNode = findRouteNodeByName(routeNode, route?.name);
        state = route?.state;
    }
    return {
        routeNode,
        params
    };
}
function getValidInitialRoute(node) {
    return node ? findRouteNodeByName(node, (0, _layoutAnchor.getLayoutAnchor)(node)) : undefined;
}
const getValidInitialRouteName = (node)=>node ? (0, _layoutAnchor.getLayoutAnchor)(node) : undefined;

//# sourceMappingURL=routeNode.js.map
