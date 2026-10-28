"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "makePopAction", {
    enumerable: true,
    get: function() {
        return makePopAction;
    }
});
const _native = require("../../native");
function makePopAction(dispatch, stateKey) {
    return (count, sourceRouteKey)=>{
        dispatch({
            ..._native.StackActions.pop(count),
            source: sourceRouteKey,
            target: stateKey
        });
    };
}

//# sourceMappingURL=makePopAction.js.map
