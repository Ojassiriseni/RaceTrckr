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
const _stateKeys = require("../react-navigation/routers/stateKeys");
const _createSeededNavigationState = require("./createSeededNavigationState");
const _getPathForState = require("./getPathForState");
const _getRouteInfoFromState = require("./getRouteInfoFromState");
const _utils = require("./utils");
function createBrowserHistory(state, config) {
    const id = `${config.browserHistoryIdPrefix}:0`;
    const path = (0, _getPathForState.getPathForState)(state, config.linking);
    return {
        history: {
            entries: [
                {
                    id,
                    path,
                    state
                }
            ],
            index: 0,
            idPrefix: config.browserHistoryIdPrefix,
            entrySeq: 1
        },
        events: [
            createReplaceEvent(id, path)
        ]
    };
}
function createReplaceEvent(id, path) {
    return {
        type: 'browser-history',
        op: 'replace',
        entryId: id,
        path
    };
}
function applyRouterHistoryAction(history, nextState, config, action) {
    const path = (0, _getPathForState.getPathForState)(nextState, config.linking);
    if (action?.type === 'push') {
        return addHistoryEntry(history, nextState, path, 'push');
    }
    if (action?.type === 'pop') {
        const index = findBackDestinationIndex(history, action);
        return selectAndUpdateHistoryEntry(history, index, nextState, path);
    }
    // Push and pop change which tracked entry is current, so they need special handling above.
    // `replace` and no instruction both refresh this entry. An explicit `replace` only matters
    // while nested routers compose their instructions, where it can override a child push.
    return selectAndUpdateHistoryEntry(history, history.index, nextState, path);
}
/** Adds a snapshot and assigns its ID to a new or already-created browser entry. */ function addHistoryEntry(history, state, path, browserOperation) {
    const id = `${history.idPrefix}:${history.entrySeq}`;
    // Navigating after Back discards the forward branch: A -> B, Back, then C becomes A -> C.
    const entries = [
        ...history.entries.slice(0, history.index + 1),
        {
            id,
            path,
            state
        }
    ];
    return {
        history: {
            ...history,
            entries,
            index: entries.length - 1,
            entrySeq: history.entrySeq + 1
        },
        events: [
            {
                type: 'browser-history',
                op: browserOperation,
                entryId: id,
                path
            }
        ]
    };
}
/** Finds the browser entry for the pop target, falling back to the router's pop count. */ function findBackDestinationIndex(history, action) {
    const fallbackIndex = Math.max(0, history.index - action.count);
    const { target } = action;
    if (!target) {
        return fallbackIndex;
    }
    // A single parent pop can remove several entries created by a nested stack.
    const targetIndex = history.entries.findLastIndex((entry, index)=>index < history.index && isTargetRouteFocused(entry.state, target));
    return targetIndex === -1 ? fallbackIndex : targetIndex;
}
/** Checks whether the target is visible by following only the state's focused route branch. */ function isTargetRouteFocused(state, target) {
    let focusedState = state;
    while(focusedState && focusedState.key !== target.navigatorKey){
        focusedState = focusedState.routes[focusedState.index]?.state;
    }
    return focusedState?.routes[focusedState.index]?.key === target.routeKey;
}
/** Updates the selected snapshot and queues a browser move, if needed, followed by replacement. */ function selectAndUpdateHistoryEntry(history, index, state, path) {
    const updatedHistory = updateHistoryEntry(history, index, state, path);
    const events = [];
    if (index !== history.index) {
        // A router pop selected an earlier entry. Move the browser there before updating its URL;
        // replacing the current entry alone would leave the browser's Back/Forward position unchanged.
        events.push({
            type: 'browser-history',
            op: 'go',
            delta: index - history.index
        });
    }
    events.push(createReplaceEvent(updatedHistory.entries[index].id, path));
    return {
        history: updatedHistory,
        events
    };
}
/** Replaces a saved snapshot and selects it in memory without emitting browser commands. */ function updateHistoryEntry(history, index, state, path) {
    if (!Number.isInteger(index) || index < 0 || index >= history.entries.length) {
        throw new Error(`Invalid browser history index ${index} for ${history.entries.length} entries.`);
    }
    const entries = [
        ...history.entries
    ];
    entries[index] = {
        ...entries[index],
        path,
        state
    };
    return {
        ...history,
        entries,
        index
    };
}
function updateCurrentHistoryEntry(history, nextState, config) {
    return applyRouterHistoryAction(history, nextState, config);
}
function restoreNavigationFromBrowser(history, result, change, config, reduce) {
    const trackedEntry = history.entries.find((entry)=>entry.id === change.id);
    if (trackedEntry) {
        return restoreTrackedEntry(history, trackedEntry, result, change, config, reduce);
    }
    return restoreUntrackedEntry(history, result, change, config, reduce);
}
function restoreTrackedEntry(history, trackedEntry, result, change, config, reduce) {
    const trackedIndex = history.entries.indexOf(trackedEntry);
    const reduced = trackedEntry.path === change.path ? reduce(result, createResetIntent(trackedEntry.state)) : navigateToBrowserPath(history, trackedEntry.path, result, change.path, config, reduce);
    if (reduced.state === result.state) {
        // The restore was prevented, so move the browser back to the entry that matches the UI.
        return {
            result: reduced,
            history,
            events: trackedIndex === history.index ? [] : [
                {
                    type: 'browser-history',
                    op: 'go',
                    delta: history.index - trackedIndex
                }
            ]
        };
    }
    const path = (0, _getPathForState.getPathForState)(reduced.state, config.linking);
    return {
        result: reduced,
        history: updateHistoryEntry(history, trackedIndex, reduced.state, path),
        events: path === change.path ? [] : [
            createReplaceEvent(trackedEntry.id, path)
        ]
    };
}
function createResetIntent(state) {
    return {
        type: 'ACTION',
        payload: {
            action: {
                type: 'RESET',
                payload: state,
                target: state.key
            }
        }
    };
}
/** Navigates to a browser URL, preserving route state for hash-only changes. */ function navigateToBrowserPath(history, basePath, result, path, config, reduce) {
    // Only the hash changed, so the route keeps its state and gets the hash as a param.
    if (stripHash(path) === stripHash(basePath)) {
        return reduce(result, {
            type: 'NAVIGATE_TO_HREF',
            payload: {
                href: path,
                options: {
                    event: 'NAVIGATE'
                }
            }
        });
    }
    const state = parseNavigationStateFromPath(path, result.state, config);
    // A path outside the app falls back to the first entry.
    return reduce(result, createResetIntent(state ?? history.entries[0].state));
}
function stripHash(path) {
    const hashIndex = path.indexOf('#');
    return hashIndex === -1 ? path : path.slice(0, hashIndex);
}
/** Parses the URL and fills in route keys and initial routes required by the navigation tree. */ function parseNavigationStateFromPath(path, currentState, config) {
    const parsed = (0, _getPathForState.resolvePathLinking)(config.linking).getStateFromPath(path, config.linking?.config, (0, _getRouteInfoFromState.getRouteSegmentsFromState)(currentState));
    const routeNames = (0, _utils.getRootStackRouteNames)();
    if (!parsed || !parsed.routes.every((route)=>routeNames.includes(route.name))) {
        return undefined;
    }
    return config.routeNode ? (0, _createSeededNavigationState.createSeededRootState)(parsed, config.routeNode) : (0, _createSeededNavigationState.completeParsedState)(parsed, _stateKeys.ROOT_CHAIN);
}
function restoreUntrackedEntry(history, result, change, config, reduce) {
    const reduced = navigateToBrowserPath(history, history.entries[history.index].path, result, change.path, config, reduce);
    const path = (0, _getPathForState.getPathForState)(reduced.state, config.linking);
    if (change.id === null) {
        // The browser created this entry (e.g. a hash link). Assign an ID without pushing it again.
        return {
            result: reduced,
            ...addHistoryEntry(history, reduced.state, path, 'replace')
        };
    }
    // An ID from a previous page load has no saved snapshot. Start tracking from this entry.
    return {
        result: reduced,
        history: {
            ...history,
            entries: [
                {
                    id: change.id,
                    path,
                    state: reduced.state
                }
            ],
            index: 0
        },
        events: [
            createReplaceEvent(change.id, path)
        ]
    };
}

//# sourceMappingURL=browserHistory.js.map
