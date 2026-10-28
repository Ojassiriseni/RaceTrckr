"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    abandonLoaderPath: null,
    scheduleAbandonLoaderPath: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get abandonLoaderPath () {
        return abandonLoaderPath;
    },
    get scheduleAbandonLoaderPath () {
        return scheduleAbandonLoaderPath;
    }
});
function abandonLoaderPath({ client, store }, path) {
    const entry = store.get(path);
    if (!(entry instanceof Promise)) {
        return;
    }
    if (!client.abort(path)) {
        return;
    }
    if (store.get(path) === entry) {
        store.clear(path);
    }
}
function scheduleAbandonLoaderPath(ctx, path) {
    let cancelled = false;
    queueMicrotask(()=>{
        if (!cancelled) {
            abandonLoaderPath(ctx, path);
        }
    });
    return ()=>{
        cancelled = true;
    };
}

//# sourceMappingURL=abandonLoaderPath.js.map
