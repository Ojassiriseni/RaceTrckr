"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    enableLegacyHeaderAppearance: null,
    getPlatformHeaderTransparent: null,
    isLegacyHeaderAppearanceEnabled: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get enableLegacyHeaderAppearance () {
        return enableLegacyHeaderAppearance;
    },
    get getPlatformHeaderTransparent () {
        return getPlatformHeaderTransparent;
    },
    get isLegacyHeaderAppearanceEnabled () {
        return isLegacyHeaderAppearanceEnabled;
    }
});
function _reactnative() {
    const data = require("react-native");
    _reactnative = function() {
        return data;
    };
    return data;
}
let isLegacyHeaderAppearance = false;
function enableLegacyHeaderAppearance() {
    isLegacyHeaderAppearance = true;
}
function isLegacyHeaderAppearanceEnabled() {
    return isLegacyHeaderAppearance;
}
function getPlatformHeaderTransparent(headerTransparent) {
    return typeof headerTransparent === 'object' ? _reactnative().Platform.select(headerTransparent) : headerTransparent;
}

//# sourceMappingURL=headerAppearance.js.map
