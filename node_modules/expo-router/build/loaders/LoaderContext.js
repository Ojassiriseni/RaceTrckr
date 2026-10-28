"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    LoaderContext: null,
    createLoaderContextValue: null,
    defaultLoaderContextValue: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get LoaderContext () {
        return LoaderContext;
    },
    get createLoaderContextValue () {
        return createLoaderContextValue;
    },
    get defaultLoaderContextValue () {
        return defaultLoaderContextValue;
    }
});
function _react() {
    const data = require("react");
    _react = function() {
        return data;
    };
    return data;
}
const _LoaderClient = require("./LoaderClient");
const _LoaderSuspenseStore = require("./LoaderSuspenseStore");
const _utils = require("./utils");
function createLoaderContextValue(client) {
    return {
        client,
        store: new _LoaderSuspenseStore.LoaderSuspenseStore()
    };
}
const defaultLoaderContextValue = createLoaderContextValue(new _LoaderClient.LoaderClient());
const LoaderContext = (0, _react().createContext)(defaultLoaderContextValue);
// On `loader-invalidate`, drop any unconsumed server-injected data, bump the dev revision so
// refetches bypass the platform cache, and refresh live readers in place.
if (__DEV__ && typeof window !== 'undefined') {
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__ ??= [];
    if (!globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__) {
        globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__ = true;
        globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__.push(()=>{
            delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
            (0, _utils.bumpDevLoaderRevision)();
            const { client, store } = defaultLoaderContextValue;
            store.retain(client.revalidate());
        });
    }
}

//# sourceMappingURL=LoaderContext.js.map
