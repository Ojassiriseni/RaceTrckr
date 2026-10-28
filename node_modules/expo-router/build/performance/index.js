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
const MAX_BUFFERED_ENTRIES = 250;
let entries = [];
const observers = new Map();
function createEntryList(list) {
    return {
        getEntries: ()=>[
                ...list
            ],
        getEntriesByName: (name, type)=>type === undefined || type === 'mark' ? list.filter((entry)=>entry.name === name) : [],
        getEntriesByType: (type)=>type === 'mark' ? [
                ...list
            ] : []
    };
}
function createMark(name, detail) {
    const json = {
        entryType: 'mark',
        name,
        startTime: performance.now(),
        duration: 0,
        detail
    };
    return {
        ...json,
        toJSON: ()=>json
    };
}
function notify(observer, callback, list) {
    try {
        callback(list, observer);
    } catch (error) {
        console.error('[expo-router] An unstable_PerformanceObserver callback threw:', error);
    }
}
function mark(name, detail) {
    if (!(0, _enable.isEnabled)()) {
        return;
    }
    const entry = createMark(name, detail);
    entries.push(entry);
    if (entries.length > MAX_BUFFERED_ENTRIES) {
        entries.shift();
    }
    try {
        performance.mark?.(name, {
            detail,
            startTime: entry.startTime
        });
    } catch  {
    // `performance.mark` throws for a `detail` that cannot be cloned.
    }
    const list = createEntryList([
        entry
    ]);
    for (const [observer, callback] of observers){
        notify(observer, callback, list);
    }
}
const unstable_performance = {
    getEntries: ()=>[
            ...entries
        ],
    getEntriesByName: (name, type)=>createEntryList(entries).getEntriesByName(name, type),
    getEntriesByType: (type)=>createEntryList(entries).getEntriesByType(type),
    clearMarks (name) {
        entries = name ? entries.filter((entry)=>entry.name !== name) : [];
    }
};
class unstable_PerformanceObserver {
    callback;
    static supportedEntryTypes = [
        'mark'
    ];
    constructor(callback){
        this.callback = callback;
    }
    /**
   * Starts to observe marks. With `buffered: true`, the callback first receives the marks
   * recorded before this call.
   */ observe(options) {
        if (options?.type !== 'mark' && !options?.entryTypes?.includes('mark')) {
            return;
        }
        observers.set(this, this.callback);
        if (options.buffered && entries.length > 0) {
            notify(this, this.callback, createEntryList([
                ...entries
            ]));
        }
    }
    /**
   * Stops the observer from receiving marks.
   */ disconnect() {
        observers.delete(this);
    }
    /**
   * Always returns an empty list, because the callback receives each mark when it is recorded.
   */ takeRecords() {
        return [];
    }
}

//# sourceMappingURL=index.js.map
