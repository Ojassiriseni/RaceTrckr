"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    collectMissingLayouts: null,
    getLayoutAnchor: null,
    loadLayouts: null,
    withLoadedLayouts: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get collectMissingLayouts () {
        return collectMissingLayouts;
    },
    get getLayoutAnchor () {
        return getLayoutAnchor;
    },
    get loadLayouts () {
        return loadLayouts;
    },
    get withLoadedLayouts () {
        return withLoadedLayouts;
    }
});
// The caches are keyed by `RouteNode`, so they reset when Fast Refresh builds a new route tree.
// Only read anchors are cached, so a layout that is still loading can be read again later.
const anchors = new WeakMap();
// Set while `collectMissingLayouts` runs. `getLayoutAnchor` is called from deep inside seeding and
// the reducer, so this is a module variable instead of a parameter passed through every function.
let collector;
function getLayoutAnchor(node) {
    if (node.type !== 'layout') {
        return undefined;
    }
    if (anchors.has(node)) {
        return anchors.get(node);
    }
    if (collector?.skipped.has(node)) {
        return undefined;
    }
    const loaded = loadLayout(node);
    if (loaded instanceof Promise) {
        collector?.missing.add(node);
        return undefined;
    }
    const anchor = readAnchor(node, loaded?.unstable_settings);
    anchors.set(node, anchor);
    return anchor;
}
function collectMissingLayouts(fn, skipped = new Set()) {
    const outerCollector = collector;
    const missing = new Set();
    collector = {
        missing,
        skipped
    };
    try {
        return {
            value: fn(),
            missing: [
                ...missing
            ]
        };
    } finally{
        collector = outerCollector;
    }
}
async function loadLayouts(nodes) {
    const loaded = await Promise.all(nodes.map(loadSingleLayout));
    return nodes.filter((_, index)=>!loaded[index]);
}
/** Loads the layout and returns whether it loaded. */ async function loadSingleLayout(node) {
    try {
        await loadLayout(node);
        return true;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`Expo Router could not load the layout "${node.contextKey}" to read its \`unstable_settings.anchor\`, so the anchor is skipped. Check the network connection and that the bundler is running.`, error);
        }
        return false;
    }
}
// On native, `loadRoute` returns a promise on every call, so keep the module once it loads.
const loadedLayouts = new WeakMap();
// Shares one `loadRoute` call between all reads made while a layout is loading.
const pendingLayouts = new WeakMap();
/** Returns the layout module, or a promise for it while it is loading. */ function loadLayout(node) {
    if (loadedLayouts.has(node)) {
        return loadedLayouts.get(node);
    }
    const pending = pendingLayouts.get(node);
    if (pending) {
        return pending;
    }
    const loaded = node.loadRoute();
    if (!isThenable(loaded)) {
        return loaded;
    }
    const promise = Promise.resolve(loaded).then((module1)=>{
        // In async import mode, the thenable resolves to the route module.
        loadedLayouts.set(node, module1);
        pendingLayouts.delete(node);
        return module1;
    }, (error)=>{
        // Allow a later read to retry the load.
        pendingLayouts.delete(node);
        throw error;
    });
    // A read that is not followed by `loadLayouts` must not cause an unhandled rejection.
    promise.catch(()=>{});
    pendingLayouts.set(node, promise);
    return promise;
}
function withLoadedLayouts(fn, skipped = new Set()) {
    const { value, missing } = collectMissingLayouts(fn, skipped);
    return missing.length === 0 ? value : loadLayouts(missing).then((failed)=>withLoadedLayouts(fn, new Set([
            ...skipped,
            ...failed
        ])));
}
function readAnchor(node, settings) {
    const groupName = node.groupName;
    const layoutAnchor = readLayoutAnchorSetting(settings);
    const groupAnchor = groupName ? readLayoutAnchorSetting(settings?.[groupName]) : undefined;
    const anchor = groupAnchor ?? layoutAnchor;
    if (!anchor) {
        return undefined;
    }
    const route = node.children.find((child)=>child.route === anchor) ?? node.children.find((child)=>child.route === `${anchor}/index`);
    if (!route) {
        throw new Error(`The initial route name "${anchor}"${groupAnchor ? ` for group "${groupName}"` : ''} was not found in the layout at "${node.contextKey}". ` + `Available routes are: ${node.children.map(({ route })=>`"${route}"`).join(', ')}. ` + 'Set `unstable_settings.anchor` to the name of a route in this layout.');
    }
    return route.route;
}
function readLayoutAnchorSetting(settings) {
    if (!settings) {
        return undefined;
    }
    try {
        warnIfInitialRouteNameIsUsed(settings);
        return settings.anchor ?? settings.initialRouteName;
    } catch (error) {
        if (error instanceof Error && !error.message.match(/You cannot dot into a client module/)) {
            throw error;
        }
        return undefined;
    }
}
function warnIfInitialRouteNameIsUsed(settings) {
    if (process.env.NODE_ENV !== 'production' && settings.initialRouteName !== undefined) {
        console.warn('`unstable_settings.initialRouteName` is deprecated. Use `unstable_settings.anchor` instead.');
    }
}
function isThenable(value) {
    return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

//# sourceMappingURL=layoutAnchor.js.map
