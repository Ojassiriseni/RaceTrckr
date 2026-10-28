"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createNativeStackProps", {
    enumerable: true,
    get: function() {
        return createNativeStackProps;
    }
});
const _createBaseStackProps = require("./stack-utils/createBaseStackProps");
function createNativeStackProps(args) {
    return {
        ...(0, _createBaseStackProps.createBaseStackProps)(args),
        removeRoutes: (routeNames)=>args.dispatch({
                type: 'REMOVE_ROUTES',
                payload: {
                    routeNames
                }
            })
    };
}

//# sourceMappingURL=createNativeStackProps.js.map
