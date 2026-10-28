"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureStateType", {
    enumerable: true,
    get: function() {
        return ensureStateType;
    }
});
function ensureStateType(state, type) {
    if (state.type != null) {
        // The null check guarantees the optional property required by the return type.
        return state;
    }
    return {
        ...state,
        type
    };
}

//# sourceMappingURL=ensureStateType.js.map
