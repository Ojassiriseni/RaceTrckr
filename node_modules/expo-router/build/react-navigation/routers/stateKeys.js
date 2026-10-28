"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    ROOT_CHAIN: null,
    createNavigatorStateKey: null,
    createRouteKeyMinter: null,
    getChainFromRouteKey: null,
    getChainFromStateKey: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ROOT_CHAIN () {
        return ROOT_CHAIN;
    },
    get createNavigatorStateKey () {
        return createNavigatorStateKey;
    },
    get createRouteKeyMinter () {
        return createRouteKeyMinter;
    },
    get getChainFromRouteKey () {
        return getChainFromRouteKey;
    },
    get getChainFromStateKey () {
        return getChainFromStateKey;
    }
});
const ROOT_CHAIN = 'root';
function createNavigatorStateKey(parentChain) {
    return `navigator:${parentChain}`;
}
function getChainFromRouteKey(routeKey) {
    const separatorIndex = routeKey.lastIndexOf(':');
    if (process.env.NODE_ENV !== 'production' && separatorIndex === -1) {
        console.warn(`The route key "${routeKey}" has no chain separator. Expo Router-generated route keys include a ":" separator.`);
    }
    return routeKey.slice(separatorIndex + 1);
}
function getChainFromStateKey(stateKey) {
    return stateKey.slice('navigator:'.length);
}
function createRouteKeyMinter(state) {
    const parentChain = getChainFromStateKey(state.key);
    let routeKeySeq = state.routeKeySeq;
    return {
        mint (name) {
            const chain = parentChain === ROOT_CHAIN ? `${routeKeySeq}` : `${parentChain}-${routeKeySeq}`;
            routeKeySeq += 1;
            return `${name}:${chain}`;
        },
        get routeKeySeq () {
            return routeKeySeq;
        }
    };
}

//# sourceMappingURL=stateKeys.js.map
