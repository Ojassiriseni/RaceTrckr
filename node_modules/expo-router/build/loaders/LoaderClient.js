"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoaderClient", {
    enumerable: true,
    get: function() {
        return LoaderClient;
    }
});
class LoaderClient {
    active = new Map();
    fetchers = new Map();
    subscribeLoader(path, callback = ()=>{}, { committed = false } = {}) {
        const source = this.getOrCreateSource(path);
        const subscription = {
            callback,
            committed
        };
        source.onTeardown = undefined;
        source.subscribers.add(subscription);
        let subscribed = true;
        return (onSourceTeardown)=>{
            if (!subscribed) {
                return;
            }
            subscribed = false;
            source.subscribers.delete(subscription);
            if (source.subscribers.size === 0) {
                this.scheduleTeardown(path, source, onSourceTeardown);
            }
        };
    }
    registerFetcher(path, fetcher) {
        this.fetchers.set(path, fetcher);
    }
    /** Aborts and detaches a source unless a committed reader still owns it. */ abort(path) {
        const source = this.active.get(path);
        if (!source) {
            return false;
        }
        const hasCommittedSubscription = [
            ...source.subscribers
        ].some((subscriber)=>subscriber.committed);
        if (hasCommittedSubscription) {
            return false;
        }
        // Detach before aborting because an abort listener may synchronously start replacement work.
        this.active.delete(path);
        source.onTeardown = undefined;
        source.subscribers.clear();
        this.abortSourceRequest(source);
        return true;
    }
    execute(path, fetcher) {
        if (fetcher) {
            this.fetchers.set(path, fetcher);
        }
        const source = this.active.get(path);
        const fetcherFn = this.fetchers.get(path);
        if (!source || !fetcherFn || source.controller) {
            return;
        }
        const controller = new AbortController();
        source.controller = controller;
        let request;
        try {
            request = fetcherFn(path, {
                signal: controller.signal
            });
        } catch (error) {
            request = Promise.reject(error);
        }
        request.then((data)=>this.settle(path, source, controller, {
                data
            }), (error)=>this.settle(path, source, controller, {
                error: new Error(`Failed to load loader data for route: ${path}`, {
                    cause: error
                })
            }));
    }
    revalidate() {
        const livePaths = new Set();
        for (const [path, source] of this.active){
            if (source.subscribers.size > 0) {
                livePaths.add(path);
                this.abortSourceRequest(source);
                this.execute(path);
            } else {
                this.active.delete(path);
                source.onTeardown = undefined;
                source.subscribers.clear();
                this.abortSourceRequest(source);
            }
        }
        return livePaths;
    }
    clear() {
        const sources = [
            ...this.active.values()
        ];
        this.active.clear();
        this.fetchers.clear();
        for (const source of sources){
            source.onTeardown = undefined;
            source.subscribers.clear();
            this.abortSourceRequest(source);
        }
    }
    getOrCreateSource(path) {
        let source = this.active.get(path);
        if (!source) {
            source = {
                subscribers: new Set(),
                controller: null
            };
            this.active.set(path, source);
        }
        return source;
    }
    scheduleTeardown(path, source, onSourceTeardown) {
        const onTeardown = ()=>{
            if (source.onTeardown === onTeardown && source.subscribers.size === 0 && this.active.get(path) === source) {
                this.active.delete(path);
                source.onTeardown = undefined;
                this.abortSourceRequest(source);
                onSourceTeardown?.();
            }
        };
        source.onTeardown = onTeardown;
        queueMicrotask(onTeardown);
    }
    abortSourceRequest(source) {
        const controller = source.controller;
        source.controller = null;
        controller?.abort();
    }
    settle(path, source, controller, result) {
        if (source.controller === controller) {
            source.controller = null;
        }
        if (controller.signal.aborted) {
            return;
        }
        const isCurrentSource = this.active.get(path) === source;
        for (const { callback } of source.subscribers){
            callback(result, isCurrentSource);
        }
    }
}

//# sourceMappingURL=LoaderClient.js.map
