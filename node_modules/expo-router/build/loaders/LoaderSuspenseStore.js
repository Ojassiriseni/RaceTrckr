"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoaderSuspenseStore", {
    enumerable: true,
    get: function() {
        return LoaderSuspenseStore;
    }
});
class LoaderSuspenseStore {
    entries = new Map();
    reclaim = new Set();
    get(key) {
        return this.entries.get(key);
    }
    set(key, entry) {
        this.reclaim.delete(key);
        this.entries.set(key, entry);
    }
    seed(key, data) {
        if (!this.entries.has(key)) {
            this.set(key, {
                data
            });
        }
    }
    clear(key) {
        this.reclaim.delete(key);
        this.entries.delete(key);
    }
    dispose(key) {
        this.reclaim.add(key);
    }
    teardown(key) {
        if (this.reclaim.delete(key)) {
            this.entries.delete(key);
        }
    }
    retain(livePaths) {
        for (const path of this.entries.keys()){
            if (!livePaths.has(path)) {
                this.clear(path);
            }
        }
    }
    reset() {
        this.entries.clear();
        this.reclaim.clear();
    }
}

//# sourceMappingURL=LoaderSuspenseStore.js.map
