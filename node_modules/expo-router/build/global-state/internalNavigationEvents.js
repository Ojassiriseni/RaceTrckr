"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "internalNavigationEvents", {
    enumerable: true,
    get: function() {
        return internalNavigationEvents;
    }
});
const subscribers = {
    actionDispatched: new Set(),
    routePreloaded: new Set()
};
const internalNavigationEvents = {
    addListener (name, callback) {
        subscribers[name].add(callback);
        return ()=>{
            subscribers[name].delete(callback);
        };
    },
    emit (name, event) {
        for (const callback of subscribers[name]){
            callback(event);
        }
    }
};

//# sourceMappingURL=internalNavigationEvents.js.map
