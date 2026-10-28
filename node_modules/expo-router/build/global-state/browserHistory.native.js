"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    applyRouterHistoryAction: null,
    createBrowserHistory: null,
    restoreNavigationFromBrowser: null,
    updateCurrentHistoryEntry: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get applyRouterHistoryAction () {
        return applyRouterHistoryAction;
    },
    get createBrowserHistory () {
        return createBrowserHistory;
    },
    get restoreNavigationFromBrowser () {
        return restoreNavigationFromBrowser;
    },
    get updateCurrentHistoryEntry () {
        return updateCurrentHistoryEntry;
    }
});
function createBrowserHistory() {
    return {
        history: undefined,
        events: []
    };
}
function applyRouterHistoryAction(history) {
    return {
        history,
        events: []
    };
}
function updateCurrentHistoryEntry(history) {
    return {
        history,
        events: []
    };
}
function restoreNavigationFromBrowser(history, result) {
    return {
        result,
        history,
        events: []
    };
}

//# sourceMappingURL=browserHistory.native.js.map
