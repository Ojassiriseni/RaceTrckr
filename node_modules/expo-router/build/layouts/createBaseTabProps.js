"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createBaseTabProps", {
    enumerable: true,
    get: function() {
        return createBaseTabProps;
    }
});
function createBaseTabProps({ dispatch, isPreloaded, isRemovalPrevented, state }) {
    return {
        isPreloaded,
        isRemovalPrevented,
        routeNames: state.routeNames,
        preload: (name)=>dispatch({
                type: 'PRELOAD',
                payload: {
                    name
                }
            })
    };
}

//# sourceMappingURL=createBaseTabProps.js.map
