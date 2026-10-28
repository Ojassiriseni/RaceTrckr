"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useNonStackAnchorWarning", {
    enumerable: true,
    get: function() {
        return useNonStackAnchorWarning;
    }
});
const _Route = require("../Route");
const _routeNode = require("../routeNode");
const _useDeprecated = require("../useDeprecated");
const useNonStackAnchorWarning = __DEV__ ? function useNonStackAnchorWarning(// Tab and drawer routers default to `firstRoute`.
backBehavior = 'firstRoute') {
    const routeNode = (0, _Route.useRouteNode)();
    const anchor = (0, _routeNode.getValidInitialRouteName)(routeNode);
    (0, _useDeprecated.useWarnOnce)(`The navigator at "${routeNode?.contextKey}" sets the anchor "${anchor}", but its \`backBehavior\` is "${backBehavior}". Non-stack navigators go back to the anchor only when \`backBehavior\` is "initialRoute". Set \`backBehavior\` to "initialRoute", or remove the anchor.`, anchor !== undefined && backBehavior !== 'initialRoute', `non-stack-anchor:${routeNode?.contextKey}`);
} : (_backBehavior)=>{};

//# sourceMappingURL=useNonStackAnchorWarning.js.map
