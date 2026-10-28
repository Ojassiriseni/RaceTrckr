"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    NativeTabTrigger: null,
    NativeTabs: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get NativeTabTrigger () {
        return _NativeTabTrigger.NativeTabTrigger;
    },
    get NativeTabs () {
        return _NativeTabs.NativeTabs;
    }
});
const _NativeTabTrigger = require("./native-tabs/NativeTabTrigger");
const _NativeTabs = require("./native-tabs/NativeTabs");
console.warn('`expo-router/unstable-native-tabs` is deprecated. Use `expo-router/native-tabs` instead.');

//# sourceMappingURL=unstable-native-tabs.js.map
