"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    isEnabled: null,
    mark: null,
    unstable_PerformanceObserver: null,
    unstable_enablePerformanceIntegration: null,
    unstable_performance: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get isEnabled () {
        return _enable.isEnabled;
    },
    get mark () {
        return mark;
    },
    get unstable_PerformanceObserver () {
        return unstable_PerformanceObserver;
    },
    get unstable_enablePerformanceIntegration () {
        return _enable.unstable_enablePerformanceIntegration;
    },
    get unstable_performance () {
        return unstable_performance;
    }
});
const _enable = require("./enable");
function mark(name, detail) {
    if (!(0, _enable.isEnabled)()) {
        return;
    }
    try {
        performance.mark?.(name, {
            detail
        });
    } catch  {
    // `performance.mark` throws for a `detail` that cannot be cloned.
    }
}
const unstable_performance = globalThis.performance;
const unstable_PerformanceObserver = globalThis.PerformanceObserver;

//# sourceMappingURL=index.web.js.map
