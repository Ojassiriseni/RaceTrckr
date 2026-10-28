"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "readLoaderData", {
    enumerable: true,
    get: function() {
        return readLoaderData;
    }
});
function readLoaderData({ client, store }, resolvedPath, fetcher) {
    const suspended = store.get(resolvedPath);
    if (suspended instanceof Promise) {
        return suspended;
    }
    if (suspended) {
        if ('error' in suspended) {
            queueMicrotask(()=>{
                if (store.get(resolvedPath) === suspended) {
                    store.clear(resolvedPath);
                }
            });
            throw suspended.error;
        }
        return suspended.data;
    }
    const promise = new Promise((resolve, reject)=>{
        const unsubscribe = client.subscribeLoader(resolvedPath, (result, isCurrentSource)=>{
            if (isCurrentSource && store.get(resolvedPath) === promise) {
                store.set(resolvedPath, result);
            }
            unsubscribe();
            if ('error' in result) {
                reject(result.error);
            } else {
                resolve(result.data);
            }
        });
        client.execute(resolvedPath, fetcher);
    });
    store.set(resolvedPath, promise);
    return promise;
}

//# sourceMappingURL=readLoaderData.js.map
