"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "requireExpoUI", {
    enumerable: true,
    get: function() {
        return requireExpoUI;
    }
});
let expoUI;
let modifiers;
try {
    const loadedExpoUI = require('@expo/ui/jetpack-compose');
    const loadedModifiers = require('@expo/ui/jetpack-compose/modifiers');
    expoUI = loadedExpoUI;
    modifiers = loadedModifiers;
} catch  {}
function requireExpoUI(errorMessage = "The '@expo/ui' package needs to be installed in order to use this feature.") {
    if (!expoUI || !modifiers) {
        throw new Error(errorMessage);
    }
    return {
        expoUI,
        modifiers
    };
}

//# sourceMappingURL=expo-ui.js.map
