"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createInitialState", {
    enumerable: true,
    get: function() {
        return createInitialState;
    }
});
const _stateKeys = require("../routers/stateKeys");
function createInitialState({ routeNames, initialRouteName, parentChain }) {
    const focusedRouteName = initialRouteName !== undefined && routeNames.includes(initialRouteName) ? initialRouteName : routeNames[0];
    const routes = [];
    const key = (0, _stateKeys.createNavigatorStateKey)(parentChain);
    const minter = (0, _stateKeys.createRouteKeyMinter)({
        key,
        routeKeySeq: 0
    });
    if (focusedRouteName !== undefined) {
        routes.push({
            key: minter.mint(focusedRouteName),
            name: focusedRouteName
        });
    }
    // TODO(@ubax): Improve these typings by distinguishing initial state from complete state types.
    // Router state types may narrow the shared metadata added later by actions.
    return {
        stale: false,
        key,
        routeKeySeq: minter.routeKeySeq,
        index: routes.length - 1,
        routeNames,
        routes
    };
}

//# sourceMappingURL=createInitialState.js.map
