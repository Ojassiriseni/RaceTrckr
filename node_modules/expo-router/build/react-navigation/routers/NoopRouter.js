"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NoopRouter", {
    enumerable: true,
    get: function() {
        return NoopRouter;
    }
});
const _types = require("./types");
const NoopRouter = ()=>({
        getStateForDeclaredRoutes: (state)=>state,
        getStateForRouteFocus: (state)=>state,
        getStateForAction: ()=>_types.RouterActionHandling.Unhandled,
        shouldActionChangeFocus: ()=>false
    });

//# sourceMappingURL=NoopRouter.js.map
