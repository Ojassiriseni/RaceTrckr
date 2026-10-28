"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "requireExpoSymbols", {
    enumerable: true,
    get: function() {
        return requireExpoSymbols;
    }
});
let expoSymbols;
try {
    expoSymbols = require('expo-symbols');
} catch  {}
function requireExpoSymbols(errorMessage = "The 'expo-symbols' package needs to be installed in order to use this feature.") {
    if (!expoSymbols) {
        throw new Error(errorMessage);
    }
    return expoSymbols;
}

//# sourceMappingURL=expo-symbols.js.map
