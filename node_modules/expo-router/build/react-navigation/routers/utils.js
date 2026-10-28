"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isActionHandled", {
    enumerable: true,
    get: function() {
        return isActionHandled;
    }
});
const _types = require("./types");
function isActionHandled(result) {
    return result !== null && result !== _types.RouterActionHandling.Unhandled;
}

//# sourceMappingURL=utils.js.map
