"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    isEnabled: null,
    unstable_enablePerformanceIntegration: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get isEnabled () {
        return isEnabled;
    },
    get unstable_enablePerformanceIntegration () {
        return unstable_enablePerformanceIntegration;
    }
});
let enabled = false;
function unstable_enablePerformanceIntegration() {
    enabled = true;
}
function isEnabled() {
    return enabled;
}

//# sourceMappingURL=enable.js.map
